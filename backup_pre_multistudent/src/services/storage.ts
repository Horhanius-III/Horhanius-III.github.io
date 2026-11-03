import {
  AdminUser,
  AuditLog,
  FacilityLocation,
  FormSection2Template,
  ServiceSession,
  SSLForm,
  Volunteer,
} from '../types';
import { SWE_FACILITIES } from '../data/facilities';
import { generateSWEId } from '../utils/idGenerator';

const DB_KEY = 'swe_volunteer_db_v1';
const SYNC_CHANNEL_NAME = 'swe_sync_channel';

interface DatabaseSchema {
  volunteers: Volunteer[];
  sessions: ServiceSession[];
  sslForms: SSLForm[];
  auditLogs: AuditLog[];
  adminUsers: AdminUser[];
  facilities: FacilityLocation[];
  section2Template: FormSection2Template;
}

// Initial seed data for immediate demonstration and real-world testing
function getInitialSeedData(): DatabaseSchema {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2.25 * 60 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString();
  const thirtyMinsAgo = new Date(now.getTime() - 0.5 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const yesterdayEnd = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();

  const volunteers: Volunteer[] = [
    {
      id: 'vol-marcus-chen',
      sweId: 'MC-4821',
      name: 'Marcus Chen',
      email: 'marcus.chen@student.mcpsmd.net',
      studentId: 'MCPS-938210',
      school: 'Richard Montgomery High School',
      grade: '11th Grade',
      phone: '(240) 555-0192',
      totalHours: 14.5,
      sessionCount: 4,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      authMethod: 'google',
    },
    {
      id: 'vol-maya-patel',
      sweId: 'MP-7723',
      name: 'Maya Patel',
      email: 'maya.patel@student.mcpsmd.net',
      studentId: 'MCPS-829104',
      school: 'Rockville High School',
      grade: '12th Grade',
      phone: '(301) 555-0143',
      totalHours: 28.0,
      sessionCount: 7,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      authMethod: 'kiosk',
    },
    {
      id: 'vol-jordan-washington',
      sweId: 'JW-3109',
      name: 'Jordan Washington',
      email: 'jordan.w@gmail.com',
      studentId: 'BCPS-449120',
      school: 'Catonsville High School',
      grade: '10th Grade',
      phone: '(410) 555-0188',
      totalHours: 8.0,
      sessionCount: 2,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      authMethod: 'swe_account',
    },
    {
      id: 'vol-emily-zhao',
      sweId: 'EZ-9941',
      name: 'Emily Zhao',
      email: 'emily.zhao@student.mcpsmd.net',
      studentId: 'MCPS-771920',
      school: 'Wootton High School',
      grade: '11th Grade',
      phone: '(301) 555-0199',
      totalHours: 19.5,
      sessionCount: 5,
      createdAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      authMethod: 'google',
    },
  ];

  const sessions: ServiceSession[] = [
    // 1. Currently Serving session (Checked in and approved 2 hours ago)
    {
      id: 'sess-maya-active',
      volunteerId: 'vol-maya-patel',
      sweId: 'MP-7723',
      volunteerName: 'Maya Patel',
      volunteerEmail: 'maya.patel@student.mcpsmd.net',
      school: 'Rockville High School',
      grade: '12th Grade',
      studentId: 'MCPS-829104',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse & Main Food Hub',
      activityType: 'Food Pantry Packing & Distribution',
      checkInTime: twoHoursAgo,
      checkInGps: {
        lat: 39.0533,
        lng: -77.1084,
        accuracy: 12,
        distanceMeters: 28,
        isOutsideGeofence: false,
      },
      checkInStatus: 'approved',
      checkInApprovedBy: 'Sarah Jenkins (Coordinator)',
      checkInApprovedAt: new Date(now.getTime() - 2.2 * 60 * 60 * 1000).toISOString(),
      checkOutStatus: 'not_requested',
      totalHours: 2.25,
      createdAt: twoHoursAgo,
    },
    // 2. Pending Check-in Request (Student just arrived and requested check-in 10 min ago)
    {
      id: 'sess-marcus-pending-checkin',
      volunteerId: 'vol-marcus-chen',
      sweId: 'MC-4821',
      volunteerName: 'Marcus Chen',
      volunteerEmail: 'marcus.chen@student.mcpsmd.net',
      school: 'Richard Montgomery High School',
      grade: '11th Grade',
      studentId: 'MCPS-938210',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse & Main Food Hub',
      activityType: 'Fresh Produce Sorting & Warehouse Logistics',
      checkInTime: thirtyMinsAgo,
      checkInGps: {
        lat: 39.0532,
        lng: -77.1081,
        accuracy: 15,
        distanceMeters: 45,
        isOutsideGeofence: false,
      },
      checkInStatus: 'pending',
      checkOutStatus: 'not_requested',
      totalHours: 0.5,
      createdAt: thirtyMinsAgo,
    },
    // 3. Pending Checkout Request (Volunteer Jordan Washington finished shift, requested checkout, but GPS is flagged >300m away!)
    {
      id: 'sess-jordan-pending-checkout',
      volunteerId: 'vol-jordan-washington',
      sweId: 'JW-3109',
      volunteerName: 'Jordan Washington',
      volunteerEmail: 'jordan.w@gmail.com',
      school: 'Catonsville High School',
      grade: '10th Grade',
      studentId: 'BCPS-449120',
      facilityId: 'baltimore-hub',
      facilityName: 'Baltimore Regional Distribution Center',
      activityType: 'Emergency Food Box Drive-Thru',
      checkInTime: threeHoursAgo,
      checkInGps: {
        lat: 39.2482,
        lng: -76.6812,
        accuracy: 10,
        distanceMeters: 22,
        isOutsideGeofence: false,
      },
      checkInStatus: 'approved',
      checkInApprovedBy: 'Marcus Vance (Pantry Manager)',
      checkInApprovedAt: new Date(now.getTime() - 3.4 * 60 * 60 * 1000).toISOString(),
      checkOutTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      checkOutGps: {
        lat: 39.2560,
        lng: -76.6890,
        accuracy: 25,
        distanceMeters: 940, // FLAGGED: 940m away (>300m)
        isOutsideGeofence: true,
      },
      checkOutStatus: 'pending',
      totalHours: 3.4,
      notes: 'Sorted 85 family cereal and shelf-stable boxes.',
      createdAt: threeHoursAgo,
    },
    // 4. Completed & Verified past session
    {
      id: 'sess-emily-completed',
      volunteerId: 'vol-emily-zhao',
      sweId: 'EZ-9941',
      volunteerName: 'Emily Zhao',
      volunteerEmail: 'emily.zhao@student.mcpsmd.net',
      school: 'Wootton High School',
      grade: '11th Grade',
      studentId: 'MCPS-771920',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse & Main Food Hub',
      activityType: 'Food Pantry Packing & Distribution',
      checkInTime: yesterday,
      checkInGps: {
        lat: 39.0531,
        lng: -77.1082,
        accuracy: 10,
        distanceMeters: 15,
        isOutsideGeofence: false,
      },
      checkInStatus: 'approved',
      checkInApprovedBy: 'Sarah Jenkins (Coordinator)',
      checkInApprovedAt: yesterday,
      checkOutTime: yesterdayEnd,
      checkOutGps: {
        lat: 39.0530,
        lng: -77.1083,
        accuracy: 12,
        distanceMeters: 30,
        isOutsideGeofence: false,
      },
      checkOutStatus: 'approved',
      checkOutApprovedBy: 'Sarah Jenkins (Coordinator)',
      checkOutApprovedAt: yesterdayEnd,
      totalHours: 4.0,
      notes: 'Packed emergency holiday food baskets for local Montgomery County families.',
      sslFormId: 'ssl-form-emily-1',
      createdAt: yesterday,
    },
  ];

  const sslForms: SSLForm[] = [
    {
      id: 'ssl-form-emily-1',
      sessionIds: ['sess-emily-completed'],
      volunteerId: 'vol-emily-zhao',
      sweId: 'EZ-9941',
      studentName: 'Emily Zhao',
      studentEmail: 'emily.zhao@student.mcpsmd.net',
      studentId: 'MCPS-771920',
      school: 'Wootton High School',
      grade: '11th Grade',
      organization: 'So What Else, Inc.',
      ein: '27-0899847',
      facilityName: 'Rockville Warehouse & Main Food Hub',
      supervisorName: 'Sarah Jenkins',
      supervisorTitle: 'Director of Volunteer Operations',
      supervisorEmail: 'sjenkins@sowhatelse.org',
      supervisorPhone: '(240) 668-4500',
      dateRange: {
        start: '2026-10-25',
        end: '2026-10-25',
      },
      totalVerifiedHours: 4.0,
      activityDescription:
        'Food pantry stocking, sorting fresh produce donations, assembling emergency family food packages, and curbside distribution to community members.',
      status: 'issued',
      shareToken: 'swe-ssl-ez9941-oct26',
      createdAt: yesterdayEnd,
      supervisorSignature: 'Sarah Jenkins, Dir. Volunteer Ops',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      timestamp: threeHoursAgo,
      action: 'checkin_request',
      actor: 'Jordan Washington (JW-3109)',
      details: 'Check-in requested at Baltimore Regional Distribution Center. GPS verified (22m from site).',
      flaggedGps: false,
      sessionId: 'sess-jordan-pending-checkout',
    },
    {
      id: 'log-2',
      timestamp: new Date(now.getTime() - 3.4 * 60 * 60 * 1000).toISOString(),
      action: 'checkin_approved',
      actor: 'Marcus Vance (Pantry Manager)',
      details: 'Approved check-in for Jordan Washington (JW-3109) in person at Baltimore Hub.',
      flaggedGps: false,
      sessionId: 'sess-jordan-pending-checkout',
    },
    {
      id: 'log-3',
      timestamp: twoHoursAgo,
      action: 'checkin_approved',
      actor: 'Sarah Jenkins (Coordinator)',
      details: 'Approved check-in for Maya Patel (MP-7723) at Rockville Warehouse.',
      flaggedGps: false,
      sessionId: 'sess-maya-active',
    },
    {
      id: 'log-4',
      timestamp: thirtyMinsAgo,
      action: 'checkin_request',
      actor: 'Marcus Chen (MC-4821)',
      details: 'Check-in requested via Kiosk at Rockville Warehouse. GPS verified (45m from site).',
      flaggedGps: false,
      sessionId: 'sess-marcus-pending-checkin',
    },
    {
      id: 'log-5',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      action: 'checkout_request',
      actor: 'Jordan Washington (JW-3109)',
      details: '⚠️ CHECKOUT GPS FLAGGED: User location is 940m outside Baltimore Hub (>300m threshold). Flagged for admin verification.',
      flaggedGps: true,
      sessionId: 'sess-jordan-pending-checkout',
    },
  ];

  const adminUsers: AdminUser[] = [
    {
      email: 'swewebapp@gmail.com',
      name: 'Super Admin (So What Else)',
      role: 'super_admin',
      siteAssigned: 'All Facilities',
    },
    {
      email: 'sjenkins@sowhatelse.org',
      name: 'Sarah Jenkins',
      role: 'admin',
      approvedBy: 'swewebapp@gmail.com',
      siteAssigned: 'Rockville Warehouse & Main Food Hub',
    },
    {
      email: 'mvance@sowhatelse.org',
      name: 'Marcus Vance',
      role: 'admin',
      approvedBy: 'swewebapp@gmail.com',
      siteAssigned: 'Baltimore Regional Distribution Center',
    },
    {
      email: 'pantry.staff@sowhatelse.org',
      name: 'Pantry Volunteer Coordinator',
      role: 'pending',
      siteAssigned: 'Montgomery Village Community Food Pantry',
    },
  ];

  const section2Template: FormSection2Template = {
    id: 'template-default',
    name: 'Default So What Else MCPS Template',
    organizationName: 'So What Else, Inc.',
    taxId: '27-0899847',
    phone: '(240) 668-4500',
    address: '4924 Wyaconda Rd, Rockville, MD 20852',
    email: 'volunteer@sowhatelse.org',
    isMcpsListed: true,
    serviceType: 'DIRECT',
    academicPreparationText: '', // Left empty by default per user prompt
    activityDescriptionText: '', // Left empty by default per user prompt
  };

  return {
    volunteers,
    sessions,
    sslForms,
    auditLogs,
    adminUsers,
    facilities: SWE_FACILITIES,
    section2Template,
  };
}

class StorageService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      this.channel.onmessage = () => {
        this.notifyListeners();
      };
      window.addEventListener('storage', (e) => {
        if (e.key === DB_KEY) {
          this.notifyListeners();
        }
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => fn());
  }

  private broadcastChange(): void {
    this.notifyListeners();
    if (this.channel) {
      this.channel.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
    }
  }

  public getDatabase(): DatabaseSchema {
    if (typeof window === 'undefined') {
      return getInitialSeedData();
    }
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial = getInitialSeedData();
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      const parsed = JSON.parse(raw);
      // Ensure all collections exist
      if (!parsed.volunteers || !parsed.sessions) {
        throw new Error('Incomplete data');
      }
      if (!parsed.section2Template) {
        parsed.section2Template = getInitialSeedData().section2Template;
      }
      return parsed;
    } catch {
      const initial = getInitialSeedData();
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  public saveDatabase(db: DatabaseSchema): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      this.broadcastChange();
    }
  }

  public resetToDefault(): void {
    const fresh = getInitialSeedData();
    this.saveDatabase(fresh);
  }

  // --- Section II Template Operations ---
  public getSection2Template(): FormSection2Template {
    return this.getDatabase().section2Template;
  }

  public updateSection2Template(template: FormSection2Template, updatedBy = 'Admin'): void {
    const db = this.getDatabase();
    db.section2Template = template;
    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'ssl_generated',
      actor: updatedBy,
      details: `Updated MCPS Form Section II description template. Academic Prep: ${
        template.academicPreparationText ? 'Customized' : 'Empty placeholder'
      }, Service Activity: ${
        template.activityDescriptionText ? 'Customized' : 'Empty placeholder'
      }`,
      flaggedGps: false,
    });
    this.saveDatabase(db);
  }

  // --- Volunteers Operations ---
  public getVolunteers(): Volunteer[] {
    return this.getDatabase().volunteers;
  }

  public findVolunteerBySweId(sweId: string): Volunteer | undefined {
    const id = sweId.trim().toUpperCase();
    return this.getVolunteers().find((v) => v.sweId.toUpperCase() === id);
  }

  public findVolunteerByEmail(email: string): Volunteer | undefined {
    const clean = email.trim().toLowerCase();
    return this.getVolunteers().find((v) => v.email.toLowerCase() === clean);
  }

  public findOrCreateVolunteer(params: {
    name: string;
    email: string;
    studentId?: string;
    school?: string;
    grade?: string;
    phone?: string;
    authMethod?: 'kiosk' | 'google' | 'swe_account';
  }): Volunteer {
    const db = this.getDatabase();
    let existing = db.volunteers.find(
      (v) => v.email.toLowerCase() === params.email.trim().toLowerCase()
    );

    if (existing) {
      // Update with newly provided optional fields
      existing = {
        ...existing,
        name: params.name || existing.name,
        studentId: params.studentId || existing.studentId,
        school: params.school || existing.school,
        grade: params.grade || existing.grade,
        phone: params.phone || existing.phone,
      };
      const idx = db.volunteers.findIndex((v) => v.id === existing!.id);
      db.volunteers[idx] = existing;
      this.saveDatabase(db);
      return existing;
    }

    const allSweIds = db.volunteers.map((v) => v.sweId);
    const newSweId = generateSWEId(params.name, allSweIds);
    const newVol: Volunteer = {
      id: `vol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sweId: newSweId,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      studentId: params.studentId?.trim(),
      school: params.school?.trim(),
      grade: params.grade?.trim(),
      phone: params.phone?.trim(),
      totalHours: 0,
      sessionCount: 0,
      createdAt: new Date().toISOString(),
      authMethod: params.authMethod || 'kiosk',
    };

    db.volunteers.push(newVol);
    this.saveDatabase(db);
    return newVol;
  }

  // --- Sessions Operations ---
  public getSessions(): ServiceSession[] {
    return this.getDatabase().sessions;
  }

  public getActiveSessionForVolunteer(volunteerId: string): ServiceSession | undefined {
    return this.getSessions().find(
      (s) =>
        s.volunteerId === volunteerId &&
        (s.checkInStatus === 'pending' ||
          (s.checkInStatus === 'approved' && s.checkOutStatus !== 'approved'))
    );
  }

  public requestCheckIn(params: {
    volunteer: Volunteer;
    facilityId: string;
    activityType: string;
    gps?: {
      lat: number;
      lng: number;
      accuracy: number;
      distanceMeters: number;
      isOutsideGeofence: boolean;
      deniedOrUnavailable?: boolean;
    };
    notes?: string;
  }): ServiceSession {
    const db = this.getDatabase();
    const facility =
      db.facilities.find((f) => f.id === params.facilityId) || SWE_FACILITIES[0];

    const session: ServiceSession = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      volunteerId: params.volunteer.id,
      sweId: params.volunteer.sweId,
      volunteerName: params.volunteer.name,
      volunteerEmail: params.volunteer.email,
      school: params.volunteer.school,
      grade: params.volunteer.grade,
      studentId: params.volunteer.studentId,
      facilityId: facility.id,
      facilityName: facility.name,
      activityType: params.activityType,
      checkInTime: new Date().toISOString(),
      checkInGps: params.gps,
      checkInStatus: 'pending',
      checkOutStatus: 'not_requested',
      totalHours: 0,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    db.sessions.unshift(session);

    // Audit log
    const isFlagged = Boolean(params.gps?.isOutsideGeofence);
    const details = isFlagged
      ? `⚠️ CHECK-IN GPS FLAGGED: ${params.volunteer.name} (${params.volunteer.sweId}) requested check-in at ${facility.name} from ${params.gps?.distanceMeters}m away (>300m threshold).`
      : `Check-in requested: ${params.volunteer.name} (${params.volunteer.sweId}) at ${facility.name} (GPS: ${params.gps?.distanceMeters ?? 'N/A'}m).`;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'checkin_request',
      actor: `${params.volunteer.name} (${params.volunteer.sweId})`,
      details,
      flaggedGps: isFlagged,
      sessionId: session.id,
    });

    this.saveDatabase(db);
    return session;
  }

  public approveCheckIn(sessionId: string, adminName: string): void {
    const db = this.getDatabase();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    session.checkInStatus = 'approved';
    session.checkInApprovedBy = adminName;
    session.checkInApprovedAt = new Date().toISOString();

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'checkin_approved',
      actor: adminName,
      details: `In-person check-in approved for ${session.volunteerName} (${session.sweId}) at ${session.facilityName}. Serving timer started.`,
      flaggedGps: Boolean(session.checkInGps?.isOutsideGeofence),
      sessionId: session.id,
    });

    this.saveDatabase(db);
  }

  public rejectCheckIn(sessionId: string, adminName: string, reason: string): void {
    const db = this.getDatabase();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    session.checkInStatus = 'rejected';
    session.notes = `${session.notes ? session.notes + ' | ' : ''}Rejected by ${adminName}: ${reason}`;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'checkin_rejected',
      actor: adminName,
      details: `Check-in rejected for ${session.volunteerName} (${session.sweId}): ${reason}`,
      flaggedGps: false,
      sessionId: session.id,
    });

    this.saveDatabase(db);
  }

  public requestCheckOut(params: {
    sessionId: string;
    notes?: string;
    gps?: {
      lat: number;
      lng: number;
      accuracy: number;
      distanceMeters: number;
      isOutsideGeofence: boolean;
      deniedOrUnavailable?: boolean;
    };
  }): ServiceSession | undefined {
    const db = this.getDatabase();
    const session = db.sessions.find((s) => s.id === params.sessionId);
    if (!session) return undefined;

    const checkOutTime = new Date().toISOString();
    const startMs = new Date(session.checkInTime).getTime();
    const endMs = new Date(checkOutTime).getTime();
    const calculatedHours = Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 100) / 100;

    session.checkOutTime = checkOutTime;
    session.checkOutGps = params.gps;
    session.checkOutStatus = 'pending';
    session.totalHours = calculatedHours;
    if (params.notes) {
      session.notes = session.notes ? `${session.notes} | ${params.notes}` : params.notes;
    }

    const isFlagged = Boolean(params.gps?.isOutsideGeofence);
    const details = isFlagged
      ? `⚠️ CHECK-OUT GPS FLAGGED: ${session.volunteerName} requested checkout from ${params.gps?.distanceMeters}m outside ${session.facilityName} (>300m threshold).`
      : `Check-out requested: ${session.volunteerName} (${session.sweId}) at ${session.facilityName} (${calculatedHours} hrs logged).`;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'checkout_request',
      actor: `${session.volunteerName} (${session.sweId})`,
      details,
      flaggedGps: isFlagged,
      sessionId: session.id,
    });

    this.saveDatabase(db);
    return session;
  }

  public approveCheckOut(sessionId: string, adminName: string): void {
    const db = this.getDatabase();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    session.checkOutStatus = 'approved';
    session.checkOutApprovedBy = adminName;
    session.checkOutApprovedAt = new Date().toISOString();

    // Recalculate official verified hours
    const startMs = new Date(session.checkInTime).getTime();
    const endMs = session.checkOutTime ? new Date(session.checkOutTime).getTime() : Date.now();
    if (!session.checkOutTime) {
      session.checkOutTime = new Date(endMs).toISOString();
    }
    const hours = Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 100) / 100;
    session.totalHours = hours;

    // Update volunteer total hours
    const volunteer = db.volunteers.find((v) => v.id === session.volunteerId);
    if (volunteer) {
      volunteer.totalHours = Math.round((volunteer.totalHours + hours) * 100) / 100;
      volunteer.sessionCount += 1;
    }

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'checkout_approved',
      actor: adminName,
      details: `Check-out approved for ${session.volunteerName} (${session.sweId}). Verified ${hours} hours credited to student profile.`,
      flaggedGps: Boolean(session.checkOutGps?.isOutsideGeofence),
      sessionId: session.id,
    });

    this.saveDatabase(db);
  }

  public adjustSessionTime(
    sessionId: string,
    adjustedHours: number,
    reason: string,
    adminName: string
  ): void {
    const db = this.getDatabase();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const oldHours = session.totalHours;
    session.adminAdjustment = {
      originalCheckIn: session.checkInTime,
      originalCheckOut: session.checkOutTime,
      adjustedHours,
      reason,
      adjustedBy: adminName,
      adjustedAt: new Date().toISOString(),
    };
    session.totalHours = adjustedHours;

    // Adjust volunteer total
    const volunteer = db.volunteers.find((v) => v.id === session.volunteerId);
    if (volunteer && session.checkOutStatus === 'approved') {
      const diff = adjustedHours - oldHours;
      volunteer.totalHours = Math.round((volunteer.totalHours + diff) * 100) / 100;
    }

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'time_adjusted',
      actor: adminName,
      details: `Manual time adjustment for ${session.volunteerName}: changed from ${oldHours}h to ${adjustedHours}h. Reason: ${reason}`,
      flaggedGps: false,
      sessionId: session.id,
    });

    this.saveDatabase(db);
  }

  // --- SSL Forms Operations ---
  public getSSLForms(): SSLForm[] {
    return this.getDatabase().sslForms;
  }

  public createSSLForm(params: {
    volunteerId: string;
    sessionIds: string[];
    supervisorName: string;
    supervisorTitle: string;
    supervisorEmail: string;
    supervisorPhone: string;
    activityDescription: string;
    customHours?: number;
    academicPreparationText?: string;
  }): SSLForm {
    const db = this.getDatabase();
    const volunteer = db.volunteers.find((v) => v.id === params.volunteerId);
    if (!volunteer) throw new Error('Volunteer not found');

    const sessions = db.sessions.filter((s) => params.sessionIds.includes(s.id));
    const calculatedHours = sessions.reduce((acc, s) => acc + s.totalHours, 0);
    const finalHours =
      params.customHours !== undefined ? params.customHours : calculatedHours;

    const sortedDates = sessions
      .map((s) => s.checkInTime.split('T')[0])
      .sort();
    const startDate = sortedDates[0] || new Date().toISOString().split('T')[0];
    const endDate = sortedDates[sortedDates.length - 1] || startDate;

    const formId = `ssl-${Date.now()}-${volunteer.sweId.toLowerCase()}`;
    const shareToken = `swe-${Math.random().toString(36).substring(2, 9)}`;

    const form: SSLForm = {
      id: formId,
      sessionIds: params.sessionIds,
      volunteerId: volunteer.id,
      sweId: volunteer.sweId,
      studentName: volunteer.name,
      studentEmail: volunteer.email,
      studentId: volunteer.studentId,
      school: volunteer.school,
      grade: volunteer.grade,
      organization: 'So What Else, Inc.',
      ein: '27-0899847',
      facilityName: sessions[0]?.facilityName || 'Rockville Warehouse & Food Hub',
      supervisorName: params.supervisorName,
      supervisorTitle: params.supervisorTitle,
      supervisorEmail: params.supervisorEmail,
      supervisorPhone: params.supervisorPhone,
      dateRange: { start: startDate, end: endDate },
      totalVerifiedHours: Math.round(finalHours * 100) / 100,
      activityDescription: params.activityDescription,
      academicPreparationText: params.academicPreparationText || '',
      status: 'issued',
      shareToken,
      createdAt: new Date().toISOString(),
      supervisorSignature: `${params.supervisorName}, ${params.supervisorTitle}`,
    };

    // Mark sessions with sslFormId and certifiedHours
    sessions.forEach((s) => {
      s.sslFormId = formId;
      s.certifiedHours = Math.round((finalHours / (sessions.length || 1)) * 100) / 100;
    });

    db.sslForms.unshift(form);

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'ssl_generated',
      actor: params.supervisorName,
      details: `Generated official SSL verification form (${form.totalVerifiedHours} hrs) for ${volunteer.name} (${volunteer.sweId}).`,
      flaggedGps: false,
    });

    this.saveDatabase(db);
    return form;
  }

  public updateSSLFormHours(
    formId: string,
    newHours: number,
    adminName: string
  ): SSLForm | null {
    const db = this.getDatabase();
    const form = db.sslForms.find((f) => f.id === formId);
    if (!form) return null;

    const oldHours = form.totalVerifiedHours;
    form.totalVerifiedHours = Math.round(newHours * 100) / 100;

    // Update linked sessions
    const sessions = db.sessions.filter((s) => form.sessionIds.includes(s.id));
    sessions.forEach((s) => {
      s.certifiedHours = Math.round((form.totalVerifiedHours / (sessions.length || 1)) * 100) / 100;
    });

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'time_adjusted',
      actor: adminName,
      details: `Re-issued SSL Form ${form.id} for ${form.studentName} with updated hours: changed from ${oldHours}h to ${form.totalVerifiedHours}h.`,
      flaggedGps: false,
    });

    this.saveDatabase(db);
    return form;
  }

  public updateSSLStatus(formId: string, status: 'issued' | 'downloaded' | 'emailed'): void {
    const db = this.getDatabase();
    const form = db.sslForms.find((f) => f.id === formId || f.shareToken === formId);
    if (form) {
      form.status = status;
      this.saveDatabase(db);
    }
  }

  // --- Admin Users & Audit Logs ---
  public getAdminUsers(): AdminUser[] {
    return this.getDatabase().adminUsers;
  }

  public promoteAdminUser(email: string, promotedBy: string): void {
    const db = this.getDatabase();
    const user = db.adminUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.role = 'admin';
      user.approvedBy = promotedBy;

      db.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'admin_promoted',
        actor: promotedBy,
        details: `Approved admin access for ${user.name} (${user.email}).`,
        flaggedGps: false,
      });

      this.saveDatabase(db);
    }
  }

  public getAuditLogs(): AuditLog[] {
    return this.getDatabase().auditLogs;
  }
}

export const storageService = new StorageService();
