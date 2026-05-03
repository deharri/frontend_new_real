import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Dimensions,
  ScrollView,
  Clipboard,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useWorker } from '../context/WorkerContext';
import { chatApi } from '../api/chat';
import { jobsApi } from '../api/jobs';
import { trackingApi } from '../api/trackingApi';
import { useLocation } from '../context/LocationContext';
import { workersApi } from '../api/workers';
import { OfferCard } from '../components/OfferCard';
import { TypingIndicator } from '../components/TypingIndicator';
import { MessageResponse, WebSocketMessage, RootStackParamList, WorkerType, PakistanCity, ConversationResponse, JobListingResponse, CreateJobFromOffer } from '../types';
import { logger } from '../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAG = 'ChatDetail';

// Cache for presigned media URLs (messageId -> url)
const mediaUrlCache: Record<string, string> = {};

function ChatImage({ messageId, style }: { messageId: string; style: any }) {
  const [uri, setUri] = useState<string | null>(mediaUrlCache[messageId] || null);
  const [loading, setLoading] = useState(!mediaUrlCache[messageId]);

  useEffect(() => {
    if (mediaUrlCache[messageId]) return;
    let cancelled = false;
    chatApi.getMediaUrl(messageId).then(res => {
      if (cancelled) return;
      mediaUrlCache[messageId] = res.data.url;
      setUri(res.data.url);
    }).catch(err => {
      logger.error(TAG, 'Failed to get media URL', err.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [messageId]);

  if (loading || !uri) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate200 }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return <Image source={{ uri }} style={style} resizeMode="cover" />;
}

type RouteType = RouteProp<RootStackParamList, 'ChatDetail'>;

// Format time for message bubbles
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Format date for separators
function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDate.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Check if two dates are on different days
function isDifferentDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() !== db.toDateString();
}

const WORKER_TYPE_OPTIONS: { value: WorkerType; label: string }[] = [
  { value: 'PLUMBER', label: 'Plumber' },
  { value: 'ELECTRICIAN', label: 'Electrician' },
  { value: 'MECHANIC', label: 'Mechanic' },
  { value: 'CARPENTER', label: 'Carpenter' },
  { value: 'PAINTER', label: 'Painter' },
  { value: 'MASON', label: 'Mason' },
  { value: 'WELDER', label: 'Welder' },
  { value: 'HVAC_TECHNICIAN', label: 'AC Technician' },
  { value: 'GENERAL_LABORER', label: 'General' },
];

const CITY_OPTIONS: { value: PakistanCity; label: string }[] = [
  { value: 'ISLAMABAD', label: 'Islamabad' },
  { value: 'RAWALPINDI', label: 'Rawalpindi' },
  { value: 'LAHORE', label: 'Lahore' },
  { value: 'KARACHI', label: 'Karachi' },
  { value: 'FAISALABAD', label: 'Faisalabad' },
  { value: 'MULTAN', label: 'Multan' },
  { value: 'PESHAWAR', label: 'Peshawar' },
  { value: 'QUETTA', label: 'Quetta' },
  { value: 'SIALKOT', label: 'Sialkot' },
  { value: 'GUJRANWALA', label: 'Gujranwala' },
];

export function ChatDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isWorkerMode } = useWorker();
  const {
    typingUsers,
    sendWsMessage,
    sendTypingIndicator,
    subscribeToConversation,
    onNewMessage,
    updateConversationLastMessage,
  } = useChat();

  const { currentLocation, requestPermission } = useLocation();

  const { conversationId, participantName, participantAvatar } = route.params;

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [offerLoading, setOfferLoading] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerDays, setOfferDays] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerTitle, setOfferTitle] = useState('');
  const [offerWorkerType, setOfferWorkerType] = useState<WorkerType | ''>('');
  const [offerCity, setOfferCity] = useState<PakistanCity | ''>('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationResponse | null>(null);
  const [linkedJob, setLinkedJob] = useState<JobListingResponse | null>(null);

  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const isTyping = !!typingUsers[conversationId];
  const initial = (participantName || '?').charAt(0).toUpperCase();
  const otherParticipant = conversation?.participants.find(p => p.userId !== user?.userId);
  const isSelf = otherParticipant?.userId === user?.userId;
  const canSendOffer = !isSelf && (otherParticipant?.role === 'WORKER' || otherParticipant?.role === 'AGENCY');
  const isOtherWorker = otherParticipant?.role === 'WORKER';
  const isAgency = otherParticipant?.role === 'AGENCY';

  // Derive the most recent accepted offer message (for Track Worker button)
  const acceptedOffer = messages.find(m => m.type === 'OFFER' && m.offer?.status === 'ACCEPTED') ?? null;

  const handleAvatarPress = async () => {
    if (!otherParticipant) return;
    if (isAgency) return;
    if (isOtherWorker) {
      try {
        const res = await workersApi.getAllWorkers();
        console.log("All Workers: " + res.data);
        console.log(participantName);
        const match = res.data.find(w =>
          w.username === participantName ||
          w.firstName === (participantName || '').split(' ')[0]
        );
        if (match) {
          (navigation as any).navigate('WorkerDetail', { workerId: match.workerId });
        } else {
          Alert.alert('Not found', 'Could not find worker profile.');
        }
      } catch {
        Alert.alert('Error', 'Could not load worker profile.');
      }
    } else {
      (navigation as any).navigate('UserProfile', { userId: otherParticipant.userId });
    }
  };

  // Load initial messages and conversation details
  useEffect(() => {
    loadMessages();
    subscribeToConversation(conversationId);
    chatApi.markAsRead(conversationId).catch(() => {});
    chatApi.getConversation(conversationId).then(res => setConversation(res.data)).catch(() => {});

    return () => {};
  }, [conversationId]);

  // Fetch linked job when conversation has an orderId
  useEffect(() => {
    if (conversation?.type === 'ORDER' && conversation?.metadata?.orderId) {
      jobsApi.getListingById(conversation.metadata.orderId)
        .then(res => setLinkedJob(res.data))
        .catch(() => setLinkedJob(null));
    }
  }, [conversation?.metadata?.orderId, conversation?.type]);

  // Listen for WebSocket messages
  useEffect(() => {
    const unsub = onNewMessage((wsMsg: WebSocketMessage) => {
      if (wsMsg.conversationId !== conversationId) return;

      const newMsg: MessageResponse = {
        id: wsMsg.id,
        conversationId: wsMsg.conversationId,
        senderId: wsMsg.senderId,
        senderUsername: wsMsg.senderUsername,
        type: wsMsg.type,
        content: wsMsg.content || '',
        media: null,
        offer: null,
        status: 'SENT',
        createdAt: wsMsg.timestamp,
        editedAt: null,
      };

      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev];
      });

      // Mark as read if from other user
      if (wsMsg.senderId !== user?.userId) {
        chatApi.markAsRead(conversationId).catch(() => {});
      }
    });

    return unsub;
  }, [conversationId, onNewMessage, user?.userId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await chatApi.getMessages(conversationId);
      setMessages(res.data.messages);
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    } catch (err: any) {
      logger.error(TAG, 'Failed to load messages', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    try {
      setLoadingMore(true);
      const res = await chatApi.getMessages(conversationId, nextCursor);
      setMessages(prev => [...prev, ...res.data.messages]);
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    } catch (err: any) {
      logger.error(TAG, 'Failed to load more messages', err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    try {
      const res = await chatApi.sendMessage(conversationId, { type: 'TEXT', content: text });
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [res.data, ...prev];
      });
      updateConversationLastMessage(conversationId, res.data);
    } catch (err: any) {
      logger.error(TAG, 'Failed to send message', err.message);
      setInputText(text); // Restore text on failure
      Alert.alert('Error', 'Could not send message. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendOffer = async () => {
    const amount = parseFloat(offerAmount);
    const days = parseInt(offerDays);
    if (!amount || amount <= 0 || !days || days < 1) {
      Alert.alert('Error', 'Please enter valid amount and days.');
      return;
    }
    // Consumer must fill title, workerType, city
    if (!isWorkerMode) {
      if (!offerTitle.trim()) {
        Alert.alert('Error', 'Please enter a job title.');
        return;
      }
      if (!offerWorkerType) {
        Alert.alert('Error', 'Please select a worker type.');
        return;
      }
      if (!offerCity) {
        Alert.alert('Error', 'Please select a city.');
        return;
      }
    }

    try {
      setSending(true);
      // Build description that encodes job info for consumer offers
      const description = isWorkerMode
        ? (offerDesc.trim() || 'Service offer')
        : JSON.stringify({
            jobTitle: offerTitle.trim(),
            jobDescription: offerDesc.trim() || offerTitle.trim(),
            workerType: offerWorkerType,
            city: offerCity,
            displayText: offerDesc.trim() || offerTitle.trim(),
          });

      await chatApi.sendOffer(conversationId, {
        description,
        amount,
        currency: 'PKR',
        deliveryDays: days,
      });
      await loadMessages();
      setShowOfferModal(false);
      setOfferAmount('');
      setOfferDays('');
      setOfferDesc('');
      setOfferTitle('');
      setOfferWorkerType('');
      setOfferCity('');
    } catch (err: any) {
      logger.error(TAG, 'Failed to send offer', err.message);
      Alert.alert('Error', 'Could not send offer. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptOffer = async (messageId: string) => {
    try {
      setOfferLoading(messageId);

      // 1. Accept the offer via chat API
      await chatApi.acceptOffer(messageId);

      const offerMsg = messages.find(m => m.id === messageId);
      if (!offerMsg?.offer) {
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId || !m.offer) return m;
          return { ...m, offer: { ...m.offer, status: 'ACCEPTED' } };
        }));
        return;
      }

      // 2. Determine consumer and worker from conversation participants
      const meParticipant = conversation?.participants.find(p => p.userId === user?.userId);
      const otherPart = conversation?.participants.find(p => p.userId !== user?.userId);
      if (!meParticipant || !otherPart || !user) {
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId || !m.offer) return m;
          return { ...m, offer: { ...m.offer, status: 'ACCEPTED' } };
        }));
        return;
      }

      // Direction is derived from participant roles, not session mode.
      // The performer is whichever participant has role WORKER or AGENCY.
      const myRole = meParticipant.role;
      const isPerformer = myRole === 'WORKER' || myRole === 'AGENCY';
      const performer = isPerformer ? meParticipant : otherPart;
      const consumer = isPerformer ? otherPart : meParticipant;
      const performerDisplayName = performer.displayName || '';
      const consumerDisplayName = consumer.displayName || '';

      // Resolve consumer/worker IDs and usernames
      const consumerId = consumer.userId;
      const consumerUsername = isPerformer ? consumerDisplayName : (user.username || '');

      // First/last name split — for the side that is "me", use the user object;
      // for the other side, split their displayName.
      const splitName = (s: string): { first: string; last: string } => {
        const parts = (s || '').trim().split(/\s+/);
        return { first: parts[0] || '', last: parts.slice(1).join(' ') };
      };
      const consumerFirstName = isPerformer
        ? splitName(consumerDisplayName).first || consumerDisplayName
        : (user.firstName || '');
      const consumerLastName = isPerformer
        ? splitName(consumerDisplayName).last
        : (user.lastName || '');

      // Worker-specific name fields (only used in worker variant)
      const workerId = performer.userId;
      const workerUsername = isPerformer ? (user.username || '') : performerDisplayName;
      const workerFirstName = isPerformer
        ? (user.firstName || '')
        : (splitName(performerDisplayName).first || performerDisplayName);
      const workerLastName = isPerformer
        ? (user.lastName || '')
        : splitName(performerDisplayName).last;

      // 3. Parse job info from offer description
      let title = 'Job from chat offer';
      let description = offerMsg.offer.description || 'Job offer accepted in chat';
      let workerType: WorkerType = 'GENERAL_LABORER';
      let city: PakistanCity = 'ISLAMABAD';

      try {
        const parsed = JSON.parse(offerMsg.offer.description);
        if (parsed.jobTitle) title = parsed.jobTitle;
        if (parsed.jobDescription) description = parsed.jobDescription;
        if (parsed.workerType) workerType = parsed.workerType;
        if (parsed.city) city = parsed.city;
      } catch {
        // Plain text description — use as-is
        if (offerMsg.offer.description) {
          description = offerMsg.offer.description;
        }
      }

      // 4. Create ASSIGNED job with accepted bid (or agency-assigned, no bid) via from-offer endpoint
      try {
        const performerFields: Partial<CreateJobFromOffer> = performer.role === 'AGENCY'
          ? {
              agencyId: performer.agencyId ?? undefined,
              agencyName: performerDisplayName,
            }
          : {
              workerId,
              workerUsername,
              workerFirstName,
              workerLastName,
            };

        const payload: CreateJobFromOffer = {
          title,
          description,
          workerType,
          city,
          budgetAmount: offerMsg.offer.amount,
          budgetType: 'FIXED',
          deliveryDays: offerMsg.offer.deliveryDays,
          consumerId,
          consumerUsername,
          consumerFirstName,
          consumerLastName,
          ...performerFields,
        };

        const jobRes = await jobsApi.createJobFromOffer(payload);
        const jobId = jobRes.data.jobId;
        logger.info(TAG, 'Job created from offer', { jobId });

        // 5. Link job to conversation and offer message
        try {
          const linkRes = await chatApi.linkJob(conversationId, messageId, jobId);
          setConversation(linkRes.data);
        } catch (linkErr: any) {
          logger.error(TAG, 'Failed to link job to conversation', linkErr.message);
        }

        // Update message with linkedJobId
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId || !m.offer) return m;
          return { ...m, offer: { ...m.offer, status: 'ACCEPTED', linkedJobId: jobId } };
        }));

        // Fetch the job for the banner
        setLinkedJob(jobRes.data);

        Alert.alert(
          'Offer Accepted',
          'A job has been created and assigned!',
          [
            { text: 'View Job', onPress: () => (navigation as any).navigate('JobListingDetail', { jobId }) },
            { text: 'OK' },
          ]
        );
      } catch (jobErr: any) {
        logger.error(TAG, 'Failed to create job from offer', jobErr.message);
        // Offer still accepted even if job creation failed
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId || !m.offer) return m;
          return { ...m, offer: { ...m.offer, status: 'ACCEPTED' } };
        }));
        Alert.alert('Offer Accepted', 'Offer accepted, but job could not be created automatically.');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not accept offer.');
    } finally {
      setOfferLoading(null);
    }
  };

  const handleRejectOffer = async (messageId: string) => {
    try {
      setOfferLoading(messageId);
      await chatApi.rejectOffer(messageId);
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId || !m.offer) return m;
        return { ...m, offer: { ...m.offer, status: 'REJECTED' } };
      }));
    } catch (err: any) {
      Alert.alert('Error', 'Could not reject offer.');
    } finally {
      setOfferLoading(null);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    // Send typing indicator
    sendTypingIndicator(conversationId, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTypingIndicator(conversationId, false);
    }, 2000);
  };

  const pickImage = async (useCamera: boolean) => {
    setShowAttachMenu(false);
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission needed', `Please allow ${useCamera ? 'camera' : 'gallery'} access.`);
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      await sendMediaMessage(asset);
    } catch (err: any) {
      logger.error(TAG, 'Image pick failed', err.message);
      Alert.alert('Error', 'Could not pick image.');
    }
  };

  const sendMediaMessage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadingMedia(true);
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      const fileSize = asset.fileSize || 0;

      // Upload file to backend (backend saves to S3)
      const uploadRes = await chatApi.uploadMedia({
        fileName,
        fileType: mimeType,
        fileSize,
        conversationId,
        fileUri: asset.uri,
      });
      const { s3Key } = uploadRes.data;

      // Send image message
      const res = await chatApi.sendMessage(conversationId, {
        type: 'IMAGE',
        content: '',
        mediaS3Key: s3Key,
        mediaFileName: fileName,
        mediaFileSize: fileSize,
        mediaMimeType: mimeType,
      });

      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [res.data, ...prev];
      });
      updateConversationLastMessage(conversationId, res.data);
    } catch (err: any) {
      logger.error(TAG, 'Failed to send media', err.message);
      Alert.alert('Error', 'Could not send image. Try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const renderMessage = ({ item, index }: { item: MessageResponse; index: number }) => {
    const isMine = item.senderId === user?.userId;
    const nextMsg = messages[index + 1]; // older message (list is inverted)
    const showDate = !nextMsg || isDifferentDay(item.createdAt, nextMsg.createdAt);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>{formatDateSeparator(item.createdAt)}</Text>
            </View>
          </View>
        )}

        {/* Offer message */}
        {item.type === 'OFFER' && item.offer ? (
          <View style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
            <OfferCard
              offer={item.offer}
              isMine={isMine}
              loading={offerLoading === item.id}
              onAccept={() => handleAcceptOffer(item.id)}
              onReject={() => handleRejectOffer(item.id)}
              onViewJob={item.offer.status === 'ACCEPTED' && (item.offer.linkedJobId || conversation?.metadata?.orderId)
                ? () => {
                    const jobId = item.offer!.linkedJobId || conversation?.metadata?.orderId;
                    if (jobId) (navigation as any).navigate('JobListingDetail', { jobId });
                  }
                : undefined
              }
            />
            <Text style={[styles.bubbleTime, isMine ? styles.timeRight : styles.timeLeft]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        ) : item.type === 'IMAGE' && item.media ? (
          /* Image message */
          <View style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const cached = mediaUrlCache[item.id];
                if (cached) setFullscreenImage(cached);
              }}
              style={[
                styles.imageBubble,
                isMine ? styles.bubbleSent : styles.bubbleReceived,
              ]}
            >
              <ChatImage messageId={item.id} style={styles.messageImage} />
              <View style={styles.imageMeta}>
                <Text style={[styles.bubbleTime, { color: colors.white }]}>
                  {formatTime(item.createdAt)}
                </Text>
                {isMine && (
                  <Ionicons
                    name={item.status === 'READ' ? 'checkmark-done' : 'checkmark'}
                    size={14}
                    color={item.status === 'READ' ? '#53bdeb' : 'rgba(255,255,255,0.7)'}
                    style={{ marginLeft: 3 }}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          /* Text / System message */
          <View style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onLongPress={() => {
                if (item.content) {
                  Clipboard.setString(item.content);
                  Alert.alert('Copied', 'Message copied to clipboard');
                }
              }}
              style={[
                styles.bubble,
                isMine ? styles.bubbleSent : styles.bubbleReceived,
                item.type === 'SYSTEM' && styles.bubbleSystem,
              ]}
            >
              <Text selectable style={[
                styles.bubbleText,
                isMine ? styles.bubbleTextSent : styles.bubbleTextReceived,
                item.type === 'SYSTEM' && styles.bubbleTextSystem,
              ]}>
                {item.content}
              </Text>
              <View style={styles.bubbleMeta}>
                <Text style={[styles.bubbleTime, isMine ? styles.timeRight : styles.timeLeft]}>
                  {formatTime(item.createdAt)}
                </Text>
                {isMine && (
                  <Ionicons
                    name={item.status === 'READ' ? 'checkmark-done' : 'checkmark'}
                    size={14}
                    color={item.status === 'READ' ? '#53bdeb' : colors.slate400}
                    style={{ marginLeft: 3 }}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, isWorkerMode && { backgroundColor: colors.green700 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={26} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfile}
          activeOpacity={0.7}
          onPress={handleAvatarPress}
        >
          {isAgency ? (
            <View style={[styles.headerAvatar, styles.headerAvatarAgency]}>
              <Ionicons name="business" size={22} color={colors.white} />
            </View>
          ) : participantAvatar ? (
            <Image source={{ uri: participantAvatar }} style={styles.headerAvatarImg} />
          ) : (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{participantName}</Text>
            {isTyping && <Text style={styles.headerTyping}>typing...</Text>}
          </View>
        </TouchableOpacity>
      </View>

      {/* Job Status Banner */}
      {linkedJob && (
        <TouchableOpacity
          style={styles.jobBanner}
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('JobListingDetail', { jobId: linkedJob.jobId })}
        >
          <View style={styles.jobBannerLeft}>
            <View style={[styles.jobBannerBadge, {
              backgroundColor: linkedJob.status === 'ASSIGNED' ? colors.blue50
                : linkedJob.status === 'IN_PROGRESS' ? colors.amber100
                : linkedJob.status === 'COMPLETED' ? colors.green100
                : colors.slate100
            }]}>
              <Text style={[styles.jobBannerBadgeText, {
                color: linkedJob.status === 'ASSIGNED' ? colors.primary
                  : linkedJob.status === 'IN_PROGRESS' ? colors.amber600
                  : linkedJob.status === 'COMPLETED' ? colors.green700
                  : colors.slate500
              }]}>{linkedJob.status.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.jobBannerTitle} numberOfLines={1}>{linkedJob.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.slate400} />
        </TouchableOpacity>
      )}

      {/* Track Worker button — shown when an offer is accepted and user is not in worker mode */}
      {acceptedOffer && !isWorkerMode && (
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={async () => {
            const granted = await requestPermission();
            if (!granted || !currentLocation) {
              Alert.alert('Location Required', 'Enable location to start tracking.');
              return;
            }
            try {
              const session = await trackingApi.startTracking({
                conversationId: conversationId,
                workerId: acceptedOffer.senderId,
                customerLatitude: currentLocation.latitude,
                customerLongitude: currentLocation.longitude,
              });
              (navigation as any).navigate('LiveTracking', {
                sessionId: session.sessionId,
                isWorker: isWorkerMode,
              });
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Could not start tracking.');
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={18} color={colors.white} />
          <Text style={styles.trackBtnText}>Track Worker</Text>
        </TouchableOpacity>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
            ) : null}
            ListHeaderComponent={isTyping ? <TypingIndicator /> : null}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.slate300} />
                <Text style={styles.emptyChatText}>Say hello!</Text>
              </View>
            }
          />
        )}

        {/* Upload indicator */}
        {uploadingMedia && (
          <View style={styles.uploadBar}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.uploadText}>Sending image...</Text>
          </View>
        )}

        {/* Attachment menu */}
        {showAttachMenu && (
          <View style={styles.attachMenu}>
            <TouchableOpacity style={styles.attachOption} onPress={() => pickImage(false)} activeOpacity={0.7}>
              <View style={[styles.attachIcon, { backgroundColor: colors.purple600 }]}>
                <Ionicons name="images" size={22} color={colors.white} />
              </View>
              <Text style={styles.attachLabel}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={() => pickImage(true)} activeOpacity={0.7}>
              <View style={[styles.attachIcon, { backgroundColor: colors.red600 }]}>
                <Ionicons name="camera" size={22} color={colors.white} />
              </View>
              <Text style={styles.attachLabel}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
          {/* Attachment button */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
            activeOpacity={0.7}
          >
            <Ionicons name={showAttachMenu ? 'close' : 'add'} size={24} color={colors.slate600} />
          </TouchableOpacity>

          {/* Offer button — workers always, consumers only when chatting with a worker */}
          {canSendOffer && (
            <TouchableOpacity
              style={[styles.offerBtn, !isWorkerMode && { backgroundColor: colors.primary }]}
              onPress={() => setShowOfferModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name={isWorkerMode ? 'cash' : 'briefcase'} size={20} color={colors.white} />
            </TouchableOpacity>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="Type a message..."
              placeholderTextColor={colors.slate400}
              multiline
              maxLength={2000}
            />
          </View>

          {/* Send button */}
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Modal */}
      <Modal visible={!!fullscreenImage} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <TouchableOpacity style={styles.fullscreenClose} onPress={() => setFullscreenImage(null)}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Offer Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowOfferModal(false)} />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16), maxHeight: '85%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isWorkerMode ? 'Send Offer' : 'Offer a Job'}</Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.slate600} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Consumer-only fields */}
              {!isWorkerMode && (
                <>
                  {/* Job Title */}
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Job Title</Text>
                    <View style={styles.modalInputRow}>
                      <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                      <TextInput
                        style={styles.modalInput}
                        value={offerTitle}
                        onChangeText={setOfferTitle}
                        placeholder="e.g. Fix kitchen sink"
                        placeholderTextColor={colors.slate300}
                      />
                    </View>
                  </View>

                  {/* Worker Type */}
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Worker Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                      {WORKER_TYPE_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.chipOption, offerWorkerType === opt.value && styles.chipSelected]}
                          onPress={() => setOfferWorkerType(opt.value)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, offerWorkerType === opt.value && styles.chipTextSelected]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* City */}
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>City</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                      {CITY_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.chipOption, offerCity === opt.value && styles.chipSelected]}
                          onPress={() => setOfferCity(opt.value)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, offerCity === opt.value && styles.chipTextSelected]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}

              {/* Amount & Days in a row */}
              <View style={styles.modalRow}>
                <View style={[styles.modalField, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Amount (Rs.)</Text>
                  <View style={styles.modalInputRow}>
                    <Ionicons name="cash-outline" size={20} color={colors.green600} />
                    <TextInput
                      style={styles.modalInput}
                      value={offerAmount}
                      onChangeText={setOfferAmount}
                      placeholder="5000"
                      placeholderTextColor={colors.slate300}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.modalField, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Delivery (days)</Text>
                  <View style={styles.modalInputRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    <TextInput
                      style={styles.modalInput}
                      value={offerDays}
                      onChangeText={setOfferDays}
                      placeholder="3"
                      placeholderTextColor={colors.slate300}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextarea]}
                  value={offerDesc}
                  onChangeText={setOfferDesc}
                  placeholder={isWorkerMode ? 'Describe your service...' : 'Describe the job you need done...'}
                  placeholderTextColor={colors.slate300}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSendBtn, !isWorkerMode && { backgroundColor: colors.primary }, sending && { opacity: 0.6 }]}
              onPress={handleSendOffer}
              disabled={sending}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name={isWorkerMode ? 'checkmark-circle' : 'briefcase'} size={20} color={colors.white} />
                  <Text style={styles.modalSendText}>{isWorkerMode ? 'Send Offer' : 'Send Job Offer'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const SENT_BUBBLE_COLOR = '#dcf8c6';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5ddd5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarAgency: {
    backgroundColor: colors.primary,
  },
  headerAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  headerTyping: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Job banner
  jobBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  jobBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  jobBannerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jobBannerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  jobBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate700,
    flex: 1,
  },

  // Track Worker button
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  trackBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },

  // Messages
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
  },
  messageRow: {
    marginBottom: 3,
    maxWidth: '80%',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    minWidth: 80,
  },
  bubbleSent: {
    backgroundColor: SENT_BUBBLE_COLOR,
    borderTopRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 4,
  },
  bubbleSystem: {
    backgroundColor: colors.blue50,
    alignSelf: 'center',
    borderRadius: 12,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  bubbleTextSent: {
    color: colors.slate900,
  },
  bubbleTextReceived: {
    color: colors.slate900,
  },
  bubbleTextSystem: {
    color: colors.slate500,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  bubbleTime: {
    fontSize: 11,
  },
  timeRight: {
    color: colors.slate500,
  },
  timeLeft: {
    color: colors.slate400,
  },

  // Image messages
  imageBubble: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  messageImage: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 12,
  },
  imageMeta: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Fullscreen image
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },

  // Date separator
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    backgroundColor: 'rgba(225,221,212,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate600,
  },

  // Empty
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: {
    fontSize: 16,
    color: colors.slate400,
    marginTop: 10,
  },

  // Upload indicator
  uploadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.blue50,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  uploadText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },

  // Attachment menu
  attachMenu: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.slate50,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  attachOption: {
    alignItems: 'center',
    gap: 4,
  },
  attachIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachLabel: {
    fontSize: 11,
    color: colors.slate600,
    fontWeight: '500',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
    paddingTop: 6,
    backgroundColor: colors.slate50,
    gap: 4,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  offerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.amber500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingHorizontal: 12,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: colors.slate900,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: 80,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: colors.slate300,
  },

  // Offer modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slate300,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalField: {
    gap: 5,
    marginBottom: 2,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate600,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.slate50,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    color: colors.slate900,
    paddingVertical: 10,
  },
  modalTextarea: {
    backgroundColor: colors.slate50,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  chipOption: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.slate100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate600,
  },
  chipTextSelected: {
    color: colors.white,
  },
  modalSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green600,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modalSendText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
