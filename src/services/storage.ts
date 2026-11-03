import {
  AdminUser,
  AuditLog,
  FacilityLocation,
  FormRequirement,
  FormSection2Template,
  ServiceSession,
  SSLForm,
  Volunteer,
  VolunteerType,
} from '../types';
import { SWE_FACILITIES, ACTIVITY_TYPES } from '../data/facilities';
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
  customActivities?: string[];
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
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
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
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
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
      id: 'vol-robert-taylor',
      sweId: 'RT-1044',
      name: 'Robert Taylor',
      email: 'robert.taylor@gmail.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
      phone: '(301) 555-0812',
      totalHours: 42.0,
      sessionCount: 11,
      createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      authMethod: 'google',
    },
    {
      id: 'vol-jordan-washington',
      sweId: 'JW-3109',
      name: 'Jordan Washington',
      email: 'jordan.w@gmail.com',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
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
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
      studentId: 'MCPS-771920',
      school: 'Wootton High School',
      grade: '11th Grade',
      phone: '(301) 555-0199',
      totalHours: 19.5,
      sessionCount: 5,
      createdAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      authMethod: 'google',
    },
    {
      id: 'vol-chloe-davis',
      sweId: 'CD-5102',
      name: 'Chloe Davis',
      email: 'davis.family@gmail.com',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
      studentId: 'MCPS-610283',
      school: 'Bethesda-Chevy Chase High',
      grade: '10th Grade',
      phone: '(301) 555-0177',
      totalHours: 12.0,
      sessionCount: 3,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      authMethod: 'google',
    },
    {
      id: 'vol-lucas-davis',
      sweId: 'LD-8819',
      name: 'Lucas Davis',
      email: 'davis.family@gmail.com',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
      studentId: 'MCPS-992144',
      school: 'Westland Middle School',
      grade: '8th Grade',
      phone: '(301) 555-0177',
      totalHours: 6.5,
      sessionCount: 2,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      authMethod: 'kiosk',
    },
  ];

  const sessions: ServiceSession[] = [
    // 1. Currently Serving session - Student Maya Patel
    {
      id: 'sess-maya-active',
      volunteerId: 'vol-maya-patel',
      sweId: 'MP-7723',
      volunteerName: 'Maya Patel',
      volunteerEmail: 'maya.patel@student.mcpsmd.net',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
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
    // 2. Currently Serving Adult Volunteer - Robert Taylor (General volunteer, no SSL form)
    {
      id: 'sess-robert-active',
      volunteerId: 'vol-robert-taylor',
      sweId: 'RT-1044',
      volunteerName: 'Robert Taylor',
      volunteerEmail: 'robert.taylor@gmail.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse & Main Food Hub',
      activityType: 'Warehouse Logistics & Bulk Sorting',
      checkInTime: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
      checkInGps: {
        lat: 39.0535,
        lng: -77.1082,
        accuracy: 10,
        distanceMeters: 18,
        isOutsideGeofence: false,
      },
      checkInStatus: 'approved',
      checkInApprovedBy: 'Sarah Jenkins (Coordinator)',
      checkInApprovedAt: new Date(now.getTime() - 1.4 * 60 * 60 * 1000).toISOString(),
      checkOutStatus: 'not_requested',
      totalHours: 1.5,
      notes: 'Weekly pantry logistics volunteer (Adult)',
      createdAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
    },
    // 2b. Past Completed Session for Adult Volunteer - Robert Taylor (40.5 hours)
    {
      id: 'sess-robert-completed-past',
      volunteerId: 'vol-robert-taylor',
      sweId: 'RT-1044',
      volunteerName: 'Robert Taylor',
      volunteerEmail: 'robert.taylor@gmail.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse & Main Food Hub',
      activityType: 'Emergency Food Box Drive-Thru',
      checkInTime: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      checkInGps: {
        lat: 39.0534,
        lng: -77.1083,
        accuracy: 12,
        distanceMeters: 22,
        isOutsideGeofence: false,
      },
      checkInStatus: 'approved',
      checkInApprovedBy: 'Sarah Jenkins (Coordinator)',
      checkInApprovedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      checkOutTime: new Date(now.getTime() - (8 * 24 - 4.5) * 60 * 60 * 1000).toISOString(),
      checkOutGps: {
        lat: 39.0533,
        lng: -77.1082,
        accuracy: 14,
        distanceMeters: 25,
        isOutsideGeofence: false,
      },
      checkOutStatus: 'approved',
      checkOutApprovedBy: 'Sarah Jenkins (Coordinator)',
      checkOutApprovedAt: new Date(now.getTime() - (8 * 24 - 4.5) * 60 * 60 * 1000).toISOString(),
      totalHours: 40.5,
      notes: 'Coordinated volunteer packing line and pallet jacks.',
      createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // 3. Pending Check-in Request (Student just arrived and requested check-in 10 min ago)
    {
      id: 'sess-marcus-pending-checkin',
      volunteerId: 'vol-marcus-chen',
      sweId: 'MC-4821',
      volunteerName: 'Marcus Chen',
      volunteerEmail: 'marcus.chen@student.mcpsmd.net',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
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
    // 4. Pending Checkout Request (Volunteer Jordan Washington finished shift, requested checkout, but GPS is flagged >300m away!)
    {
      id: 'sess-jordan-pending-checkout',
      volunteerId: 'vol-jordan-washington',
      sweId: 'JW-3109',
      volunteerName: 'Jordan Washington',
      volunteerEmail: 'jordan.w@gmail.com',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
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
    customActivities: ACTIVITY_TYPES,
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

  private nodeInMemoryDb?: DatabaseSchema;

  public getDatabase(): DatabaseSchema {
    if (typeof window === 'undefined') {
      if (!this.nodeInMemoryDb) {
        this.nodeInMemoryDb = getInitialSeedData();
      }
      return this.nodeInMemoryDb;
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
      if (!parsed.facilities || parsed.facilities.length === 0) {
        parsed.facilities = SWE_FACILITIES;
      }
      if (!parsed.customActivities) {
        parsed.customActivities = ACTIVITY_TYPES;
      }

      // Backfill volunteerType, needsSSL, and formRequirement on existing localStorage data
      parsed.volunteers.forEach((v: Volunteer) => {
        if (!v.volunteerType) {
          const isAdult = Boolean(
            v.grade?.toLowerCase().includes('adult') || v.needsSSL === false
          );
          v.volunteerType = isAdult ? 'adult' : 'student_ssl';
          v.needsSSL = !isAdult;
          v.formRequirement = isAdult ? 'none' : 'ssl_mcps';
        }
      });

      // Ensure adult volunteer seed exists for demonstration if missing
      if (!parsed.volunteers.some((v: Volunteer) => v.volunteerType === 'adult')) {
        parsed.volunteers.push({
          id: 'vol-robert-taylor',
          sweId: 'RT-1044',
          name: 'Robert Taylor',
          email: 'robert.taylor@gmail.com',
          volunteerType: 'adult',
          needsSSL: false,
          formRequirement: 'none',
          phone: '(301) 555-0812',
          totalHours: 42.0,
          sessionCount: 11,
          createdAt: new Date().toISOString(),
          authMethod: 'google',
        });
      }

      parsed.sessions.forEach((s: ServiceSession) => {
        if (!s.volunteerType) {
          const matchedVol = parsed.volunteers.find(
            (v: Volunteer) => v.id === s.volunteerId
          );
          s.volunteerType = matchedVol?.volunteerType || 'student_ssl';
          s.needsSSL =
            matchedVol?.needsSSL !== undefined ? matchedVol.needsSSL : true;
          s.formRequirement = matchedVol?.formRequirement || 'ssl_mcps';
        }
      });

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
    } else {
      this.nodeInMemoryDb = db;
      this.broadcastChange();
    }
  }

  public resetToDefault(): void {
    const fresh = getInitialSeedData();
    if (typeof window === 'undefined') {
      this.nodeInMemoryDb = fresh;
    }
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

  public saveSection2Template(template: FormSection2Template, updatedBy = 'Admin'): void {
    this.updateSection2Template(template, updatedBy);
  }

  // --- Volunteers Operations ---
  public getVolunteers(): Volunteer[] {
    return this.getDatabase().volunteers;
  }

  public findVolunteerBySweId(sweId: string): Volunteer | undefined {
    const id = sweId.trim().toUpperCase();
    return this.getVolunteers().find((v) => v.sweId.toUpperCase() === id);
  }

  /**
   * Returns ALL students registered under a given email (supporting siblings/family accounts)
   */
  public findVolunteersByEmail(email: string): Volunteer[] {
    const clean = email.trim().toLowerCase();
    if (!clean) return [];
    return this.getVolunteers().filter((v) => v.email.toLowerCase() === clean);
  }

  /**
   * Backwards compatible: returns first volunteer matching email
   */
  public findVolunteerByEmail(email: string): Volunteer | undefined {
    const list = this.findVolunteersByEmail(email);
    return list.length > 0 ? list[0] : undefined;
  }

  public findOrCreateVolunteer(params: {
    name: string;
    email: string;
    volunteerType?: VolunteerType;
    needsSSL?: boolean;
    formRequirement?: FormRequirement;
    sweId?: string;
    studentId?: string;
    school?: string;
    grade?: string;
    phone?: string;
    authMethod?: 'kiosk' | 'google' | 'swe_account';
  }): Volunteer {
    const db = this.getDatabase();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name.trim().toLowerCase();
    const cleanSweId = params.sweId?.trim().toUpperCase();

    // Determine volunteer category & form requirement
    const resolvedType: VolunteerType =
      params.volunteerType ||
      (params.needsSSL === false || params.grade?.toLowerCase().includes('adult')
        ? 'adult'
        : 'student_ssl');
    const resolvedNeedsSSL =
      params.needsSSL !== undefined
        ? params.needsSSL
        : resolvedType === 'student_ssl';
    const resolvedFormReq: FormRequirement =
      params.formRequirement ||
      (resolvedType === 'student_ssl' ? 'ssl_mcps' : 'none');

    // 1. If explicit sweId is provided, look up by that exact ID first
    let existing: Volunteer | undefined;
    if (cleanSweId) {
      existing = db.volunteers.find((v) => v.sweId.toUpperCase() === cleanSweId);
    }

    // 2. Otherwise match if BOTH email AND student name match (case-insensitive)
    if (!existing) {
      existing = db.volunteers.find((v) => {
        const sameEmail = v.email.toLowerCase() === cleanEmail;
        const sameName = v.name.toLowerCase() === cleanName;
        return sameEmail && sameName;
      });
    }

    if (existing) {
      // Update with newly provided optional fields
      existing = {
        ...existing,
        name: params.name || existing.name,
        volunteerType: params.volunteerType || existing.volunteerType || resolvedType,
        needsSSL:
          params.needsSSL !== undefined
            ? params.needsSSL
            : (existing.needsSSL ?? resolvedNeedsSSL),
        formRequirement:
          params.formRequirement || existing.formRequirement || resolvedFormReq,
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

    // 3. New volunteer (gets unique SWE ID)
    const allSweIds = db.volunteers.map((v) => v.sweId);
    const newSweId = generateSWEId(params.name, allSweIds);
    const newVol: Volunteer = {
      id: `vol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sweId: newSweId,
      name: params.name.trim(),
      email: cleanEmail,
      volunteerType: resolvedType,
      needsSSL: resolvedNeedsSSL,
      formRequirement: resolvedFormReq,
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

  public updateVolunteer(
    volunteerId: string,
    updates: Partial<Volunteer>,
    adminName = 'Supervisor'
  ): Volunteer | undefined {
    const db = this.getDatabase();
    const idx = db.volunteers.findIndex((v) => v.id === volunteerId);
    if (idx === -1) return undefined;

    const current = db.volunteers[idx];
    const updated: Volunteer = {
      ...current,
      ...updates,
    };

    // If volunteerType changed, sync needsSSL and formRequirement if not explicitly passed
    if (updates.volunteerType && updates.needsSSL === undefined) {
      updated.needsSSL = updates.volunteerType === 'student_ssl';
    }
    if (updates.volunteerType && updates.formRequirement === undefined) {
      updated.formRequirement =
        updates.volunteerType === 'student_ssl' ? 'ssl_mcps' : 'none';
    }

    db.volunteers[idx] = updated;

    // Also update any sessions for this volunteer
    db.sessions.forEach((s) => {
      if (s.volunteerId === volunteerId) {
        if (updated.volunteerType) s.volunteerType = updated.volunteerType;
        if (updated.needsSSL !== undefined) s.needsSSL = updated.needsSSL;
        if (updated.formRequirement) s.formRequirement = updated.formRequirement;
      }
    });

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'volunteer_updated',
      actor: adminName,
      details: `Updated volunteer category & form requirement for ${updated.name} (${updated.sweId}) to ${updated.volunteerType} (needsSSL: ${updated.needsSSL}).`,
      flaggedGps: false,
    });

    this.saveDatabase(db);
    return updated;
  }

  /**
   * Returns active check-in sessions for any student sharing an email
   */
  public getActiveSessionsByEmail(email: string): ServiceSession[] {
    const clean = email.trim().toLowerCase();
    return this.getSessions().filter((s) => {
      const matchEmail = s.volunteerEmail.toLowerCase() === clean;
      const isActive =
        s.checkInStatus === 'approved' && s.checkOutStatus !== 'approved';
      return matchEmail && isActive;
    });
  }

  // --- Sessions Operations ---
  public getSessions(): ServiceSession[] {
    return this.getDatabase().sessions;
  }

  public getActiveSessionForVolunteer(volunteerIdOrSweId: string): ServiceSession | undefined {
    const clean = volunteerIdOrSweId.trim().toUpperCase();
    return this.getSessions().find(
      (s) =>
        (s.volunteerId === volunteerIdOrSweId || s.sweId.toUpperCase() === clean) &&
        (s.checkInStatus === 'pending' ||
          (s.checkInStatus === 'approved' && s.checkOutStatus !== 'approved'))
    );
  }

  public getActiveSessionByVolunteer(volunteer: {
    id?: string;
    sweId?: string;
    email?: string;
    name?: string;
  }): ServiceSession | undefined {
    const sessions = this.getSessions();
    const cleanSwe = volunteer.sweId?.trim().toUpperCase();
    const cleanEmail = volunteer.email?.trim().toLowerCase();
    const cleanName = volunteer.name?.trim().toLowerCase();

    return sessions.find((s) => {
      const isServingOrPending =
        s.checkInStatus === 'pending' ||
        (s.checkInStatus === 'approved' && s.checkOutStatus !== 'approved');

      if (!isServingOrPending) return false;

      if (volunteer.id && s.volunteerId === volunteer.id) return true;
      if (cleanSwe && s.sweId.toUpperCase() === cleanSwe) return true;
      if (
        cleanEmail &&
        cleanName &&
        s.volunteerEmail.toLowerCase() === cleanEmail &&
        s.volunteerName.toLowerCase() === cleanName
      ) {
        return true;
      }

      return false;
    });
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
    // PREVENT MULTIPLE CHECK-INS: Check if this volunteer is already serving or has a pending check-in
    const existingActive = this.getActiveSessionByVolunteer(params.volunteer);
    if (existingActive) {
      return existingActive;
    }

    const db = this.getDatabase();
    const facility =
      db.facilities.find((f) => f.id === params.facilityId) || SWE_FACILITIES[0];

    const volType =
      params.volunteer.volunteerType ||
      (params.volunteer.needsSSL === false ? 'adult' : 'student_ssl');
    const volNeedsSSL =
      params.volunteer.needsSSL !== undefined
        ? params.volunteer.needsSSL
        : volType === 'student_ssl';
    const volFormReq =
      params.volunteer.formRequirement ||
      (volType === 'student_ssl' ? 'ssl_mcps' : 'none');

    const isAdultWithoutForm =
      params.volunteer.volunteerType === 'adult' ||
      volType === 'adult' ||
      params.volunteer.needsSSL === false ||
      volNeedsSSL === false ||
      volFormReq === 'none';

    const session: ServiceSession = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      volunteerId: params.volunteer.id,
      sweId: params.volunteer.sweId,
      volunteerName: params.volunteer.name,
      volunteerEmail: params.volunteer.email,
      volunteerType: volType,
      needsSSL: volNeedsSSL,
      formRequirement: volFormReq,
      school: params.volunteer.school,
      grade: params.volunteer.grade,
      studentId: params.volunteer.studentId,
      facilityId: facility.id,
      facilityName: facility.name,
      activityType: params.activityType,
      checkInTime: new Date().toISOString(),
      checkInGps: params.gps,
      checkInStatus: isAdultWithoutForm ? 'approved' : 'pending',
      checkInApprovedBy: isAdultWithoutForm
        ? 'Auto-Activated (General Volunteer)'
        : undefined,
      checkInApprovedAt: isAdultWithoutForm
        ? new Date().toISOString()
        : undefined,
      checkOutStatus: 'not_requested',
      totalHours: 0,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    db.sessions.unshift(session);

    // Audit log
    const isFlagged = Boolean(params.gps?.isOutsideGeofence);
    const details = isAdultWithoutForm
      ? `⚡ AUTO-CHECKIN ACTIVATED: General volunteer ${params.volunteer.name} (${params.volunteer.sweId}) started serving at ${facility.name} (no formal verification forms requested). GPS: ${params.gps?.distanceMeters ?? 'N/A'}m.`
      : isFlagged
      ? `⚠️ CHECK-IN GPS FLAGGED: ${params.volunteer.name} (${params.volunteer.sweId}) requested check-in at ${facility.name} from ${params.gps?.distanceMeters}m away (>300m threshold). In-person supervisor approval required.`
      : `Check-in requested: ${params.volunteer.name} (${params.volunteer.sweId}) at ${facility.name} (GPS: ${params.gps?.distanceMeters ?? 'N/A'}m). In-person supervisor approval required.`;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isAdultWithoutForm ? 'checkin_approved' : 'checkin_request',
      actor: isAdultWithoutForm
        ? 'System Auto-Approval'
        : `${params.volunteer.name} (${params.volunteer.sweId})`,
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
    const calculatedHours = Math.max(
      0.1,
      Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 100) / 100
    );

    const isAdultWithoutForm =
      session.needsSSL === false ||
      session.formRequirement === 'none' ||
      session.volunteerType === 'adult';

    // Register the sign-off click time as FINAL instead of approval time
    session.checkOutTime = checkOutTime;
    session.checkOutGps = params.gps;
    session.totalHours = calculatedHours;
    if (params.notes) {
      session.notes = session.notes ? `${session.notes} | ${params.notes}` : params.notes;
    }

    const isFlagged = Boolean(params.gps?.isOutsideGeofence);

    if (isAdultWithoutForm) {
      // Adult volunteers who don't need a form are auto-approved upon sign-off! No admin approval needed.
      session.checkOutStatus = 'approved';
      session.checkOutApprovedBy = 'Auto-Approved (General Volunteer)';
      session.checkOutApprovedAt = checkOutTime;

      const volunteer = db.volunteers.find((v) => v.id === session.volunteerId);
      if (volunteer) {
        volunteer.totalHours =
          Math.round((volunteer.totalHours + calculatedHours) * 100) / 100;
        volunteer.sessionCount += 1;
      }

      db.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'checkout_approved',
        actor: `${session.volunteerName} (${session.sweId})`,
        details: `⚡ AUTO-CHECKOUT ACTIVATED: General volunteer ${session.volunteerName} (${session.sweId}) signed off at ${session.facilityName} (${calculatedHours} hrs credited immediately, no forms required).`,
        flaggedGps: isFlagged,
        sessionId: session.id,
      });
    } else {
      // Student volunteer requesting SSL form: pending in-person supervisor verification
      // Click time is locked as final hours, so the timer does NOT keep counting!
      session.checkOutStatus = 'pending';

      const details = isFlagged
        ? `⚠️ CHECK-OUT GPS FLAGGED: ${session.volunteerName} requested checkout from ${params.gps?.distanceMeters}m outside ${session.facilityName} (>300m threshold). Click time registered (${calculatedHours} hrs).`
        : `Check-out requested: ${session.volunteerName} (${session.sweId}) at ${session.facilityName} (${calculatedHours} hrs registered at click). Pending supervisor sign-off.`;

      db.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'checkout_request',
        actor: `${session.volunteerName} (${session.sweId})`,
        details,
        flaggedGps: isFlagged,
        sessionId: session.id,
      });
    }

    this.saveDatabase(db);
    return session;
  }

  public approveCheckOut(
    sessionId: string,
    adminName: string,
    customHours?: number
  ): ServiceSession | undefined {
    const db = this.getDatabase();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return undefined;

    session.checkOutStatus = 'approved';
    session.checkOutApprovedBy = adminName;
    session.checkOutApprovedAt = new Date().toISOString();

    // Use the frozen click time and pre-registered hours from when volunteer clicked sign-off
    // Do NOT keep counting up to the admin approval time!
    const startMs = new Date(session.checkInTime).getTime();
    const endMs = session.checkOutTime ? new Date(session.checkOutTime).getTime() : Date.now();
    if (!session.checkOutTime) {
      session.checkOutTime = new Date(endMs).toISOString();
    }

    const calculatedHours =
      session.totalHours && session.totalHours > 0
        ? session.totalHours
        : Math.max(0.1, Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 100) / 100);

    const finalHours =
      customHours !== undefined && customHours > 0
        ? Math.round(customHours * 100) / 100
        : calculatedHours;

    if (customHours !== undefined && customHours > 0 && customHours !== calculatedHours) {
      session.adminAdjustment = {
        originalCheckIn: session.checkInTime,
        originalCheckOut: session.checkOutTime,
        adjustedHours: finalHours,
        reason: `Hour adjustment upon checkout approval (${calculatedHours}h → ${finalHours}h)`,
        adjustedBy: adminName,
        adjustedAt: new Date().toISOString(),
      };
    }

    session.totalHours = finalHours;

    // Update volunteer total hours
    const volunteer = db.volunteers.find((v) => v.id === session.volunteerId);
    if (volunteer) {
      volunteer.totalHours = Math.round((volunteer.totalHours + finalHours) * 100) / 100;
      volunteer.sessionCount += 1;
    }

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'checkout_approved',
      actor: adminName,
      details: `Check-out approved for ${session.volunteerName} (${session.sweId}). Verified ${finalHours} hours credited to student profile based on sign-off click time.`,
      flaggedGps: Boolean(session.checkOutGps?.isOutsideGeofence),
      sessionId: session.id,
    });

    this.saveDatabase(db);
    return session;
  }

  /**
   * Approves check-out AND automatically issues an official MCPS SSL Form 560-51
   * for volunteers requiring Student SSL Forms, dispatching a simulated download link
   * to their registered email and saving it directly to their personal account.
   */
  public approveCheckOutAndIssueSSLForm(params: {
    sessionId: string;
    adminName: string;
    supervisorTitle?: string;
    supervisorEmail?: string;
    supervisorPhone?: string;
    activityDescription?: string;
    academicPreparationText?: string;
    serviceType?: 'DIRECT' | 'INDIRECT' | 'ADVOCACY';
    customHours?: number;
  }): {
    session: ServiceSession | undefined;
    sslForm: SSLForm | null;
    shareUrl: string | null;
    studentEmail: string | null;
  } {
    // 1. Approve check-out first (updates session status, volunteer totalHours with adjusted/custom hours, and locks sign-off click time)
    const approvedSession = this.approveCheckOut(params.sessionId, params.adminName, params.customHours);
    if (!approvedSession) {
      return { session: undefined, sslForm: null, shareUrl: null, studentEmail: null };
    }

    const db = this.getDatabase();
    const volunteer = db.volunteers.find((v) => v.id === approvedSession.volunteerId);
    const needsSSL =
      approvedSession.needsSSL !== false &&
      approvedSession.volunteerType !== 'adult' &&
      approvedSession.formRequirement !== 'none';

    // If volunteer does not require SSL forms (e.g. community volunteers), return approved session
    if (!needsSSL || !volunteer) {
      return {
        session: approvedSession,
        sslForm: null,
        shareUrl: null,
        studentEmail: volunteer?.email || null,
      };
    }

    // 2. Automatically generate the MCPS Form 560-51
    const activeTemplate = this.getSection2Template();
    const finalHours =
      params.customHours !== undefined && params.customHours > 0
        ? Math.round(params.customHours * 100) / 100
        : approvedSession.totalHours;

    const form = this.createSSLForm({
      volunteerId: volunteer.id,
      sessionIds: [approvedSession.id],
      supervisorName: params.adminName || 'Sarah Jenkins',
      supervisorTitle: params.supervisorTitle || 'Director of Volunteer Operations',
      supervisorEmail: params.supervisorEmail || 'sjenkins@sowhatelse.org',
      supervisorPhone: params.supervisorPhone || '(240) 668-4500',
      activityDescription:
        params.activityDescription ||
        activeTemplate.activityDescriptionText ||
        approvedSession.activityType ||
        'Assisted with food pantry warehouse operations, community distribution, and packing.',
      academicPreparationText:
        params.academicPreparationText !== undefined
          ? params.academicPreparationText
          : activeTemplate.academicPreparationText,
      serviceType: params.serviceType || activeTemplate.serviceType || 'DIRECT',
      customHours: finalHours,
    });

    // 3. Mark form as emailed and dispatch link to student's registered email
    this.updateSSLStatus(form.id, 'emailed');

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sowhatelse.org';
    const shareUrl = `${origin}?ssl=${form.shareToken}`;

    const updatedDb = this.getDatabase();
    updatedDb.auditLogs.unshift({
      id: `log-${Date.now()}-ssl-sent`,
      timestamp: new Date().toISOString(),
      action: 'ssl_emailed',
      actor: params.adminName,
      details: `✉️ MCPS Form 560-51 (${form.totalVerifiedHours} hrs) generated on checkout approval. Verification link sent to ${volunteer.email} & saved to personal student portal.`,
      flaggedGps: false,
      sessionId: approvedSession.id,
    });
    this.saveDatabase(updatedDb);

    return {
      session: approvedSession,
      sslForm: form,
      shareUrl,
      studentEmail: volunteer.email,
    };
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
    serviceType?: 'DIRECT' | 'INDIRECT' | 'ADVOCACY';
  }): SSLForm {
    const db = this.getDatabase();
    const volunteer = db.volunteers.find((v) => v.id === params.volunteerId);
    if (!volunteer) throw new Error('Volunteer not found');

    const sessions = db.sessions.filter((s) => params.sessionIds.includes(s.id));
    const previousSessionsTotal = Math.round(sessions.reduce((acc, s) => acc + s.totalHours, 0) * 100) / 100;
    const finalHours =
      params.customHours !== undefined ? Math.round(params.customHours * 100) / 100 : previousSessionsTotal;

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
      serviceType: params.serviceType || 'DIRECT',
      status: 'issued',
      shareToken,
      createdAt: new Date().toISOString(),
      supervisorSignature: `${params.supervisorName}, ${params.supervisorTitle}`,
    };

    // Mark sessions with sslFormId and certifiedHours, and register adjusted totalHours if adjusted
    const count = sessions.length || 1;
    const perSession = Math.round((finalHours / count) * 100) / 100;
    let distributed = 0;

    sessions.forEach((s, idx) => {
      const isLast = idx === sessions.length - 1;
      const sHours = isLast
        ? Math.round((finalHours - distributed) * 100) / 100
        : perSession;
      distributed += sHours;

      s.sslFormId = formId;
      s.certifiedHours = sHours;

      // Register adjusted hours on session if different from previous totalHours
      if (sHours !== s.totalHours) {
        const oldHours = s.totalHours;
        s.totalHours = sHours;
        s.adminAdjustment = {
          originalCheckIn: s.checkInTime,
          originalCheckOut: s.checkOutTime,
          adjustedHours: sHours,
          reason: `SSL Form Hour Rounding / Adjustment (${oldHours}h → ${sHours}h)`,
          adjustedBy: params.supervisorName,
          adjustedAt: new Date().toISOString(),
        };
      }
    });

    // Update volunteer totalHours for the difference between finalHours and previousSessionsTotal
    // (If approveCheckOut already credited finalHours, previousSessionsTotal === finalHours, diff is 0)
    // (If session was previously approved with raw hours, diff adjusts volunteer.totalHours)
    const hoursDiff = Math.round((finalHours - previousSessionsTotal) * 100) / 100;
    if (hoursDiff !== 0) {
      volunteer.totalHours = Math.round((volunteer.totalHours + hoursDiff) * 100) / 100;
    }

    db.sslForms.unshift(form);

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'ssl_generated',
      actor: params.supervisorName,
      details: `Generated official SSL verification form (${form.totalVerifiedHours} hrs) for ${volunteer.name} (${volunteer.sweId}). Registered verified hours.`,
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
    const diff = Math.round((form.totalVerifiedHours - oldHours) * 100) / 100;

    // Update volunteer total hours
    const volunteer = db.volunteers.find((v) => v.id === form.volunteerId);
    if (volunteer && diff !== 0) {
      volunteer.totalHours = Math.round((volunteer.totalHours + diff) * 100) / 100;
    }

    // Update linked sessions
    const sessions = db.sessions.filter((s) => form.sessionIds.includes(s.id));
    const count = sessions.length || 1;
    const perSession = Math.round((form.totalVerifiedHours / count) * 100) / 100;
    let distributed = 0;
    sessions.forEach((s, idx) => {
      const isLast = idx === sessions.length - 1;
      const sHours = isLast
        ? Math.round((form.totalVerifiedHours - distributed) * 100) / 100
        : perSession;
      distributed += sHours;

      s.totalHours = sHours;
      s.certifiedHours = sHours;
      s.adminAdjustment = {
        originalCheckIn: s.checkInTime,
        originalCheckOut: s.checkOutTime,
        adjustedHours: sHours,
        reason: `Re-issued SSL Form ${form.id} hour adjustment (${oldHours}h → ${form.totalVerifiedHours}h)`,
        adjustedBy: adminName,
        adjustedAt: new Date().toISOString(),
      };
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

  // --- Community Volunteers (No Forms) Specialized Operations ---
  public getCommunityServingSessions(): ServiceSession[] {
    return this.getSessions().filter((s) => {
      const isCommunity =
        s.needsSSL === false ||
        s.formRequirement === 'none' ||
        s.volunteerType === 'adult';
      const isServing =
        s.checkInStatus === 'approved' && s.checkOutStatus !== 'approved';
      return isCommunity && isServing;
    });
  }

  public getCommunityCompletedSessions(): ServiceSession[] {
    return this.getSessions().filter((s) => {
      const isCommunity =
        s.needsSSL === false ||
        s.formRequirement === 'none' ||
        s.volunteerType === 'adult';
      return isCommunity && s.checkOutStatus === 'approved';
    });
  }

  public getCommunityServiceStats(): {
    currentlyServingCount: number;
    totalHoursBeyondSSL: number;
    totalCommunityVolunteers: number;
    completedShiftsCount: number;
    gpsOnsiteCount: number;
    gpsFlaggedCount: number;
  } {
    const db = this.getDatabase();
    const communityVolunteers = db.volunteers.filter(
      (v) =>
        v.needsSSL === false ||
        v.formRequirement === 'none' ||
        v.volunteerType === 'adult'
    );
    const serving = this.getCommunityServingSessions();
    const completed = this.getCommunityCompletedSessions();

    const completedHours = completed.reduce(
      (acc, s) => acc + (s.totalHours || 0),
      0
    );

    // Also add elapsed hours for currently serving
    const now = Date.now();
    const activeElapsed = serving.reduce((acc, s) => {
      const start = new Date(s.checkInTime).getTime();
      const elapsed = Math.max(0, (now - start) / (1000 * 60 * 60));
      return acc + elapsed;
    }, 0);

    const totalHoursBeyondSSL =
      Math.round((completedHours + activeElapsed) * 10) / 10;

    const allCommunitySessions = [...serving, ...completed];
    const gpsOnsiteCount = allCommunitySessions.filter(
      (s) =>
        s.checkInGps &&
        !s.checkInGps.isOutsideGeofence &&
        !s.checkInGps.deniedOrUnavailable
    ).length;
    const gpsFlaggedCount = allCommunitySessions.filter(
      (s) => s.checkInGps?.isOutsideGeofence
    ).length;

    return {
      currentlyServingCount: serving.length,
      totalHoursBeyondSSL,
      totalCommunityVolunteers: communityVolunteers.length,
      completedShiftsCount: completed.length,
      gpsOnsiteCount,
      gpsFlaggedCount,
    };
  }

  public completeCommunityShift(
    sessionId: string,
    adminName: string,
    notes?: string
  ): ServiceSession | undefined {
    const db = this.getDatabase();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) return undefined;

    const checkOutTime = new Date().toISOString();
    const startMs = new Date(session.checkInTime).getTime();
    const endMs = new Date(checkOutTime).getTime();
    const hours = Math.max(
      0.25,
      Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 100) / 100
    );

    session.checkOutTime = checkOutTime;
    session.checkOutStatus = 'approved';
    session.checkOutApprovedBy = adminName;
    session.checkOutApprovedAt = checkOutTime;
    session.totalHours = hours;
    if (notes) {
      session.notes = session.notes ? `${session.notes} | ${notes}` : notes;
    }

    // Credit hours to volunteer profile
    const volunteer = db.volunteers.find((v) => v.id === session.volunteerId);
    if (volunteer) {
      volunteer.totalHours =
        Math.round((volunteer.totalHours + hours) * 100) / 100;
      volunteer.sessionCount += 1;
    }

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'checkout_approved',
      actor: adminName,
      details: `Community shift signed off for ${session.volunteerName} (${session.sweId}): ${hours} verified hours credited (no formal forms needed).`,
      flaggedGps: Boolean(session.checkInGps?.isOutsideGeofence),
      sessionId: session.id,
    });

    this.saveDatabase(db);
    return session;
  }

  /**
   * Batch signs off all active community volunteers who did not check out,
   * applying a uniform closing time (or facility official closing time).
   */
  public closeDayForAllCommunityVolunteers(params: {
    facilityId?: string; // 'all' or specific facility
    closingTime?: string; // e.g. "17:00" or ISO string
    customCloseTime?: string;
    adminName: string;
    notes?: string;
  }): { signedOffCount: number; totalHoursCredited: number; sessions: ServiceSession[] } {
    const db = this.getDatabase();
    const activeSessions = db.sessions.filter((s) => {
      const isCommunity =
        s.needsSSL === false ||
        s.formRequirement === 'none' ||
        s.volunteerType === 'adult';
      const isServing =
        s.checkInStatus === 'approved' && s.checkOutStatus !== 'approved';
      const matchFacility =
        !params.facilityId ||
        params.facilityId === 'all' ||
        s.facilityId === params.facilityId;
      return isCommunity && isServing && matchFacility;
    });

    if (activeSessions.length === 0) {
      return { signedOffCount: 0, totalHoursCredited: 0, sessions: [] };
    }

    let totalHoursCredited = 0;
    const now = new Date();

    activeSessions.forEach((session) => {
      const facility = db.facilities.find((f) => f.id === session.facilityId);
      const targetCloseHourStr =
        params.closingTime ||
        params.customCloseTime ||
        facility?.closingTime ||
        '17:00';

      // Compute close time ISO on the day of check-in
      let closeTimeISO: string;
      if (targetCloseHourStr.includes('T')) {
        closeTimeISO = targetCloseHourStr;
      } else {
        const checkInDate = new Date(session.checkInTime);
        const [hours, minutes] = targetCloseHourStr
          .split(':')
          .map((n) => parseInt(n, 10));
        const closeDate = new Date(checkInDate);
        closeDate.setHours(
          isNaN(hours) ? 17 : hours,
          isNaN(minutes) ? 0 : minutes,
          0,
          0
        );

        if (closeDate.getTime() <= checkInDate.getTime()) {
          closeTimeISO = now.toISOString();
        } else {
          closeTimeISO = closeDate.toISOString();
        }
      }

      const startMs = new Date(session.checkInTime).getTime();
      const endMs = new Date(closeTimeISO).getTime();
      const hours = Math.max(
        0.25,
        Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 100) / 100
      );

      session.checkOutTime = closeTimeISO;
      session.checkOutStatus = 'approved';
      session.checkOutApprovedBy = `${params.adminName} (Facility Day Close)`;
      session.checkOutApprovedAt = now.toISOString();
      session.totalHours = hours;
      const closeNote = params.notes
        ? `Facility Day Close: ${params.notes}`
        : `Uniform close applied at ${targetCloseHourStr} for facility day end`;
      session.notes = session.notes ? `${session.notes} | ${closeNote}` : closeNote;

      totalHoursCredited += hours;

      const volunteer = db.volunteers.find((v) => v.id === session.volunteerId);
      if (volunteer) {
        volunteer.totalHours =
          Math.round((volunteer.totalHours + hours) * 100) / 100;
        volunteer.sessionCount += 1;
      }
    });

    totalHoursCredited = Math.round(totalHoursCredited * 100) / 100;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      action: 'day_close_batch',
      actor: params.adminName,
      details: `🌙 BATCH FACILITY CLOSE: Signed off ${activeSessions.length} active community volunteer(s) at uniform close time. Total ${totalHoursCredited} verified hours credited.`,
      flaggedGps: false,
    });

    this.saveDatabase(db);
    return {
      signedOffCount: activeSessions.length,
      totalHoursCredited,
      sessions: activeSessions,
    };
  }

  // --- Facilities & Housekeeping Operations ---
  public getFacilities(): FacilityLocation[] {
    const db = this.getDatabase();
    if (!db.facilities || db.facilities.length === 0) {
      db.facilities = [...SWE_FACILITIES];
      this.saveDatabase(db);
    }
    return [...db.facilities];
  }

  public addFacility(
    facility: Omit<FacilityLocation, 'id'>,
    adminName: string
  ): FacilityLocation[] {
    const db = this.getDatabase();
    if (!db.facilities) db.facilities = [...SWE_FACILITIES];

    const slug = facility.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newFacility: FacilityLocation = {
      ...facility,
      id: `${slug}-${Date.now().toString().slice(-4)}`,
      geofenceMeters: facility.geofenceMeters || 300,
      closingTime: facility.closingTime || '17:00',
      operatingHours: facility.operatingHours || 'Mon-Fri: 9:00 AM – 5:00 PM',
    };

    db.facilities.push(newFacility);

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'facility_added',
      actor: adminName,
      details: `Registered new facility location: "${newFacility.name}" at ${newFacility.address} (Closing: ${newFacility.closingTime}, Geofence: ${newFacility.geofenceMeters}m).`,
      flaggedGps: false,
    });

    this.saveDatabase(db);
    return [...db.facilities];
  }

  public updateFacility(
    facilityId: string,
    updates: Partial<FacilityLocation>,
    adminName: string
  ): FacilityLocation[] {
    const db = this.getDatabase();
    const idx = db.facilities.findIndex((f) => f.id === facilityId);
    if (idx === -1) return [...db.facilities];

    const updated = { ...db.facilities[idx], ...updates };
    db.facilities[idx] = updated;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'facility_updated',
      actor: adminName,
      details: `Updated facility details for "${updated.name}" (Closing: ${updated.closingTime}, Hours: ${updated.operatingHours}).`,
      flaggedGps: false,
    });

    this.saveDatabase(db);
    return [...db.facilities];
  }

  public deleteFacility(facilityId: string, adminName: string): FacilityLocation[] {
    const db = this.getDatabase();
    const facility = db.facilities.find((f) => f.id === facilityId);
    if (!facility) return [...db.facilities];

    db.facilities = db.facilities.filter((f) => f.id !== facilityId);

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'facility_deleted',
      actor: adminName,
      details: `Removed facility location: "${facility.name}".`,
      flaggedGps: false,
    });

    this.saveDatabase(db);
    return [...db.facilities];
  }

  // --- Activity Types Operations ---
  public getActivities(): string[] {
    const db = this.getDatabase();
    if (!db.customActivities || db.customActivities.length === 0) {
      db.customActivities = [...ACTIVITY_TYPES];
      this.saveDatabase(db);
    }
    return [...db.customActivities];
  }

  public addActivity(activityName: string, adminName: string): string[] {
    const db = this.getDatabase();
    if (!db.customActivities) db.customActivities = [...ACTIVITY_TYPES];

    const clean = activityName.trim();
    if (!clean || db.customActivities.includes(clean)) {
      return [...db.customActivities];
    }

    db.customActivities.push(clean);

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'activities_updated',
      actor: adminName,
      details: `Added new volunteer service activity option: "${clean}".`,
      flaggedGps: false,
    });

    this.saveDatabase(db);
    return [...db.customActivities];
  }

  public removeActivity(activityName: string, adminName: string): string[] {
    const db = this.getDatabase();
    if (!db.customActivities) db.customActivities = [...ACTIVITY_TYPES];

    db.customActivities = db.customActivities.filter((a) => a !== activityName);

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'activities_updated',
      actor: adminName,
      details: `Removed volunteer service activity option: "${activityName}".`,
      flaggedGps: false,
    });

    this.saveDatabase(db);
    return [...db.customActivities];
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
