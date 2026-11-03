import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { storageService } from '../services/storage';

describe('Community Volunteers (No Forms) Workflow', () => {
  beforeEach(() => {
    storageService.resetToDefault();
  });

  it('auto-activates check-in for adult/general volunteers who do not need SSL forms', () => {
    const adultVolunteer = storageService.findOrCreateVolunteer({
      name: 'Eleanor Vance',
      email: 'eleanor.vance@example.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
      authMethod: 'kiosk',
    });

    const session = storageService.requestCheckIn({
      volunteer: adultVolunteer,
      facilityId: 'rockville-warehouse',
      activityType: 'Emergency Food Box Drive-Thru',
      gps: {
        lat: 39.0534,
        lng: -77.1083,
        accuracy: 10,
        distanceMeters: 20,
        isOutsideGeofence: false,
      },
    });

    // Should be automatically approved without waiting in front-desk approval line
    assert.strictEqual(session.checkInStatus, 'approved');
    assert.strictEqual(session.checkInApprovedBy, 'Auto-Activated (General Volunteer)');
    assert.ok(session.checkInApprovedAt);
  });

  it('keeps student SSL volunteers in pending state for in-person front desk verification', () => {
    const student = storageService.findOrCreateVolunteer({
      name: 'Elena Rostova',
      email: 'elena.rostova@student.mcpsmd.net',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
      school: 'Walter Johnson High School',
      grade: '10th Grade',
      authMethod: 'kiosk',
    });

    const session = storageService.requestCheckIn({
      volunteer: student,
      facilityId: 'rockville-warehouse',
      activityType: 'Food Pantry Packing & Distribution',
      gps: {
        lat: 39.0534,
        lng: -77.1083,
        accuracy: 12,
        distanceMeters: 25,
        isOutsideGeofence: false,
      },
    });

    // Student requiring SSL MUST be pending in-person verification
    assert.strictEqual(session.checkInStatus, 'pending');
    assert.strictEqual(session.checkInApprovedBy, undefined);
  });

  it('tracks community volunteer statistics and hours beyond SSL accurately', () => {
    const stats = storageService.getCommunityServiceStats();

    // Default seed has Robert Taylor serving and past completed hours
    assert.ok(stats.totalHoursBeyondSSL > 0, 'Total hours beyond SSL should be greater than 0');
    assert.ok(stats.totalCommunityVolunteers >= 1, 'Should have at least 1 registered community volunteer');
    assert.strictEqual(typeof stats.currentlyServingCount, 'number');
  });

  it('allows 1-click supervisor sign-off and crediting of community hours', () => {
    const adultVolunteer = storageService.findOrCreateVolunteer({
      name: 'Gregory House',
      email: 'greg.house@example.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
      authMethod: 'kiosk',
    });

    const session = storageService.requestCheckIn({
      volunteer: adultVolunteer,
      facilityId: 'silver-spring-hub',
      activityType: 'Warehouse Logistics & Bulk Sorting',
      gps: {
        lat: 39.0125,
        lng: -77.0395,
        accuracy: 8,
        distanceMeters: 15,
        isOutsideGeofence: false,
      },
    });

    assert.strictEqual(session.checkInStatus, 'approved');

    const completed = storageService.completeCommunityShift(
      session.id,
      'Supervisor Sarah',
      'Completed morning shift'
    );

    assert.ok(completed);
    assert.strictEqual(completed?.checkOutStatus, 'approved');
    assert.strictEqual(completed?.checkOutApprovedBy, 'Supervisor Sarah');
    assert.ok(completed?.totalHours! > 0);

    // Verify volunteer total hours updated
    const updatedVolunteer = storageService
      .getVolunteers()
      .find((v) => v.id === adultVolunteer.id);
    assert.ok(updatedVolunteer);
    assert.strictEqual(updatedVolunteer?.totalHours, completed?.totalHours);
  });

  it('freezes checkout time and hours at click time for students so waiting for approval does not inflate hours', () => {
    const student = storageService.findOrCreateVolunteer({
      name: 'Lucas Student',
      email: 'lucas.student@example.com',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
      authMethod: 'kiosk',
    });

    // Start a session 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const session = storageService.requestCheckIn({
      volunteer: student,
      facilityId: 'rockville-warehouse',
      activityType: 'Food Pantry Packing & Distribution',
    });
    storageService.approveCheckIn(session.id, 'Supervisor Dan');

    // Simulate session started 2 hours ago in db
    const db = storageService.getDatabase();
    const dbSess = db.sessions.find((x) => x.id === session.id);
    if (dbSess) {
      dbSess.checkInTime = twoHoursAgo;
      storageService.saveDatabase(db);
    }

    // Student requests check-out
    const checkOutRequested = storageService.requestCheckOut({
      sessionId: session.id,
      notes: 'Done for the day',
    });

    assert.ok(checkOutRequested);
    assert.strictEqual(checkOutRequested?.checkOutStatus, 'pending');
    assert.ok(checkOutRequested?.checkOutTime);
    assert.strictEqual(checkOutRequested?.totalHours, 2.0);

    const frozenClickTime = checkOutRequested?.checkOutTime;

    // Supervisor approves later (e.g. simulate approval)
    const approved = storageService.approveCheckOut(session.id, 'Supervisor Dan');
    assert.ok(approved);
    assert.strictEqual(approved?.checkOutStatus, 'approved');
    assert.strictEqual(approved?.checkOutTime, frozenClickTime, 'Should preserve exact click time');
    assert.strictEqual(approved?.totalHours, 2.0, 'Hours must remain exactly 2.0 and not increase');
  });

  it('auto-approves check-out for adult volunteers without forms upon checkout request', () => {
    const adult = storageService.findOrCreateVolunteer({
      name: 'Arthur Dent',
      email: 'arthur.dent@example.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
      authMethod: 'kiosk',
    });

    const session = storageService.requestCheckIn({
      volunteer: adult,
      facilityId: 'rockville-warehouse',
      activityType: 'Emergency Food Box Drive-Thru',
    });
    assert.strictEqual(session.checkInStatus, 'approved');

    // Adult clicks check out
    const checkedOut = storageService.requestCheckOut({
      sessionId: session.id,
      notes: 'Morning shift complete',
    });

    assert.ok(checkedOut);
    // Adult volunteer is auto-approved immediately without waiting in supervisor line
    assert.strictEqual(checkedOut?.checkOutStatus, 'approved');
    assert.strictEqual(checkedOut?.checkOutApprovedBy, 'Auto-Approved (General Volunteer)');
    assert.ok(checkedOut?.totalHours! >= 0);
  });

  it('guarantees community volunteers need NO admin approval for BOTH sign-in and check-out, tracking hours immediately', () => {
    const adult = storageService.findOrCreateVolunteer({
      name: 'Clara Oswald',
      email: 'clara.oswald@example.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
      authMethod: 'kiosk',
    });
    const initialHours = adult.totalHours;

    // 1. SIGN-IN: No admin approval required, immediately active
    const checkInSession = storageService.requestCheckIn({
      volunteer: adult,
      facilityId: 'rockville-warehouse',
      activityType: 'Food Pantry Distribution',
    });
    assert.strictEqual(checkInSession.checkInStatus, 'approved', 'Check-in must be auto-approved');
    assert.strictEqual(checkInSession.checkOutStatus, 'not_requested');

    // Verify volunteer is registered in currently serving list
    const servingList = storageService.getCommunityServingSessions();
    assert.ok(servingList.some((s) => s.id === checkInSession.id), 'Must appear in currently serving list');

    // 2. CHECK-OUT: No admin approval required, immediately completed and hours credited
    const checkOutSession = storageService.requestCheckOut({
      sessionId: checkInSession.id,
      notes: 'Finished warehouse afternoon tasks',
    });
    assert.ok(checkOutSession);
    assert.strictEqual(checkOutSession?.checkOutStatus, 'approved', 'Check-out must be auto-approved');
    assert.strictEqual(checkOutSession?.checkOutApprovedBy, 'Auto-Approved (General Volunteer)');

    // Verify session moved to completed community sessions
    const completedList = storageService.getCommunityCompletedSessions();
    assert.ok(completedList.some((s) => s.id === checkInSession.id), 'Must appear in completed community list');

    // Verify volunteer total hours updated immediately
    const updatedVolunteer = storageService.getVolunteers().find((v) => v.id === adult.id);
    assert.ok(updatedVolunteer);
    assert.ok(updatedVolunteer!.totalHours >= initialHours);
  });

  it('batch signs off all remaining active community volunteers when facility is closed for the day', () => {
    const adult1 = storageService.findOrCreateVolunteer({
      name: 'Volunteer Alpha',
      email: 'alpha@example.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
    });

    const adult2 = storageService.findOrCreateVolunteer({
      name: 'Volunteer Beta',
      email: 'beta@example.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
    });

    storageService.requestCheckIn({
      volunteer: adult1,
      facilityId: 'rockville-warehouse',
      activityType: 'Food Sorting',
    });

    storageService.requestCheckIn({
      volunteer: adult2,
      facilityId: 'rockville-warehouse',
      activityType: 'Pantry Distribution',
    });

    // Both should be currently serving
    const activeBefore = storageService
      .getCommunityServingSessions()
      .filter((s) => s.facilityId === 'rockville-warehouse');
    assert.ok(activeBefore.length >= 2);

    // Admin closes Rockville Warehouse for the day with uniform 17:00 close time
    const result = storageService.closeDayForAllCommunityVolunteers({
      facilityId: 'rockville-warehouse',
      customCloseTime: '17:00',
      adminName: 'Admin Sarah',
      notes: 'End of daily pantry shift',
    });

    assert.ok(result.signedOffCount >= 2);
    assert.ok(result.sessions.length >= 2);
    for (const c of result.sessions) {
      assert.strictEqual(c.checkOutStatus, 'approved');
      assert.strictEqual(c.checkOutApprovedBy, 'Admin Sarah (Facility Day Close)');
      assert.ok(c.totalHours! > 0);
    }

    // Active community count for this facility should now be 0
    const activeAfter = storageService
      .getCommunityServingSessions()
      .filter((s) => s.facilityId === 'rockville-warehouse');
    assert.strictEqual(activeAfter.length, 0);
  });

  it('supports housekeeping operations: facilities and service activities management', () => {
    // 1. Add new facility
    const initialFacs = storageService.getFacilities();
    const newFac = storageService.addFacility(
      {
        name: 'Germantown Community Pantry',
        address: '12800 Middlebrook Rd, Germantown, MD 20874',
        lat: 39.1832,
        lng: -77.2685,
        geofenceMeters: 300,
        closingTime: '18:00',
        operatingHours: 'Mon - Fri: 10:00 AM - 6:00 PM',
      },
      'Super Admin'
    );
    assert.strictEqual(newFac.length, initialFacs.length + 1);

    // 2. Update facility closing hours
    const addedId = newFac.find((f) => f.name.includes('Germantown'))!.id;
    const updatedFacs = storageService.updateFacility(
      addedId,
      { closingTime: '19:00', operatingHours: 'Mon - Fri: 10:00 AM - 7:00 PM' },
      'Super Admin'
    );
    const updated = updatedFacs.find((f) => f.id === addedId);
    assert.strictEqual(updated?.closingTime, '19:00');

    // 3. Add & remove custom activity
    const initialActs = storageService.getActivities();
    const withNewAct = storageService.addActivity('Community Garden Harvest', 'Super Admin');
    assert.strictEqual(withNewAct.length, initialActs.length + 1);
    assert.ok(withNewAct.includes('Community Garden Harvest'));

    const afterRemove = storageService.removeActivity('Community Garden Harvest', 'Super Admin');
    assert.strictEqual(afterRemove.length, initialActs.length);
    assert.ok(!afterRemove.includes('Community Garden Harvest'));
  });

  it('streamlines student checkout by automatically approving and issuing official MCPS SSL Form 560-51', () => {
    const student = storageService.findOrCreateVolunteer({
      name: 'Jessica Ramos',
      email: 'jessica.ramos@student.mcpsmd.net',
      volunteerType: 'student_ssl',
      needsSSL: true,
      formRequirement: 'ssl_mcps',
      studentId: 'MCPS-554109',
      school: 'Wheaton High School',
      grade: '10th Grade',
      authMethod: 'kiosk',
    });

    // Check in student
    const session = storageService.requestCheckIn({
      volunteer: student,
      facilityId: 'rockville-warehouse',
      activityType: 'Food Pantry Packing & Distribution',
    });

    storageService.approveCheckIn(session.id, 'Coordinator Dan');

    // Volunteer clicks sign-off
    storageService.requestCheckOut({
      sessionId: session.id,
      notes: 'Completed warehouse packing shift',
    });

    // Admin approves checkout AND issues SSL Form with one click
    const result = storageService.approveCheckOutAndIssueSSLForm({
      sessionId: session.id,
      adminName: 'Sarah Jenkins',
      supervisorTitle: 'Director of Volunteer Operations',
      supervisorEmail: 'sjenkins@sowhatelse.org',
      supervisorPhone: '(240) 668-4500',
    });

    // 1. Session is approved
    assert.ok(result.session);
    assert.strictEqual(result.session?.checkOutStatus, 'approved');
    assert.strictEqual(result.session?.checkOutApprovedBy, 'Sarah Jenkins');

    // 2. SSL form is generated with correct details
    assert.ok(result.sslForm);
    assert.strictEqual(result.sslForm?.studentName, 'Jessica Ramos');
    assert.strictEqual(result.sslForm?.studentEmail, 'jessica.ramos@student.mcpsmd.net');
    assert.strictEqual(result.sslForm?.supervisorName, 'Sarah Jenkins');
    assert.strictEqual(result.sslForm?.status, 'emailed');
    assert.strictEqual(result.sslForm?.sessionIds[0], session.id);
    assert.ok(result.sslForm?.totalVerifiedHours! > 0);

    // 3. Share URL and student email generated for simulated delivery
    assert.ok(result.shareUrl);
    assert.ok(result.shareUrl?.includes(result.sslForm!.shareToken));
    assert.strictEqual(result.studentEmail, 'jessica.ramos@student.mcpsmd.net');

    // 4. Session links to the issued form
    const updatedSession = storageService.getSessions().find((s) => s.id === session.id);
    assert.strictEqual(updatedSession?.sslFormId, result.sslForm?.id);
    assert.strictEqual(updatedSession?.certifiedHours, result.sslForm?.totalVerifiedHours);

    // 5. Accessible immediately in student personal portal
    const studentForms = storageService
      .getSSLForms()
      .filter((f) => f.volunteerId === student.id || f.sweId === student.sweId);
    assert.strictEqual(studentForms.length, 1);
    assert.strictEqual(studentForms[0].id, result.sslForm?.id);

    // 6. Audit log confirms email dispatch
    const emailAudit = storageService
      .getAuditLogs()
      .find((l) => l.action === 'ssl_emailed' && l.sessionId === session.id);
    assert.ok(emailAudit);
    assert.ok(emailAudit?.details.includes('jessica.ramos@student.mcpsmd.net'));
  });

  it('handles adult volunteer checkout in approveCheckOutAndIssueSSLForm without generating unnecessary SSL form', () => {
    const adult = storageService.findOrCreateVolunteer({
      name: 'Michael Miller',
      email: 'm.miller@corporate.com',
      volunteerType: 'adult',
      needsSSL: false,
      formRequirement: 'none',
      authMethod: 'kiosk',
    });

    const session = storageService.requestCheckIn({
      volunteer: adult,
      facilityId: 'silver-spring-hub',
      activityType: 'Warehouse Logistics & Bulk Sorting',
    });

    const result = storageService.approveCheckOutAndIssueSSLForm({
      sessionId: session.id,
      adminName: 'Supervisor Mark',
    });

    assert.ok(result.session);
    assert.strictEqual(result.session?.checkOutStatus, 'approved');
    assert.strictEqual(result.sslForm, null);
    assert.strictEqual(result.shareUrl, null);
  });
});

