export interface FacilityLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  geofenceMeters: number; // default: 300
}

export interface GPSInfo {
  lat: number;
  lng: number;
  accuracy: number;
  distanceMeters: number;
  isOutsideGeofence: boolean;
  deniedOrUnavailable?: boolean;
}

export interface Volunteer {
  id: string;
  sweId: string; // e.g. "MC-4819"
  name: string;
  email: string;
  studentId?: string;
  school?: string;
  grade?: string;
  phone?: string;
  totalHours: number;
  sessionCount: number;
  createdAt: string;
  authMethod: 'kiosk' | 'google' | 'swe_account';
}

export type CheckInStatus = 'pending' | 'approved' | 'rejected';
export type CheckOutStatus = 'not_requested' | 'pending' | 'approved' | 'rejected';

export interface AdminAdjustment {
  originalCheckIn: string;
  originalCheckOut?: string;
  adjustedHours: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: string;
}

export interface ServiceSession {
  id: string;
  volunteerId: string;
  sweId: string;
  volunteerName: string;
  volunteerEmail: string;
  school?: string;
  grade?: string;
  studentId?: string;
  facilityId: string;
  facilityName: string;
  activityType: string;
  checkInTime: string;
  checkInGps?: GPSInfo;
  checkInStatus: CheckInStatus;
  checkInApprovedBy?: string;
  checkInApprovedAt?: string;
  checkOutTime?: string;
  checkOutGps?: GPSInfo;
  checkOutStatus: CheckOutStatus;
  checkOutApprovedBy?: string;
  checkOutApprovedAt?: string;
  totalHours: number;
  certifiedHours?: number;
  notes?: string;
  adminAdjustment?: AdminAdjustment;
  sslFormId?: string;
  createdAt: string;
}

export interface FormSection2Template {
  id: string;
  name: string;
  organizationName: string;
  taxId: string;
  phone: string;
  address: string;
  email: string;
  isMcpsListed: boolean;
  serviceType: 'DIRECT' | 'INDIRECT' | 'ADVOCACY';
  academicPreparationText: string; // empty by default
  activityDescriptionText: string; // empty by default
}

export interface SSLForm {
  id: string;
  sessionIds: string[];
  volunteerId: string;
  sweId: string;
  studentName: string;
  studentEmail: string;
  studentId?: string;
  school?: string;
  grade?: string;
  organization: string;
  ein: string;
  facilityName: string;
  supervisorName: string;
  supervisorTitle: string;
  supervisorEmail: string;
  supervisorPhone: string;
  dateRange: { start: string; end: string };
  totalVerifiedHours: number;
  activityDescription: string;
  academicPreparationText?: string;
  status: 'issued' | 'downloaded' | 'emailed';
  shareToken: string;
  verificationToken?: string;
  sha256Hash?: string;
  createdAt: string;
  supervisorSignature: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action:
    | 'checkin_request'
    | 'checkin_approved'
    | 'checkin_rejected'
    | 'checkout_request'
    | 'checkout_approved'
    | 'checkout_rejected'
    | 'time_adjusted'
    | 'ssl_generated'
    | 'admin_promoted';
  actor: string;
  details: string;
  flaggedGps: boolean;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminUser {
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'pending';
  approvedBy?: string;
  siteAssigned?: string;
}
