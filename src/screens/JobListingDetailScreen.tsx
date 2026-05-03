import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useWorker } from '../context/WorkerContext';
import { useAgency } from '../context/AgencyContext';
import { useLocation } from '../context/LocationContext';
import { useChat } from '../context/ChatContext';
import { BidCard } from '../components/BidCard';
import { jobsApi } from '../api/jobs';
import { agenciesApi } from '../api/agencies';
import { workersApi } from '../api/workers';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList, JobListingResponse, BidResponse, JobStatus, ReviewResponse, ReviewType, WorkerLocationUpdate, WorkerListItem, PaymentTransaction, Dispute, TransactionStatus } from '../types';
import { paymentsApi } from '../api/payments';
import { disputesApi } from '../api/disputes';
import { CITY_COORDINATES } from '../utils/cityCoordinates';

const TAG = 'JobListingDetail';

const statusConfig: Record<JobStatus, { color: string; bg: string; label: string }> = {
  DRAFT: { color: colors.slate500, bg: colors.slate100, label: 'Draft' },
  OPEN: { color: colors.green600, bg: colors.green50, label: 'Open' },
  ASSIGNED: { color: colors.primary, bg: colors.blue50, label: 'Assigned' },
  IN_PROGRESS: { color: colors.amber600, bg: colors.amber100, label: 'In Progress' },
  COMPLETED: { color: colors.green700, bg: colors.green100, label: 'Completed' },
  CANCELLED: { color: colors.slate500, bg: colors.slate100, label: 'Cancelled' },
  EXPIRED: { color: colors.red600, bg: colors.red50, label: 'Expired' },
};

const ESCROW_CHIP_BG: Record<TransactionStatus, string> = {
  PENDING:   colors.slate400,
  HELD:      colors.amber500,
  RELEASED:  colors.green600,
  REFUNDED:  colors.slate400,
  FAILED:    colors.red600,
  CANCELLED: colors.slate400,
};

const urgencyLabels: Record<string, string> = {
  EMERGENCY: 'Emergency',
  URGENT: 'Urgent',
  NORMAL: 'Normal',
  FLEXIBLE: 'Flexible',
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JobListingDetail'>;
  route: RouteProp<RootStackParamList, 'JobListingDetail'>;
};

export function JobListingDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { workerProfile } = useWorker();
  const { jobId } = route.params;

  const { currentLocation, requestPermission, startWatching, stopWatching } = useLocation();
  const { publishLocation, subscribeToLocation, unsubscribeFromLocation } = useChat();

  const [listing, setListing] = useState<JobListingResponse | null>(null);
  const [bids, setBids] = useState<BidResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [escrowTx, setEscrowTx] = useState<PaymentTransaction | null>(null);
  const [myDisputes, setMyDisputes] = useState<Dispute[]>([]);

  // Location tracking state
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [workerLiveLocation, setWorkerLiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const lastPublishRef = useRef<number>(0);

  // Dispatch modal state (agency owner)
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [agencyWorkers, setAgencyWorkers] = useState<WorkerListItem[]>([]);
  const [dispatchingWorkerId, setDispatchingWorkerId] = useState<string | null>(null);

  const { agencyProfile, isAgencyMode } = useAgency();
  const isOwner = listing?.consumerId === user?.userId;
  const isAssignedWorker = listing?.assignedWorkerId === user?.userId;
  const isAssignedAgency = !!listing?.assignedAgencyId && listing.assignedAgencyId === agencyProfile?.agencyId;
  const isDispatchedWorker = !!listing?.dispatchedWorkerId && listing.dispatchedWorkerId === user?.userId;
  const isPerformer = isAssignedWorker || isAssignedAgency || isDispatchedWorker;
  const canBid = listing?.status === 'OPEN' && !isOwner
    && (workerProfile != null || (isAgencyMode && agencyProfile != null));
  const canDispatch = isAssignedAgency
    && (listing?.status === 'ASSIGNED' || listing?.status === 'IN_PROGRESS');
  // For AGENCY_TO_CONSUMER reviews, the reviewerId stored is the agency UUID, not the human owner.
  const hasUserReviewed = reviews.some(r =>
    r.reviewerId === user?.userId ||
    (isAssignedAgency && r.reviewerId === listing?.assignedAgencyId)
  );

  const fetchData = useCallback(async () => {
    try {
      const res = await jobsApi.getListingById(jobId);
      setListing(res.data);

      // Fetch bids if owner
      if (res.data.consumerId === user?.userId) {
        try {
          const bidsRes = await jobsApi.getJobBids(jobId);
          setBids(bidsRes.data.bids);
        } catch {
          // May fail if no bids
        }
      }

      // Fetch reviews for completed jobs
      if (res.data.status === 'COMPLETED') {
        try {
          const reviewsRes = await jobsApi.getJobReviews(jobId);
          setReviews(reviewsRes.data);
        } catch {
          // May fail if no reviews
        }
      }

      // Fetch escrow status (404 = no payment yet, render no chip)
      paymentsApi.getTransactionByJob(jobId)
        .then(setEscrowTx)
        .catch(() => setEscrowTx(null));

      // Fetch my disputes on this job (for the inline hint)
      disputesApi.getMyDisputesForJob(jobId)
        .then(setMyDisputes)
        .catch(() => setMyDisputes([]));
    } catch (error: any) {
      logger.error(TAG, 'Failed to fetch listing', error.message);
      Alert.alert('Error', 'Failed to load job listing');
    } finally {
      setLoading(false);
    }
  }, [jobId, user?.userId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Worker: publish location whenever currentLocation changes while sharing
  useEffect(() => {
    if (!isSharingLocation || !currentLocation) return;
    const now = Date.now();
    if (now - lastPublishRef.current < 4000) return;
    lastPublishRef.current = now;
    publishLocation(jobId, currentLocation.latitude, currentLocation.longitude);
  }, [currentLocation, isSharingLocation, jobId, publishLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
      unsubscribeFromLocation(jobId);
    };
  }, [jobId]);

  const handleToggleLocationSharing = async () => {
    if (isSharingLocation) {
      stopWatching();
      setIsSharingLocation(false);
      logger.info(TAG, 'Stopped sharing location');
    } else {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Allow location access to share your position with the client.');
        return;
      }
      await startWatching();
      setIsSharingLocation(true);
      logger.info(TAG, 'Started sharing location for job', jobId);
    }
  };

  const handleOpenTracking = () => {
    setWorkerLiveLocation(null);
    subscribeToLocation(jobId, (update: WorkerLocationUpdate) => {
      setWorkerLiveLocation({ latitude: update.latitude, longitude: update.longitude });
    });
    setShowTrackingModal(true);
  };

  const handleCloseTracking = () => {
    unsubscribeFromLocation(jobId);
    setShowTrackingModal(false);
  };

  const handleAction = async (
    action: () => Promise<any>,
    confirmTitle: string,
    confirmMsg: string,
    successMsg: string,
    destructive = false
  ) => {
    Alert.alert(confirmTitle, confirmMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: confirmTitle,
        style: destructive ? 'destructive' : 'default',
        onPress: async () => {
          setActionLoading(true);
          try {
            await action();
            await fetchData();
            Alert.alert('Success', successMsg);
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Action failed');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleAcceptBid = (bid: BidResponse) => {
    const isAgencyBid = !!bid.agencyId;
    const recipientName = isAgencyBid
      ? (bid.agencyName ?? 'Agency')
      : ((bid.workerFirstName || bid.workerLastName)
          ? `${bid.workerFirstName ?? ''} ${bid.workerLastName ?? ''}`.trim()
          : bid.workerUsername || 'Worker');
    navigation.navigate('JobPayment', {
      jobId: bid.jobId,
      bidId: bid.bidId,
      workerId: isAgencyBid ? undefined : bid.workerId ?? undefined,
      agencyId: isAgencyBid ? bid.agencyId ?? undefined : undefined,
      recipientName,
      amount: bid.proposedAmount,
    });
  };

  const handleRejectBid = (bidId: string) =>
    handleAction(() => jobsApi.rejectBid(bidId), 'Reject Bid', 'Reject this bid?', 'Bid rejected', true);

  const handleCancelListing = () =>
    handleAction(() => jobsApi.cancelListing(jobId), 'Cancel Listing', 'Cancel this job listing?', 'Listing cancelled', true);

  const handleStartJob = () =>
    handleAction(() => jobsApi.startJob(jobId), 'Start Job', 'Mark this job as started?', 'Job started');

  const handleCompleteJob = () => {
    Alert.alert('Complete Job', 'Mark this job as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete Job',
        onPress: async () => {
          setActionLoading(true);
          try {
            await jobsApi.completeJob(jobId);
            await fetchData();
            Alert.alert('Job Completed!', 'Waiting for the client to confirm completion before reviews can be left.');
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Action failed');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleConfirmCompletion = () => {
    Alert.alert('Confirm', 'Confirm the job is complete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(true);
          try {
            await jobsApi.confirmCompletion(jobId);
            await fetchData();
            const isAgencyJob = !!listing?.assignedAgencyId;
            const reviewType: ReviewType = isAgencyJob ? 'CONSUMER_TO_AGENCY' : 'CONSUMER_TO_WORKER';
            const revieweeName = isAgencyJob
              ? (listing?.assignedAgencyName || 'Agency')
              : (listing?.assignedWorkerUsername || 'Worker');
            Alert.alert('Job Complete!', `Would you like to leave a review for the ${isAgencyJob ? 'agency' : 'worker'}?`, [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Leave Review',
                onPress: () => {
                  if (listing) {
                    navigation.navigate('LeaveReview', {
                      jobId: listing.jobId,
                      revieweeName,
                      reviewType,
                    });
                  }
                },
              },
            ]);
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Action failed');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  // Load agency workers when dispatch modal opens
  useEffect(() => {
    if (dispatchModalVisible && agencyProfile) {
      agenciesApi.listAgencyWorkers(agencyProfile.agencyId)
        .then((r) => setAgencyWorkers(r.data))
        .catch(() => setAgencyWorkers([]));
    }
  }, [dispatchModalVisible, agencyProfile?.agencyId]);

  const handleDispatch = async (workerId: string) => {
    setDispatchingWorkerId(workerId);
    try {
      await jobsApi.dispatchJob(jobId, workerId);
      setDispatchModalVisible(false);
      await fetchData();
      Alert.alert('Dispatched', 'The job has been dispatched.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to dispatch');
    } finally {
      setDispatchingWorkerId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.slate400} />
        <Text style={styles.errorText}>Listing not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = statusConfig[listing.status];
  const budgetLabel = listing.budgetType === 'HOURLY' ? 'per hour' : listing.budgetType === 'DAILY' ? 'per day' : listing.budgetType === 'NEGOTIABLE' ? '(negotiable)' : 'fixed';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.slate900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status */}
      <View style={[styles.statusCard, { borderColor: status.color }]}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.bidCountText}>{listing.bidCount} bid{listing.bidCount !== 1 ? 's' : ''}</Text>
      </View>

      {/* Escrow chip */}
      {escrowTx && (
        <View style={[styles.escrowChip, { backgroundColor: ESCROW_CHIP_BG[escrowTx.status] }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.white} />
          <Text style={styles.escrowChipText}>
            Escrow: {escrowTx.status}
            {escrowTx.status === 'HELD' ? ` · Rs. ${escrowTx.amount.toLocaleString()}` : ''}
          </Text>
        </View>
      )}

      {/* Dispatched-worker chip — visible to everyone (consumer + agency + bidders). */}
      {listing.assignedAgencyId && listing.dispatchedWorkerId && (
        <View style={styles.dispatchInfoChip}>
          <Ionicons name="person-outline" size={14} color={colors.primary} />
          <Text style={styles.dispatchInfoText}>
            Dispatched: {listing.dispatchedWorkerUsername ?? 'a worker'}
            {listing.assignedAgencyName ? `  ·  ${listing.assignedAgencyName}` : ''}
          </Text>
        </View>
      )}

      {/* Title & Description */}
      <View style={styles.section}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.workerType}>{listing.workerTypeDisplayName}</Text>
        <Text style={styles.description}>{listing.description}</Text>
      </View>

      {/* Consumer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Posted By</Text>
        {isOwner ? (
          <View style={styles.consumerRow}>
            <View style={styles.consumerAvatar}>
              <Text style={styles.consumerInitial}>{listing.consumerFirstName?.[0] || 'U'}</Text>
            </View>
            <Text style={styles.consumerName}>You</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.consumerRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('UserProfile', { userId: listing.consumerId })}
          >
            <View style={styles.consumerAvatar}>
              <Text style={styles.consumerInitial}>{listing.consumerFirstName?.[0] || 'U'}</Text>
            </View>
            <Text style={[styles.consumerName, { flex: 1 }]}>{listing.consumerFirstName} {listing.consumerLastName}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.slate400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <DetailRow icon="location" label="Location" value={`${listing.cityDisplayName}${listing.area ? `, ${listing.area}` : ''}`} />
        <DetailRow icon="alert-circle" label="Urgency" value={urgencyLabels[listing.urgency] || listing.urgency} />
        <DetailRow icon="calendar" label="Start Date" value={formatDate(listing.preferredStartDate)} />
        <DetailRow icon="calendar-outline" label="End Date" value={formatDate(listing.preferredEndDate)} />
      </View>

      {/* Budget */}
      <View style={styles.pricingCard}>
        <Text style={styles.sectionTitle}>Budget</Text>
        <View style={styles.priceCenter}>
          <Text style={styles.priceAmount}>
            Rs. {listing.budgetMin?.toLocaleString()}{listing.budgetMax ? ` - ${listing.budgetMax.toLocaleString()}` : ''}
          </Text>
          <Text style={styles.priceType}>{budgetLabel}</Text>
        </View>
      </View>

      {/* Bids (consumer view) */}
      {isOwner && bids.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bids ({bids.length})</Text>
          {bids.map((bid) => (
            <View key={bid.bidId}>
              <BidCard
                bid={bid}
                onPress={() => {
                  if (bid.agencyId) {
                    navigation.navigate('AgencyProfile', { agencyId: bid.agencyId });
                  } else if (bid.workerId) {
                    workersApi.getWorkerByUserId(bid.workerId)
                      .then(res => navigation.navigate('WorkerDetail', { workerId: res.data.workerId }))
                      .catch(() => Alert.alert('Info', 'Worker profile not available'));
                  }
                }}
              />
              {listing.status === 'OPEN' && bid.status === 'PENDING' && (
                <View style={styles.bidActions}>
                  <TouchableOpacity
                    style={styles.acceptBidBtn}
                    onPress={() => handleAcceptBid(bid)}
                    disabled={actionLoading}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                    <Text style={styles.acceptBidText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBidBtn}
                    onPress={() => handleRejectBid(bid.bidId)}
                    disabled={actionLoading}
                  >
                    <Ionicons name="close" size={16} color={colors.red600} />
                    <Text style={styles.rejectBidText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {/* Worker or Agency: Place Bid */}
        {canBid && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('PlaceBid', { jobId: listing.jobId, jobTitle: listing.title })}
          >
            <Ionicons name="hand-left" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>
              {isAgencyMode ? 'Place Bid (as agency)' : 'Place Bid'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Agency owner: Dispatch to Worker */}
        {canDispatch && (
          <View style={styles.dispatchSection}>
            <Text style={styles.dispatchLabel}>
              {listing.dispatchedWorkerId
                ? `Dispatched to: ${listing.dispatchedWorkerUsername ?? '—'}`
                : 'Not yet dispatched'}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setDispatchModalVisible(true)}>
              <Ionicons name="people" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>
                {listing.dispatchedWorkerId ? 'Re-dispatch' : 'Dispatch to Worker'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Assigned Worker or Agency: Start Job */}
        {isPerformer && listing.status === 'ASSIGNED' && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartJob} disabled={actionLoading}>
            <Ionicons name="play" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Start Job</Text>
          </TouchableOpacity>
        )}

        {/* Assigned Worker or Agency: Complete Job */}
        {isPerformer && listing.status === 'IN_PROGRESS' && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleCompleteJob} disabled={actionLoading}>
            <Ionicons name="checkmark-done" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Complete Job</Text>
          </TouchableOpacity>
        )}

        {/* Assigned Worker: Share Location */}
        {isAssignedWorker && listing.status === 'IN_PROGRESS' && (
          <TouchableOpacity
            style={[styles.locationButton, isSharingLocation && styles.locationButtonActive]}
            onPress={handleToggleLocationSharing}
          >
            <Ionicons
              name={isSharingLocation ? 'radio' : 'navigate'}
              size={18}
              color={isSharingLocation ? colors.white : colors.primary}
            />
            <Text style={[styles.locationButtonText, isSharingLocation && styles.locationButtonTextActive]}>
              {isSharingLocation ? 'Sharing Location...' : 'Share Location with Client'}
            </Text>
            {isSharingLocation && (
              <View style={styles.liveIndicatorDot} />
            )}
          </TouchableOpacity>
        )}

        {/* Consumer: Track Worker */}
        {isOwner && listing.status === 'IN_PROGRESS' && (
          <TouchableOpacity style={styles.trackButton} onPress={handleOpenTracking}>
            <Ionicons name="map" size={18} color={colors.white} />
            <Text style={styles.trackButtonText}>Track Worker</Text>
          </TouchableOpacity>
        )}

        {/* Consumer: Confirm Completion */}
        {isOwner && listing.status === 'COMPLETED' && !listing.consumerConfirmedAt && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmCompletion} disabled={actionLoading}>
            <Ionicons name="shield-checkmark" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Confirm Completion</Text>
          </TouchableOpacity>
        )}

        {/* Consumer: Job Confirmed message */}
        {isOwner && listing.status === 'COMPLETED' && listing.consumerConfirmedAt && (
          <View style={styles.confirmedBanner}>
            <Ionicons name="checkmark-circle" size={22} color={colors.green600} />
            <Text style={styles.confirmedText}>Job Completed - You confirmed this job is complete</Text>
          </View>
        )}

        {/* Consumer: Cancel */}
        {isOwner && (listing.status === 'OPEN' || listing.status === 'DRAFT') && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelListing} disabled={actionLoading}>
            <Ionicons name="close-circle" size={20} color={colors.red600} />
            <Text style={styles.cancelButtonText}>Cancel Listing</Text>
          </TouchableOpacity>
        )}

        {/* Leave Review — only after consumer confirms completion */}
        {listing.status === 'COMPLETED' && listing.consumerConfirmedAt && (isOwner || isPerformer) && !hasUserReviewed && (
          <TouchableOpacity
            style={styles.reviewButton}
            activeOpacity={0.7}
            onPress={() => {
              const isAgencyJob = !!listing.assignedAgencyId;
              let reviewType: ReviewType;
              let revieweeName: string;
              if (isOwner) {
                reviewType = isAgencyJob ? 'CONSUMER_TO_AGENCY' : 'CONSUMER_TO_WORKER';
                revieweeName = isAgencyJob
                  ? (listing.assignedAgencyName || 'Agency')
                  : (listing.assignedWorkerUsername || 'Worker');
              } else if (isAssignedAgency) {
                reviewType = 'AGENCY_TO_CONSUMER';
                revieweeName = `${listing.consumerFirstName} ${listing.consumerLastName}`;
              } else if (isDispatchedWorker) {
                reviewType = 'WORKER_TO_CONSUMER';
                revieweeName = `${listing.consumerFirstName} ${listing.consumerLastName}`;
              } else {
                reviewType = 'WORKER_TO_CONSUMER';
                revieweeName = `${listing.consumerFirstName} ${listing.consumerLastName}`;
              }
              navigation.navigate('LeaveReview', {
                jobId: listing.jobId,
                revieweeName,
                reviewType,
              });
            }}
          >
            <Ionicons name="star" size={20} color={colors.amber600} />
            <Text style={styles.reviewButtonText}>Leave a Review</Text>
          </TouchableOpacity>
        )}

        {actionLoading && <ActivityIndicator style={{ marginTop: 12 }} color={colors.primary} />}
      </View>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.map(review => (
            <View key={review.reviewId} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Ionicons
                      key={n}
                      name={n <= review.rating ? 'star' : 'star-outline'}
                      size={16}
                      color={n <= review.rating ? colors.amber400 : colors.slate300}
                    />
                  ))}
                </View>
                <Text style={styles.reviewType}>
                  {review.reviewType === 'CONSUMER_TO_WORKER' || review.reviewType === 'CONSUMER_TO_AGENCY'
                    ? 'Client review'
                    : review.reviewType === 'AGENCY_TO_CONSUMER'
                      ? 'Agency review'
                      : 'Worker review'}
                </Text>
              </View>
              {review.comment ? (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              ) : null}
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Report an issue (consumer or assigned/dispatched worker only) */}
      {(isOwner || isPerformer) && (
        <View style={styles.disputeArea}>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => navigation.navigate('SubmitDispute', { jobId })}>
            <Ionicons name="warning-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.reportBtnText}>Report an issue</Text>
          </TouchableOpacity>
          {myDisputes.length > 0 && (
            <TouchableOpacity onPress={() => {
              if (myDisputes.length === 1) {
                navigation.navigate('DisputeDetail', { disputeId: myDisputes[0].disputeId });
              } else {
                navigation.navigate('ResolutionCenter');
              }
            }}>
              <Text style={styles.disputeHint}>
                You have {myDisputes.length === 1 ? '1 issue' : `${myDisputes.length} issues`} on this job ›
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Live Tracking Modal */}
      <Modal visible={showTrackingModal} animationType="slide" onRequestClose={handleCloseTracking}>
        <View style={[styles.trackingModal, { paddingTop: insets.top }]}>
          <View style={styles.trackingHeader}>
            <TouchableOpacity onPress={handleCloseTracking} style={styles.trackingBackBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.slate700} />
            </TouchableOpacity>
            <Text style={styles.trackingTitle}>Worker Location</Text>
            <View style={styles.trackingLiveBadge}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.trackingLiveText}>LIVE</Text>
            </View>
          </View>

          {workerLiveLocation ? (
            <MapView
              style={styles.trackingMap}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              region={{
                latitude: workerLiveLocation.latitude,
                longitude: workerLiveLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation
            >
              <Marker
                coordinate={workerLiveLocation}
                title={listing.assignedWorkerUsername ?? 'Worker'}
                description="Worker's current location"
              >
                <View style={styles.workerMarker}>
                  <Ionicons name="construct" size={18} color={colors.white} />
                </View>
              </Marker>
            </MapView>
          ) : (
            <View style={styles.trackingWaiting}>
              <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.trackingWaitTitle}>Waiting for worker's location</Text>
              <Text style={styles.trackingWaitSub}>
                The worker needs to tap "Share Location" on their device
              </Text>
            </View>
          )}

          {/* Job info strip */}
          <View style={[styles.trackingJobStrip, { paddingBottom: insets.bottom + 12 }]}>
            <Ionicons name="briefcase" size={16} color={colors.primary} />
            <Text style={styles.trackingJobTitle} numberOfLines={1}>{listing.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig[listing.status]?.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig[listing.status]?.color }]}>
                {statusConfig[listing.status]?.label}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dispatch to Worker Modal */}
      <Modal visible={dispatchModalVisible} animationType="slide" transparent onRequestClose={() => setDispatchModalVisible(false)}>
        <View style={styles.dispatchModalOverlay}>
          <View style={styles.dispatchModalCard}>
            <View style={styles.dispatchModalHeader}>
              <Text style={styles.dispatchModalTitle}>Dispatch to Worker</Text>
              <TouchableOpacity onPress={() => setDispatchModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.slate700} />
              </TouchableOpacity>
            </View>
            {agencyWorkers.length === 0 ? (
              <Text style={styles.dispatchEmpty}>No workers in your agency yet.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {agencyWorkers.map((w) => (
                  <View key={w.workerId} style={styles.dispatchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dispatchName}>{w.firstName} {w.lastName}</Text>
                      <Text style={styles.dispatchMeta}>{w.workerType} • {w.city}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.dispatchPickBtn, dispatchingWorkerId === w.userId && { opacity: 0.6 }]}
                      onPress={() => handleDispatch(w.userId)}
                      disabled={dispatchingWorkerId !== null}>
                      {dispatchingWorkerId === w.userId
                        ? <ActivityIndicator color="white" size="small" />
                        : <Text style={styles.dispatchPickBtnText}>Dispatch</Text>}
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate50 },
  errorText: { fontSize: 16, color: colors.slate500, marginTop: 12 },
  goBackBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
  goBackText: { color: colors.white, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.slate200,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.slate900 },
  statusCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1.5,
  },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 14, fontWeight: '700' },
  bidCountText: { fontSize: 13, color: colors.slate500 },
  escrowChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    marginBottom: 12, gap: 6,
  },
  escrowChipText: { color: colors.white, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  dispatchInfoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.blue50, borderColor: colors.primary, borderWidth: 1,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, marginBottom: 12,
  },
  dispatchInfoText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  disputeArea: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.slate200,
  },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    gap: 8,
  },
  reportBtnText: { color: colors.mutedForeground, fontSize: 14, fontWeight: '500' },
  disputeHint: { textAlign: 'center', color: colors.primary, marginTop: 10, fontSize: 13 },
  section: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.slate200,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: colors.slate500, marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.slate900, marginBottom: 4 },
  workerType: { fontSize: 14, color: colors.primary, fontWeight: '500', marginBottom: 10 },
  description: { fontSize: 14, color: colors.slate700, lineHeight: 22 },
  consumerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  consumerAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue50,
    alignItems: 'center', justifyContent: 'center',
  },
  consumerInitial: { fontSize: 18, fontWeight: '700', color: colors.primary },
  consumerName: { fontSize: 16, fontWeight: '600', color: colors.slate900 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  detailLabel: { fontSize: 14, color: colors.slate500, flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '500', color: colors.slate900, textAlign: 'right' },
  pricingCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.slate200,
  },
  priceCenter: { alignItems: 'center', paddingVertical: 8 },
  priceAmount: { fontSize: 28, fontWeight: '700', color: colors.green600 },
  priceType: { fontSize: 14, color: colors.slate500, marginTop: 4 },
  bidActions: { flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: -4 },
  acceptBidBtn: {
    flex: 1, backgroundColor: colors.green600, borderRadius: 10, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  acceptBidText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  rejectBidBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: colors.red600,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  rejectBidText: { color: colors.red600, fontWeight: '600', fontSize: 14 },
  actionSection: { marginTop: 4, gap: 10 },
  primaryButton: {
    backgroundColor: colors.green600, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.green600, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  cancelButton: {
    borderRadius: 14, height: 52, borderWidth: 1, borderColor: colors.red600, backgroundColor: colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  cancelButtonText: { color: colors.red600, fontSize: 16, fontWeight: '600' },
  reviewButton: {
    borderRadius: 14, height: 52, borderWidth: 1.5, borderColor: colors.amber400, backgroundColor: colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  reviewButtonText: { color: colors.amber600, fontSize: 16, fontWeight: '600' },
  dispatchSection: {
    backgroundColor: colors.white, borderRadius: 12, padding: 12, gap: 10,
    borderWidth: 1, borderColor: colors.slate200,
  },
  dispatchLabel: { fontSize: 14, color: colors.slate700, fontWeight: '500' },
  dispatchModalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dispatchModalCard: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, paddingBottom: 32,
  },
  dispatchModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.slate200,
  },
  dispatchModalTitle: { fontSize: 18, fontWeight: '700', color: colors.slate900 },
  dispatchEmpty: { textAlign: 'center', padding: 24, color: colors.mutedForeground },
  dispatchRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderColor: colors.slate100,
  },
  dispatchName: { fontSize: 15, fontWeight: '600', color: colors.slate900 },
  dispatchMeta: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  dispatchPickBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary,
    minWidth: 80, alignItems: 'center',
  },
  dispatchPickBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  reviewCard: {
    backgroundColor: colors.slate50, borderRadius: 10, padding: 12, marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6,
  },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewType: { fontSize: 12, color: colors.slate400 },
  reviewComment: { fontSize: 14, color: colors.slate700, lineHeight: 20, marginBottom: 6 },
  reviewDate: { fontSize: 12, color: colors.slate400 },
  confirmedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.green50,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.green100,
  },
  confirmedText: { fontSize: 14, fontWeight: '600', color: colors.green700, flex: 1 },
  // Location sharing
  locationButton: {
    borderRadius: 14, height: 52, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  locationButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  locationButtonText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  locationButtonTextActive: { color: colors.white },
  liveIndicatorDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.destructive,
  },
  // Track button
  trackButton: {
    backgroundColor: colors.amber500, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  trackButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  // Tracking modal
  trackingModal: { flex: 1, backgroundColor: colors.slate50 },
  trackingHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.slate200,
  },
  trackingBackBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.slate100,
    alignItems: 'center', justifyContent: 'center',
  },
  trackingTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.slate900 },
  trackingLiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.red50, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#fecaca',
  },
  trackingLiveText: { fontSize: 11, fontWeight: '700', color: colors.destructive, letterSpacing: 0.5 },
  trackingMap: { flex: 1 },
  trackingWaiting: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  trackingWaitTitle: { fontSize: 17, fontWeight: '600', color: colors.slate700, textAlign: 'center' },
  trackingWaitSub: { fontSize: 14, color: colors.slate500, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  workerMarker: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green600,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  trackingJobStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.slate200,
  },
  trackingJobTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.slate900 },
});
