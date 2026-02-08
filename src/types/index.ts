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
  firstName: string;
  lastName: string;
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

// ==================== Chat (mock) ====================
export interface Chat {
  id: number;
  name: string;
  service: string;
  lastMessage: string;
  time: string;
  unread: number;
}

// ==================== Booking (mock - backend ~45% complete) ====================
export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface BookingRequest {
  bookingId: string;
  clientName: string;
  clientPhoneNumber: string;
  clientProfilePictureUrl: string | null;
  serviceType: WorkerType;
  description: string;
  proposedDate: string;
  proposedTime: string;
  location: string;
  city: PakistanCity;
  offeredRate: number;
  rateType: 'HOURLY' | 'DAILY' | 'FIXED';
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerStats {
  totalJobsCompleted: number;
  averageRating: number;
  totalEarnings: number;
  activeBookings: number;
  pendingRequests: number;
}

// ==================== Navigation ====================
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  WorkerTabs: undefined;
  WorkerDetail: { workerId: string };
  EditProfile: undefined;
  CreateWorkerProfile: undefined;
  EditWorkerProfile: undefined;
  WorkerBookingDetail: { bookingId: string };
};

export type MainTabParamList = {
  Services: undefined;
  Messages: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type WorkerTabParamList = {
  WorkerDashboard: undefined;
  WorkerRequests: undefined;
  WorkerMessages: undefined;
  WorkerProfile: undefined;
};
