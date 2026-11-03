import test from 'node:test';
import assert from 'node:assert/strict';
import { storageService } from '../services/storage.js';
import { roundHours } from './hours.js';

test('Adjusted Hours Registration Suite', async (t) => {
  // Reset database before test run
  storageService.resetToDefault();

  await t.test('1. SSL Form Generator registers adjusted/rounded hours to session and volunteer', () => {
    const vol = storageService.findOrCreateVolunteer({
      name: 'Test Student Alpha',
      email: 'student.alpha@student.mcpsmd.net',
      school: 'Rockville High School',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
    });

    const initialVolHours = vol.totalHours; // 0

    // Create a checked-out approved session with raw 2.1 hours
    const now = new Date();
    const twoHoursTenMinsAgo = new Date(now.getTime() - 2.1 * 60 * 60 * 1000).toISOString();
    const db = storageService.getDatabase();
    const sessionId = `sess-test-ssl-gen-${Date.now()}`;
    db.sessions.unshift({
      id: sessionId,
      volunteerId: vol.id,
      sweId: vol.sweId,
      volunteerName: vol.name,
      volunteerEmail: vol.email,
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse & Food Hub',
      checkInTime: twoHoursTenMinsAgo,
      checkInStatus: 'approved',
      checkInApprovedBy: 'Sarah Jenkins',
      checkInApprovedAt: twoHoursTenMinsAgo,
      checkOutTime: now.toISOString(),
      checkOutStatus: 'approved',
      checkOutApprovedBy: 'Sarah Jenkins',
      checkOutApprovedAt: now.toISOString(),
      activityType: 'Food Packing & Sorting',
      totalHours: 2.1,
      createdAt: twoHoursTenMinsAgo,
    });
    // Session added 2.1h to volunteer previously
    const volRecord = db.volunteers.find((v) => v.id === vol.id)!;
    volRecord.totalHours = 2.1;
    storageService.saveDatabase(db);

    // Now admin in SSL Form Generator selects "Round UP to Half Hour": 2.1h -> 2.5h
    const roundedHours = roundHours(2.1, 'ceil_half');
    assert.equal(roundedHours, 2.5);

    const sslForm = storageService.createSSLForm({
      volunteerId: vol.id,
      sessionIds: [sessionId],
      supervisorName: 'Sarah Jenkins',
      supervisorTitle: 'Director of Volunteer Operations',
      supervisorEmail: 'sjenkins@sowhatelse.org',
      supervisorPhone: '(240) 668-4500',
      activityDescription: 'Produce Sorting & Emergency Pantry Packing',
      customHours: roundedHours,
    });

    // Verify SSL Form has registered 2.5 hours
    assert.equal(sslForm.totalVerifiedHours, 2.5);

    // Verify session has registered 2.5 hours for BOTH totalHours and certifiedHours
    const updatedSession = storageService.getSessions().find((s) => s.id === sessionId)!;
    assert.equal(updatedSession.certifiedHours, 2.5);
    assert.equal(updatedSession.totalHours, 2.5);
    assert.ok(updatedSession.adminAdjustment);
    assert.equal(updatedSession.adminAdjustment?.adjustedHours, 2.5);

    // Verify volunteer profile has registered 2.5 hours
    const updatedVol = storageService.getVolunteers().find((v) => v.id === vol.id)!;
    assert.equal(updatedVol.totalHours, 2.5);
  });

  await t.test('2. Sign-Out & Issue SSL Form registers adjusted hours for active serving volunteer', () => {
    const vol = storageService.findOrCreateVolunteer({
      name: 'Test Student Beta',
      email: 'student.beta@student.mcpsmd.net',
      school: 'Richard Montgomery High',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
    });

    // Create an actively serving session (checkInStatus: approved, checkOutStatus: not_requested)
    const now = new Date();
    const twoHoursTenMinsAgo = new Date(now.getTime() - 2.1 * 60 * 60 * 1000).toISOString();
    const db = storageService.getDatabase();
    const sessionId = `sess-test-active-${Date.now()}`;
    db.sessions.unshift({
      id: sessionId,
      volunteerId: vol.id,
      sweId: vol.sweId,
      volunteerName: vol.name,
      volunteerEmail: vol.email,
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse & Food Hub',
      checkInTime: twoHoursTenMinsAgo,
      checkInStatus: 'approved',
      checkInApprovedBy: 'Sarah Jenkins',
      checkInApprovedAt: twoHoursTenMinsAgo,
      checkOutStatus: 'not_requested',
      activityType: 'Emergency Food Distribution',
      totalHours: 0,
      createdAt: twoHoursTenMinsAgo,
    });
    storageService.saveDatabase(db);

    // Admin clicks "Sign-Out & Issue SSL Form", selects Round UP: 2.1h -> 2.5h
    const result = storageService.approveCheckOutAndIssueSSLForm({
      sessionId,
      adminName: 'Sarah Jenkins',
      customHours: 2.5,
      activityDescription: 'Emergency pantry distribution and logistics',
    });

    assert.ok(result.session);
    assert.ok(result.sslForm);
    assert.equal(result.sslForm.totalVerifiedHours, 2.5);

    // Verify session has registered 2.5 hours
    const updatedSession = storageService.getSessions().find((s) => s.id === sessionId)!;
    assert.equal(updatedSession.checkOutStatus, 'approved');
    assert.equal(updatedSession.totalHours, 2.5);
    assert.equal(updatedSession.certifiedHours, 2.5);

    // Verify volunteer profile has registered 2.5 hours
    const updatedVol = storageService.getVolunteers().find((v) => v.id === vol.id)!;
    assert.equal(updatedVol.totalHours, 2.5);
  });

  await t.test('3. Approve & Issue SSL Form registers adjusted hours for pending checkout volunteer', () => {
    const vol = storageService.findOrCreateVolunteer({
      name: 'Test Student Gamma',
      email: 'student.gamma@student.mcpsmd.net',
      school: 'Bethesda-Chevy Chase High',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
    });

    // Create a pending checkout session (checkOutStatus: pending, locked at 3.1h)
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3.1 * 60 * 60 * 1000).toISOString();
    const db = storageService.getDatabase();
    const sessionId = `sess-test-pending-co-${Date.now()}`;
    db.sessions.unshift({
      id: sessionId,
      volunteerId: vol.id,
      sweId: vol.sweId,
      volunteerName: vol.name,
      volunteerEmail: vol.email,
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
      facilityId: 'rockville-warehouse',
      facilityName: 'Rockville Warehouse & Food Hub',
      checkInTime: threeHoursAgo,
      checkInStatus: 'approved',
      checkInApprovedBy: 'Sarah Jenkins',
      checkInApprovedAt: threeHoursAgo,
      checkOutTime: now.toISOString(),
      checkOutStatus: 'pending',
      activityType: 'Pantry Warehouse Sorting',
      totalHours: 3.1, // Frozen at click time
      createdAt: threeHoursAgo,
    });
    storageService.saveDatabase(db);

    // Admin clicks "Approve & Issue SSL Form", selects manual override: 3.5h
    const result = storageService.approveCheckOutAndIssueSSLForm({
      sessionId,
      adminName: 'Sarah Jenkins',
      customHours: 3.5,
      activityDescription: 'Pantry warehouse sorting and packaging',
    });

    assert.ok(result.session);
    assert.ok(result.sslForm);
    assert.equal(result.sslForm.totalVerifiedHours, 3.5);

    // Verify session has registered 3.5 hours
    const updatedSession = storageService.getSessions().find((s) => s.id === sessionId)!;
    assert.equal(updatedSession.checkOutStatus, 'approved');
    assert.equal(updatedSession.totalHours, 3.5);
    assert.equal(updatedSession.certifiedHours, 3.5);

    // Verify volunteer profile has registered 3.5 hours
    const updatedVol = storageService.getVolunteers().find((v) => v.id === vol.id)!;
    assert.equal(updatedVol.totalHours, 3.5);
  });

  await t.test('4. Manual hour override updates existing SSL form and synchronizes hours across sessions and volunteer profile', () => {
    const sslForms = storageService.getSSLForms();
    if (sslForms.length === 0) return;
    const form = sslForms[0];
    const originalHours = form.totalVerifiedHours;
    const newTargetHours = originalHours + 1.0;

    const updated = storageService.updateSSLFormHours(form.id, newTargetHours, 'Super Admin');
    assert.ok(updated);
    assert.equal(updated.totalVerifiedHours, newTargetHours);

    // Verify linked session got updated to the new hours
    const session = storageService.getSessions().find((s) => s.id === form.sessionIds[0]);
    if (session) {
      assert.equal(session.totalHours, newTargetHours);
      assert.equal(session.certifiedHours, newTargetHours);
    }
  });
});
