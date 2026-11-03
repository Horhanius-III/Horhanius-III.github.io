import test from 'node:test';
import assert from 'node:assert/strict';
import { ServiceSession, Volunteer } from '../types';

// Pure logic for active session detection
function findActiveSessionForVolunteer(
  sessions: ServiceSession[],
  volunteer: { id?: string; sweId?: string; email?: string; name?: string }
): ServiceSession | undefined {
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

function tryRequestCheckIn(
  sessions: ServiceSession[],
  volunteer: Volunteer,
  facilityId: string,
  activityType: string
): { session: ServiceSession; isDuplicate: boolean; updatedSessions: ServiceSession[] } {
  const existingActive = findActiveSessionForVolunteer(sessions, volunteer);
  if (existingActive) {
    return { session: existingActive, isDuplicate: true, updatedSessions: sessions };
  }

  const newSession: ServiceSession = {
    id: `sess-${Date.now()}-${Math.random()}`,
    volunteerId: volunteer.id,
    sweId: volunteer.sweId,
    volunteerName: volunteer.name,
    volunteerEmail: volunteer.email,
    volunteerType: volunteer.volunteerType || 'student_ssl',
    facilityId,
    facilityName: 'Rockville Warehouse',
    activityType,
    checkInTime: new Date().toISOString(),
    checkInStatus: 'pending',
    checkOutStatus: 'not_requested',
    totalHours: 0,
    createdAt: new Date().toISOString(),
  };

  return {
    session: newSession,
    isDuplicate: false,
    updatedSessions: [newSession, ...sessions],
  };
}

test('detects active serving session for a volunteer by id, sweId, or email+name', () => {
  const sampleSessions: ServiceSession[] = [
    {
      id: 'sess-1',
      volunteerId: 'vol-101',
      sweId: 'MP-7723',
      volunteerName: 'Maya Patel',
      volunteerEmail: 'maya.patel@student.mcpsmd.net',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse',
      activityType: 'Packing',
      checkInTime: '2026-10-31T01:00:00Z',
      checkInStatus: 'approved',
      checkOutStatus: 'not_requested', // currently serving!
      totalHours: 1.5,
      createdAt: '2026-10-31T01:00:00Z',
    },
    {
      id: 'sess-2',
      volunteerId: 'vol-202',
      sweId: 'MC-4821',
      volunteerName: 'Marcus Chen',
      volunteerEmail: 'marcus.chen@student.mcpsmd.net',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse',
      activityType: 'Sorting',
      checkInTime: '2026-10-31T00:30:00Z',
      checkInStatus: 'pending', // pending check-in!
      checkOutStatus: 'not_requested',
      totalHours: 0.5,
      createdAt: '2026-10-31T00:30:00Z',
    },
    {
      id: 'sess-3',
      volunteerId: 'vol-303',
      sweId: 'EZ-9941',
      volunteerName: 'Emily Zhao',
      volunteerEmail: 'emily.zhao@student.mcpsmd.net',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse',
      activityType: 'Distribution',
      checkInTime: '2026-10-30T10:00:00Z',
      checkInStatus: 'approved',
      checkOutStatus: 'approved', // already checked out!
      totalHours: 3.0,
      createdAt: '2026-10-30T10:00:00Z',
    },
  ];

  // 1. Maya is currently serving -> match by id
  const activeMayaById = findActiveSessionForVolunteer(sampleSessions, { id: 'vol-101' });
  assert.ok(activeMayaById, 'Maya should be detected as actively serving');
  assert.equal(activeMayaById.id, 'sess-1');

  // 2. Maya match by SWE ID
  const activeMayaBySwe = findActiveSessionForVolunteer(sampleSessions, { sweId: 'mp-7723' });
  assert.ok(activeMayaBySwe, 'Maya should be detected by case-insensitive SWE ID');
  assert.equal(activeMayaBySwe.id, 'sess-1');

  // 3. Maya match by email + name
  const activeMayaByEmailName = findActiveSessionForVolunteer(sampleSessions, {
    email: 'MAYA.PATEL@STUDENT.MCPSMD.NET',
    name: 'Maya Patel',
  });
  assert.ok(activeMayaByEmailName, 'Maya should be detected by email and name');
  assert.equal(activeMayaByEmailName.id, 'sess-1');

  // 4. Marcus has a pending check-in -> should be detected
  const activeMarcus = findActiveSessionForVolunteer(sampleSessions, { id: 'vol-202' });
  assert.ok(activeMarcus, 'Marcus with pending check-in should be detected');
  assert.equal(activeMarcus.id, 'sess-2');

  // 5. Emily already checked out -> should NOT be detected as active
  const activeEmily = findActiveSessionForVolunteer(sampleSessions, { id: 'vol-303' });
  assert.equal(activeEmily, undefined, 'Checked out volunteer should not be active');
});

test('tryRequestCheckIn prevents duplicate check-in when volunteer is already serving', () => {
  const maya: Volunteer = {
    id: 'vol-101',
    sweId: 'MP-7723',
    name: 'Maya Patel',
    email: 'maya.patel@student.mcpsmd.net',
    totalHours: 28,
    sessionCount: 5,
    createdAt: '2026-10-01T00:00:00Z',
    authMethod: 'kiosk',
  };

  const initialSessions: ServiceSession[] = [
    {
      id: 'sess-maya-active',
      volunteerId: 'vol-101',
      sweId: 'MP-7723',
      volunteerName: 'Maya Patel',
      volunteerEmail: 'maya.patel@student.mcpsmd.net',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse',
      activityType: 'Pantry Packing',
      checkInTime: '2026-10-31T01:00:00Z',
      checkInStatus: 'approved',
      checkOutStatus: 'not_requested',
      totalHours: 1.0,
      createdAt: '2026-10-31T01:00:00Z',
    },
  ];

  // Try checking in Maya again while she is already serving
  const attempt = tryRequestCheckIn(initialSessions, maya, 'rockville-warehouse', 'Warehouse Logistics');

  assert.equal(attempt.isDuplicate, true, 'Check-in must be flagged as duplicate');
  assert.equal(attempt.session.id, 'sess-maya-active', 'Must return the existing active session');
  assert.equal(attempt.updatedSessions.length, 1, 'No new session should be added to the database');
});

test('tryRequestCheckIn creates new session when volunteer is not currently serving', () => {
  const emily: Volunteer = {
    id: 'vol-303',
    sweId: 'EZ-9941',
    name: 'Emily Zhao',
    email: 'emily.zhao@student.mcpsmd.net',
    totalHours: 19.5,
    sessionCount: 3,
    createdAt: '2026-10-01T00:00:00Z',
    authMethod: 'kiosk',
  };

  const sessions: ServiceSession[] = []; // No active sessions

  const attempt = tryRequestCheckIn(sessions, emily, 'rockville-warehouse', 'Produce Sorting');

  assert.equal(attempt.isDuplicate, false, 'Should allow check-in for idle volunteer');
  assert.equal(attempt.updatedSessions.length, 1, 'Should add 1 new session to the list');
  assert.equal(attempt.session.volunteerId, 'vol-303');
  assert.equal(attempt.session.checkInStatus, 'pending');
});
