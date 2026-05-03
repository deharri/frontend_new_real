import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { chatApi } from '../api/chat';
import { CHAT_BASE_URL } from '../api/chatClient';
import { logger } from '../utils/logger';
import {
  ConversationResponse,
  WebSocketMessage,
  TypingIndicator,
  MessageResponse,
  WorkerLocationUpdate,
} from '../types';

const TAG = 'ChatContext';

interface ChatContextType {
  conversations: ConversationResponse[];
  isConnected: boolean;
  typingUsers: Record<string, string>;
  totalUnread: number;
  loadConversations: () => Promise<void>;
  sendWsMessage: (conversationId: string, content: string) => void;
  sendTypingIndicator: (conversationId: string, typing: boolean) => void;
  subscribeToConversation: (conversationId: string) => void;
  unsubscribeFromConversation: (conversationId: string) => void;
  onNewMessage: (handler: (msg: WebSocketMessage) => void) => () => void;
  updateConversationLastMessage: (conversationId: string, msg: MessageResponse) => void;
  publishLocation: (jobId: string, latitude: number, longitude: number) => void;
  subscribeToLocation: (jobId: string, callback: (update: WorkerLocationUpdate) => void) => void;
  unsubscribeFromLocation: (jobId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const stompClient = useRef<Client | null>(null);
  const subscriptions = useRef<Record<string, any>>({});
  const messageHandlers = useRef<Set<(msg: WebSocketMessage) => void>>(new Set());
  const typingTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const loadConversations = useCallback(async () => {
    try {
      const res = await chatApi.getConversations(0, 50);
      setConversations(res.data.content);
    } catch (err: any) {
      logger.error(TAG, 'Failed to load conversations', err.message);
    }
  }, []);

  const updateConversationLastMessage = useCallback((conversationId: string, msg: MessageResponse) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          lastMessage: {
            content: msg.content || '',
            senderId: msg.senderId,
            senderUsername: msg.senderUsername,
            type: msg.type,
            sentAt: msg.createdAt,
          },
          updatedAt: msg.createdAt,
        };
      });
      return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
  }, []);

  const handleIncomingMessage = useCallback((wsMsg: WebSocketMessage) => {
    // Update conversation list
    setConversations(prev => {
      const exists = prev.find(c => c.id === wsMsg.conversationId);
      if (exists) {
        const updated = prev.map(c => {
          if (c.id !== wsMsg.conversationId) return c;
          return {
            ...c,
            lastMessage: {
              content: wsMsg.content || '',
              senderId: wsMsg.senderId,
              senderUsername: wsMsg.senderUsername,
              type: wsMsg.type,
              sentAt: wsMsg.timestamp,
            },
            unreadCount: wsMsg.senderId !== user?.userId ? c.unreadCount + 1 : c.unreadCount,
            updatedAt: wsMsg.timestamp,
          };
        });
        return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      return prev;
    });

    // Notify message handlers (ChatDetailScreen uses this)
    messageHandlers.current.forEach(handler => handler(wsMsg));
  }, [user?.userId]);

  const handleTypingIndicator = useCallback((indicator: TypingIndicator) => {
    if (indicator.userId === user?.userId) return;

    if (indicator.typing) {
      setTypingUsers(prev => ({ ...prev, [indicator.conversationId]: indicator.username }));
      // Clear typing after 3 seconds
      if (typingTimers.current[indicator.conversationId]) {
        clearTimeout(typingTimers.current[indicator.conversationId]);
      }
      typingTimers.current[indicator.conversationId] = setTimeout(() => {
        setTypingUsers(prev => {
          const next = { ...prev };
          delete next[indicator.conversationId];
          return next;
        });
      }, 3000);
    } else {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[indicator.conversationId];
        return next;
      });
    }
  }, [user?.userId]);

  const connect = useCallback(async () => {
    if (stompClient.current?.connected) return;

    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return;

    const sockJsUrl = `${CHAT_BASE_URL}/ws/chat?token=${token}`;
    logger.info(TAG, `Connecting WebSocket to ${CHAT_BASE_URL}/ws/chat`);

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        logger.info(TAG, 'WebSocket connected');
        setIsConnected(true);
        // Reload conversations after WebSocket connects so subscriptions work
        loadConversations();
      },
      onDisconnect: () => {
        logger.info(TAG, 'WebSocket disconnected');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        logger.error(TAG, 'STOMP error', frame.headers?.message || frame.body);
      },
    });

    client.activate();
    stompClient.current = client;
  }, [loadConversations]);

  const disconnect = useCallback(() => {
    if (stompClient.current) {
      stompClient.current.deactivate();
      stompClient.current = null;
    }
    setIsConnected(false);
    subscriptions.current = {};
  }, []);

  const subscribeToConversation = useCallback((conversationId: string) => {
    const client = stompClient.current;
    if (!client?.connected) return;

    // Already subscribed
    if (subscriptions.current[`msg_${conversationId}`]) return;

    // Subscribe to messages
    subscriptions.current[`msg_${conversationId}`] = client.subscribe(
      `/topic/conversation/${conversationId}`,
      (message: IMessage) => {
        try {
          const wsMsg: WebSocketMessage = JSON.parse(message.body);
          handleIncomingMessage(wsMsg);
        } catch (e) {
          logger.error(TAG, 'Failed to parse message', e);
        }
      }
    );

    // Subscribe to typing
    subscriptions.current[`typing_${conversationId}`] = client.subscribe(
      `/topic/conversation/${conversationId}/typing`,
      (message: IMessage) => {
        try {
          const indicator: TypingIndicator = JSON.parse(message.body);
          handleTypingIndicator(indicator);
        } catch (e) {
          logger.error(TAG, 'Failed to parse typing indicator', e);
        }
      }
    );

    logger.info(TAG, `Subscribed to conversation ${conversationId}`);
  }, [handleIncomingMessage, handleTypingIndicator]);

  const unsubscribeFromConversation = useCallback((conversationId: string) => {
    const msgSub = subscriptions.current[`msg_${conversationId}`];
    const typingSub = subscriptions.current[`typing_${conversationId}`];
    if (msgSub) { msgSub.unsubscribe(); delete subscriptions.current[`msg_${conversationId}`]; }
    if (typingSub) { typingSub.unsubscribe(); delete subscriptions.current[`typing_${conversationId}`]; }
  }, []);

  const sendWsMessage = useCallback((conversationId: string, content: string) => {
    const client = stompClient.current;
    if (!client?.connected) {
      logger.warn(TAG, 'Cannot send: WebSocket not connected');
      return;
    }
    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        conversationId,
        type: 'TEXT',
        content,
      }),
    });
  }, []);

  const sendTypingIndicator = useCallback((conversationId: string, typing: boolean) => {
    const client = stompClient.current;
    if (!client?.connected) return;
    client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId, typing }),
    });
  }, []);

  const onNewMessage = useCallback((handler: (msg: WebSocketMessage) => void) => {
    messageHandlers.current.add(handler);
    return () => { messageHandlers.current.delete(handler); };
  }, []);

  const publishLocation = useCallback((jobId: string, latitude: number, longitude: number) => {
    const client = stompClient.current;
    if (!client?.connected) return;
    client.publish({
      destination: `/topic/location/${jobId}`,
      body: JSON.stringify({
        workerId: user?.userId ?? '',
        jobId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      }),
    });
  }, [user?.userId]);

  const subscribeToLocation = useCallback((jobId: string, callback: (update: WorkerLocationUpdate) => void) => {
    const client = stompClient.current;
    if (!client?.connected || subscriptions.current[`loc_${jobId}`]) return;
    subscriptions.current[`loc_${jobId}`] = client.subscribe(
      `/topic/location/${jobId}`,
      (message: IMessage) => {
        try {
          const update: WorkerLocationUpdate = JSON.parse(message.body);
          callback(update);
        } catch (e) {
          logger.error(TAG, 'Failed to parse location update', e);
        }
      },
    );
    logger.info(TAG, `Subscribed to location for job ${jobId}`);
  }, []);

  const unsubscribeFromLocation = useCallback((jobId: string) => {
    const sub = subscriptions.current[`loc_${jobId}`];
    if (sub) {
      sub.unsubscribe();
      delete subscriptions.current[`loc_${jobId}`];
      logger.info(TAG, `Unsubscribed from location for job ${jobId}`);
    }
  }, []);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (isLoggedIn) {
      connect();
      loadConversations();
    } else {
      disconnect();
      setConversations([]);
      setTypingUsers({});
    }
    return () => disconnect();
  }, [isLoggedIn]);

  // Reconnect on app foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isLoggedIn) {
        if (!stompClient.current?.connected) {
          connect();
        }
        loadConversations();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isLoggedIn, connect, loadConversations]);

  // Subscribe to all loaded conversations
  useEffect(() => {
    if (!isConnected) return;
    conversations.forEach(c => subscribeToConversation(c.id));
  }, [isConnected, conversations, subscribeToConversation]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        isConnected,
        typingUsers,
        totalUnread,
        loadConversations,
        sendWsMessage,
        sendTypingIndicator,
        subscribeToConversation,
        unsubscribeFromConversation,
        onNewMessage,
        updateConversationLastMessage,
        publishLocation,
        subscribeToLocation,
        unsubscribeFromLocation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
