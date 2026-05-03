// ==================== Auth ====================
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  phoneNumber: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  rememberMe: boolean;
  otpCode: string;
}

export interface SendOtpRequest {
  phoneNumber: string;
}

export interface SendPhoneChangeOtpRequest {
  oldPassword: string;
  newPhoneNumber: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  token: string;
}

// ==================== User ====================
export interface UserProfile {
  userId: string;
  username?: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  profilePictureUrl: string | null;
}

export interface UserPasswordUpdate {
  oldPassword: string;
  newPassword: string;
}

export interface UserEmailUpdate {
  oldPassword: string;
  newEmail: string;
}

export interface UserPhoneUpdate {
  oldPassword: string;
  newPhoneNumber: string;
  otpCode: string;
}

export interface UserNameUpdate {
  oldPassword: string;
  newFirstName: string;
  newLastName: string;
}

export interface ResponseMessage {
  message: string;
}

// ==================== Worker ====================
export type WorkerType =
  | 'MECHANIC'
  | 'ELECTRICIAN'
  | 'PLUMBER'
  | 'CARPENTER'
  | 'WELDER'
  | 'PAINTER'
  | 'MASON'
  | 'HVAC_TECHNICIAN'
  | 'GENERAL_LABORER';

export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';

export type PakistanCity =
  | 'KARACHI'
  | 'LAHORE'
  | 'ISLAMABAD'
  | 'RAWALPINDI'
  | 'FAISALABAD'
  | 'MULTAN'
  | 'PESHAWAR'
  | 'QUETTA'
  | 'SIALKOT'
  | 'GUJRANWALA';

export type Language = 'URDU' | 'ENGLISH' | 'PUNJABI' | 'SINDHI' | 'PASHTO' | 'BALOCHI' | 'SARAIKI';

export interface WorkerListItem {
  workerId: string;
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePictureUrl: string | null;
  workerType: WorkerType;
  experienceYears: number;
  hourlyRate: number;
  dailyRate: number;
  city: PakistanCity;
  area: string;
  availabilityStatus: AvailabilityStatus;
  isVerified: boolean;
  averageRating: number;
  totalJobsCompleted: number;
  agencyName: string | null;
  shopLatitude?: number;
  shopLongitude?: number;
}

export interface WorkerProfile {
  workerId: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  profilePictureUrl: string | null;
  workerType: WorkerType;
  skills: string[];
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  dailyRate: number;
  city: PakistanCity;
  area: string;
  serviceCities: PakistanCity[];
  languages: Language[];
  portfolioImageUrls: string[];
  agency: AgencyBasicInfo | null;
  availabilityStatus: AvailabilityStatus;
  unavailableFrom: string | null;
  unavailableUntil: string | null;
  unavailabilityReason: string | null;
  isVerified: boolean;
  verificationStatus: string;
  averageRating: number;
  totalJobsCompleted: number;
  createdAt: string;
  updatedAt: string;
  shopLatitude?: number;
  shopLongitude?: number;
  subscriptionActive?: boolean;
  subscriptionExpiresAt?: string;
}

export interface CreateWorkerAccount {
  workerType: WorkerType;
  skills: string[];
  cnic: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  dailyRate?: number;
  city?: PakistanCity;
  area?: string;
  serviceCities?: PakistanCity[];
  languages?: Language[];
  agencyId?: string;
}

export interface UpdateWorkerProfile {
  skills?: string[];
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  dailyRate?: number;
  city?: PakistanCity;
  area?: string;
  serviceCities?: PakistanCity[];
  languages?: Language[];
  shopLatitude?: number;
  shopLongitude?: number;
}

export interface UpdateAvailability {
  status: AvailabilityStatus;
  unavailableFrom?: string | null;
  unavailableUntil?: string | null;
  unavailabilityReason?: string | null;
}

export interface WorkerTypeInfo {
  enumValue: string;
  displayName: string;
  description: string;
}

// ==================== Agency ====================
export interface AgencyBasicInfo {
  agencyId: string;
  agencyName: string;
  city: PakistanCity;
}

export interface AgencyListItem {
  agencyId: string;
  agencyName: string;
  city: PakistanCity;
  verificationStatus: string;
  totalWorkers: number;
  averageRating: number;
  totalJobsCompleted: number;
}

export interface AgencyProfile {
  agencyId: string;
  userId: string;
  username: string;
  email: string;
  phoneNumber: string;
  agencyName: string;
  description: string;
  contactNumber: string;
  contactEmail: string;
  city: PakistanCity;
  address: string;
  serviceCities: PakistanCity[];
  licenseNumber: string | null;
  hasLicenseDocument: boolean;
  verificationStatus: string;
  totalWorkers: number;
  averageRating: number;
  totalJobsCompleted: number;
  ownerUserId?: string;
  subscriptionStatus?: AgencySubscriptionStatus;
  subscriptionExpiresAt?: string;
  subscriptionActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgency {
  agencyName: string;
  description?: string;
  contactNumber: string;
  contactEmail?: string;
  city: PakistanCity;
  address: string;
  serviceCities?: PakistanCity[];
  licenseNumber?: string;
}

export interface UpdateAgency {
  agencyName?: string;
  description?: string;
  contactNumber?: string;
  contactEmail?: string;
  city?: PakistanCity;
  address?: string;
  serviceCities?: PakistanCity[];
  licenseNumber?: string;
}

export type AgencySubscriptionStatus = 'INACTIVE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type MockPaymentMethod = 'MOCK_CARD' | 'MOCK_BANK' | 'MOCK_WALLET';

export interface AgencySubscription {
  subscriptionId: string;
  agencyId: string;
  payerUserId: string;
  amount: number;
  currency: string;
  paymentMethod: MockPaymentMethod;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  paidAt: string;
  expiresAt: string;
}

export interface PayAgencySubscriptionRequest {
  agencyId: string;
  paymentMethod: MockPaymentMethod;
  maskedDetails: string;
}

export type AgencyMemberRole = 'AGENCY_ADMIN' | 'AGENCY_MANAGER' | 'AGENCY_WORKER';

export type AppMode = 'CUSTOMER' | 'WORKER' | 'AGENCY';

export interface WorkerInvitation {
  invitationId: string;
  agencyId: string;
  agencyName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export type AgencyMembershipStatus = 'ACTIVE' | 'LEFT' | 'REMOVED';

export interface AgencyMembershipHistoryItem {
  memberId: string;
  userId: string;
  workerId: string | null;
  username: string;
  firstName: string;
  lastName: string;
  workerType: string | null;
  membershipStatus: AgencyMembershipStatus;
  joinedAt: string;
  leftAt: string | null;
}

// ==================== Chat ====================
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'OFFER' | 'SYSTEM';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';
export type ConversationType = 'DIRECT' | 'ORDER';
export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
export type ParticipantRole = 'CONSUMER' | 'WORKER' | 'AGENCY';
export type PresenceStatus = 'ONLINE' | 'OFFLINE' | 'AWAY';

export interface Participant {
  userId: string;
  displayName: string;
  role: ParticipantRole;
  agencyId?: string | null;
  joinedAt: string;
  lastReadAt: string | null;
}

export interface ConversationMetadata {
  orderId: string | null;
  workerServiceType: string | null;
  title: string | null;
}

export interface LastMessageInfo {
  content: string;
  senderId: string;
  senderUsername: string;
  type: MessageType;
  sentAt: string;
}

export interface MediaInfo {
  s3Key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailS3Key: string | null;
}

export interface OfferInfo {
  description: string;
  amount: number;
  currency: string;
  deliveryDays: number;
  status: OfferStatus;
  respondedAt: string | null;
  expiresAt: string;
  linkedJobId?: string;
}

export interface ConversationResponse {
  id: string;
  type: ConversationType;
  participants: Participant[];
  metadata: ConversationMetadata;
  lastMessage: LastMessageInfo | null;
  status: ConversationStatus;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationListResponse {
  content: ConversationResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateConversationRequest {
  senderContext: ParticipantRole;
  senderAgencyId?: string;
  targetContext: ParticipantRole;
  targetUserId?: string;
  targetAgencyId?: string;
  type: ConversationType;
  title?: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  type: MessageType;
  content: string;
  media: MediaInfo | null;
  offer: OfferInfo | null;
  status: MessageStatus;
  createdAt: string;
  editedAt: string | null;
}

export interface MessagePageResponse {
  messages: MessageResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SendMessageRequest {
  type: MessageType;
  content?: string;
  mediaS3Key?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  mediaMimeType?: string;
}

export interface CreateOfferRequest {
  description: string;
  amount: number;
  currency: string;
  deliveryDays: number;
  expiresInHours?: number;
}

export interface OfferResponse {
  messageId: string;
  conversationId: string;
  offer: OfferInfo;
  senderId: string;
  senderUsername: string;
  createdAt: string;
}

export interface WebSocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  type: MessageType;
  content: string;
  mediaS3Key?: string;
  mediaFileName?: string;
  mediaMimeType?: string;
  timestamp: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  typing: boolean;
}

export interface PresenceUpdate {
  userId: string;
  username: string;
  status: PresenceStatus;
  lastSeenAt: string;
}

// ==================== Job Listings ====================
export type JobStatus = 'DRAFT' | 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
export type BudgetType = 'FIXED' | 'HOURLY' | 'DAILY' | 'NEGOTIABLE';
export type UrgencyLevel = 'EMERGENCY' | 'URGENT' | 'NORMAL' | 'FLEXIBLE';
export type ReviewType =
  | 'CONSUMER_TO_WORKER'
  | 'WORKER_TO_CONSUMER'
  | 'CONSUMER_TO_AGENCY'
  | 'AGENCY_TO_CONSUMER';

export interface JobListingResponse {
  jobId: string;
  consumerId: string;
  consumerUsername: string;
  consumerFirstName: string;
  consumerLastName: string;
  title: string;
  description: string;
  workerType: WorkerType;
  workerTypeDisplayName: string;
  tags: string[];
  budgetMin: number;
  budgetMax: number;
  budgetType: BudgetType;
  city: PakistanCity;
  cityDisplayName: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  urgency: UrgencyLevel;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
  imagePaths: string[];
  status: JobStatus;
  assignedWorkerId: string | null;
  assignedBidId: string | null;
  assignedWorkerUsername: string | null;
  assignedAgencyId: string | null;
  assignedAgencyName: string | null;
  dispatchedWorkerId: string | null;
  dispatchedWorkerUsername: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  consumerConfirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  expiresAt: string | null;
  bidCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobListingSummaryResponse {
  jobId: string;
  title: string;
  workerType: WorkerType;
  workerTypeDisplayName: string;
  city: PakistanCity;
  cityDisplayName: string;
  area: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: BudgetType;
  urgency: UrgencyLevel;
  status: JobStatus;
  bidCount: number;
  consumerUsername: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface JobListingListResponse {
  listings: JobListingSummaryResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateJobListing {
  title: string;
  description: string;
  workerType: WorkerType;
  tags?: string[];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: BudgetType;
  city: PakistanCity;
  area?: string;
  latitude?: number;
  longitude?: number;
  urgency?: UrgencyLevel;
  preferredStartDate?: string;
  preferredEndDate?: string;
  consumerFirstName?: string;
  consumerLastName?: string;
  publishImmediately?: boolean;
}

export interface UpdateJobListing {
  title?: string;
  description?: string;
  workerType?: WorkerType;
  tags?: string[];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: BudgetType;
  city?: PakistanCity;
  area?: string;
  urgency?: UrgencyLevel;
  preferredStartDate?: string;
  preferredEndDate?: string;
}

export interface CreateJobFromOffer {
  title: string;
  description: string;
  workerType: WorkerType;
  city: PakistanCity;
  area?: string;
  budgetAmount: number;
  budgetType?: BudgetType;
  deliveryDays?: number;
  consumerId: string;
  consumerUsername: string;
  consumerFirstName?: string;
  consumerLastName?: string;
  // Worker performer (mutually exclusive with agency)
  workerId?: string;
  workerUsername?: string;
  workerFirstName?: string;
  workerLastName?: string;
  workerWorkerType?: WorkerType;
  workerExperienceYears?: number;
  workerRating?: number;
  // Agency performer (mutually exclusive with worker)
  agencyId?: string;
  agencyName?: string;
}

export interface JobSearchParams {
  workerType?: WorkerType;
  city?: PakistanCity;
  area?: string;
  budgetMin?: number;
  budgetMax?: number;
  urgency?: UrgencyLevel;
  status?: JobStatus;
  tags?: string;
  search?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  size?: number;
}

// ==================== Bids ====================
export interface BidResponse {
  bidId: string;
  jobId: string;
  /** Set on worker bids; null on agency bids. */
  workerId: string | null;
  workerUsername: string | null;
  workerFirstName: string | null;
  workerLastName: string | null;
  /** Set on agency bids; null on worker bids. */
  agencyId: string | null;
  agencyName: string | null;
  workerWorkerType: WorkerType;
  workerExperienceYears: number;
  workerRating: number;
  proposedAmount: number;
  proposedRateType: BudgetType;
  coverMessage: string;
  estimatedDays: number;
  proposedStartDate: string | null;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BidListResponse {
  bids: BidResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateBid {
  proposedAmount: number;
  proposedRateType?: BudgetType;
  coverMessage?: string;
  estimatedDays?: number;
  proposedStartDate?: string;
  // Worker bidder fields (when bidding as a worker)
  workerFirstName?: string;
  workerLastName?: string;
  workerWorkerType?: WorkerType;
  workerExperienceYears?: number;
  workerRating?: number;
  // Agency bidder fields (when bidding as an agency)
  agencyId?: string;
  agencyName?: string;
}

export interface DispatchJobRequest {
  workerId: string;
}

export interface UpdateBid {
  proposedAmount?: number;
  proposedRateType?: BudgetType;
  coverMessage?: string;
  estimatedDays?: number;
  proposedStartDate?: string;
}

// ==================== Reviews ====================
export interface ReviewResponse {
  reviewId: string;
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  reviewType: ReviewType;
  rating: number;
  comment: string;
  qualityRating: number | null;
  punctualityRating: number | null;
  communicationRating: number | null;
  valueRating: number | null;
  reliabilityRating: number | null;
  createdAt: string;
}

export interface ReviewListResponse {
  reviews: ReviewResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateReview {
  rating: number;
  comment?: string;
  qualityRating?: number;
  punctualityRating?: number;
  communicationRating?: number;
  valueRating?: number;
  reliabilityRating?: number;
}

export interface RatingSummary {
  userId: string;
  averageRating: number;
  totalReviews: number;
  averageQualityRating: number;
  averagePunctualityRating: number;
  averageCommunicationRating: number;
  averageValueRating: number;
  averageReliabilityRating: number;
}

// ==================== Location ====================
export interface WorkerLocationUpdate {
  workerId: string;
  jobId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// ==================== Navigation ====================
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  WorkerTabs: undefined;
  WorkerSubscription: undefined;
  NearbyWorkersMap: undefined;
  WorkerDetail: { workerId: string };
  EditProfile: undefined;
  CreateWorkerProfile: undefined;
  EditWorkerProfile: undefined;
  JobListingDetail: { jobId: string };
  CreateJobListing: undefined;
  PlaceBid: { jobId: string; jobTitle: string };
  ChatDetail: { conversationId: string; participantName: string; participantAvatar: string | null };
  UserProfile: {
    userId: string;
    senderContext?: ParticipantRole;
    senderAgencyId?: string;
  };
  LeaveReview: {
    jobId: string;
    revieweeName: string;
    reviewType: ReviewType;
  };
  LiveTracking: { sessionId: string; isWorker: boolean };
  CreateAgency: undefined;
  AgencySubscriptionPayment: { agencyId: string };
  AgencyDashboard: undefined;
  AgencyWorkers: { agencyId: string };
  AddWorker: { agencyId: string };
  MyAgencyInvitations: undefined;
  BrowseAgencies: undefined;
  AgencyProfile: { agencyId: string };
  AgencyTabs: undefined;
  OtpVerification: {
    flow: 'SIGNUP' | 'PHONE_CHANGE';
    e164Phone: string;
    signupData?: RegisterRequest;
  };
  JobPayment: {
    jobId: string;
    bidId: string;
    /** Exactly one of workerId/agencyId is set, matching the bid's recipient. */
    workerId?: string;
    agencyId?: string;
    /** Display name — "Worker Name" or "Agency Name". */
    recipientName: string;
    amount: number;
  };
  Payments: undefined;
  PaymentDetail: { transactionId: string };
  ResolutionCenter: undefined;
  SubmitDispute: { jobId?: string };
  DisputeDetail: { disputeId: string };
};

export type AgencyTabParamList = {
  AgencyDashboard: undefined;
  AgencyFindJobs: undefined;
  AgencyMessages: { initialTab?: ParticipantRole } | undefined;
  AgencyProfile: undefined;
};

export type MainTabParamList = {
  Services: undefined;
  Listings: undefined;
  Messages: { initialTab?: ParticipantRole } | undefined;
  Settings: undefined;
  Profile: undefined;
};

export type WorkerTabParamList = {
  WorkerDashboard: undefined;
  WorkerRequests: undefined;
  WorkerMessages: undefined;
  WorkerProfile: undefined;
};

// ── Subscription ──────────────────────────────────────────────────────────────
export interface PaySubscriptionRequest {
  paymentMethod: 'MOCK_CARD' | 'MOCK_BANK' | 'MOCK_WALLET';
  maskedDetails?: string;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  workerId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  paidAt: string;
  expiresAt: string;
  maskedDetails?: string;
}

// ── Nearby Workers ────────────────────────────────────────────────────────────
export interface NearbyWorkerListItem extends WorkerListItem {
  shopLatitude?: number;
  shopLongitude?: number;
  distanceKm?: number;
}

// ── Live Tracking ─────────────────────────────────────────────────────────────
export interface StartTrackingRequest {
  conversationId: string;
  workerId: string;
  customerLatitude: number;
  customerLongitude: number;
}

export interface TrackingResponse {
  sessionId: string;
  conversationId: string;
  workerId: string;
  consumerId: string;
  customerLatitude: number;
  customerLongitude: number;
  workerLatitude?: number;
  workerLongitude?: number;
  workerLocationUpdatedAt?: string;
  status: 'ACTIVE' | 'COMPLETED';
  startedAt: string;
  completedAt?: string;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: number;
}

// ==================== Payments (per-job) ====================

export type PaymentMethod = 'MOCK_CARD' | 'MOCK_BANK' | 'MOCK_WALLET';
export type TransactionStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED' | 'FAILED' | 'CANCELLED';
export type EscrowHoldStatus = 'ACTIVE' | 'RELEASED' | 'REFUNDED';
export type EscrowReleaseReason = 'JOB_COMPLETED' | 'DISPUTED' | 'CANCELLED' | 'ADMIN_OVERRIDE';

export interface InitiatePaymentRequest {
  jobId: string;
  /** Exactly one of workerId or agencyId must be set. */
  workerId?: string;
  agencyId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface PaymentTransaction {
  transactionId: string;
  jobId: string;
  consumerId: string;
  /** Set when the recipient is an individual worker; null for agency payments. */
  workerId?: string;
  /** Set when the recipient is an agency; null for direct worker payments. */
  agencyId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  failureReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowHold {
  escrowId: string;
  transactionId: string;
  heldAmount: number;
  holdStatus: EscrowHoldStatus;
  releaseReason?: EscrowReleaseReason;
  releasedAt?: string;
  createdAt: string;
}

// ==================== Disputes ====================

export type DisputeCategory = 'PAYMENT' | 'NO_SHOW' | 'QUALITY' | 'BEHAVIOR' | 'OTHER';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type DisputeRaisedByRole = 'CONSUMER' | 'WORKER';

export interface DisputeSubmission {
  jobId: string;
  category: DisputeCategory;
  subject: string;
  description: string;
}

export interface Dispute {
  disputeId: string;
  jobId: string;
  raisedBy: string;
  raisedByRole: DisputeRaisedByRole;
  category: DisputeCategory;
  subject: string;
  description: string;
  status: DisputeStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisputePage {
  content: Dispute[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

