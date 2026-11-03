import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VOLUNTEER_TYPE_OPTIONS,
  getVolunteerTypeConfig,
  isVolunteerNeedingSSL,
  getFormRequirementTitle,
} from './volunteerType';

test('VOLUNTEER_TYPE_OPTIONS contains student_ssl and adult options', () => {
  const student = VOLUNTEER_TYPE_OPTIONS.find((o) => o.id === 'student_ssl');
  const adult = VOLUNTEER_TYPE_OPTIONS.find((o) => o.id === 'adult');
  const court = VOLUNTEER_TYPE_OPTIONS.find((o) => o.id === 'court_mandated');
  const corporate = VOLUNTEER_TYPE_OPTIONS.find((o) => o.id === 'corporate');

  assert.ok(student, 'student_ssl option should exist');
  assert.equal(student.needsSSL, true);
  assert.equal(student.defaultFormRequirement, 'ssl_mcps');

  assert.ok(adult, 'adult option should exist');
  assert.equal(adult.needsSSL, false);
  assert.equal(adult.defaultFormRequirement, 'none');

  assert.ok(court, 'court_mandated option should exist');
  assert.equal(court.needsSSL, false);

  assert.ok(corporate, 'corporate option should exist');
  assert.equal(corporate.needsSSL, false);
});

test('getVolunteerTypeConfig resolves student_ssl and adult correctly', () => {
  const studentCfg = getVolunteerTypeConfig('student_ssl');
  assert.equal(studentCfg.id, 'student_ssl');
  assert.equal(studentCfg.needsSSL, true);

  const adultCfg = getVolunteerTypeConfig('adult');
  assert.equal(adultCfg.id, 'adult');
  assert.equal(adultCfg.needsSSL, false);

  // When type is undefined but needsSSL is explicitly false
  const adultFromFlag = getVolunteerTypeConfig(undefined, false);
  assert.equal(adultFromFlag.id, 'adult');

  // When type and flag are undefined, defaults to student_ssl for legacy safety
  const defaultCfg = getVolunteerTypeConfig(undefined, undefined);
  assert.equal(defaultCfg.id, 'student_ssl');
});

test('isVolunteerNeedingSSL correctly distinguishes students from adult volunteers', () => {
  assert.equal(isVolunteerNeedingSSL({ volunteerType: 'student_ssl', needsSSL: true }), true);
  assert.equal(isVolunteerNeedingSSL({ volunteerType: 'adult', needsSSL: false }), false);
  assert.equal(isVolunteerNeedingSSL({ volunteerType: 'court_mandated', needsSSL: false }), false);

  // Legacy without explicit flags
  assert.equal(isVolunteerNeedingSSL({ school: 'Rockville High' }), true);
  assert.equal(isVolunteerNeedingSSL({ grade: 'College / Adult' }), false);
  assert.equal(isVolunteerNeedingSSL(null), false);
});

test('getFormRequirementTitle returns clear human-readable titles', () => {
  assert.equal(getFormRequirementTitle('ssl_mcps'), 'MCPS Form 560-51 SSL');
  assert.equal(getFormRequirementTitle('none'), 'General Service Record (No Form)');
  assert.equal(getFormRequirementTitle('court_ordered'), 'Court Mandated Service Letter');
  assert.equal(getFormRequirementTitle('corporate_verification'), 'Employer Volunteer Grant Form');
});
