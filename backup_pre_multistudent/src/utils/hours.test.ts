import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateElapsedHours, formatHoursVerbose, filterSessionsByPeriod, roundHours } from './hours.js';
import { generateSWEId, isValidSWEId, maskStudentName } from './idGenerator.js';

test('roundHours correctly rounds UP to half hour (ceil_half)', () => {
  assert.equal(roundHours(2.1, 'ceil_half'), 2.5);
  assert.equal(roundHours(2.0, 'ceil_half'), 2.0);
  assert.equal(roundHours(2.5, 'ceil_half'), 2.5);
  assert.equal(roundHours(2.51, 'ceil_half'), 3.0);
  assert.equal(roundHours(0.1, 'ceil_half'), 0.5);
});

test('roundHours correctly rounds to nearest half hour (round_half)', () => {
  assert.equal(roundHours(2.1, 'round_half'), 2.0);
  assert.equal(roundHours(2.25, 'round_half'), 2.5);
  assert.equal(roundHours(2.3, 'round_half'), 2.5);
  assert.equal(roundHours(2.74, 'round_half'), 2.5);
  assert.equal(roundHours(2.75, 'round_half'), 3.0);
});

test('roundHours handles exact mode and zero', () => {
  assert.equal(roundHours(2.34, 'exact'), 2.34);
  assert.equal(roundHours(0, 'ceil_half'), 0);
  assert.equal(roundHours(-1, 'round_half'), 0);
});

test('calculateElapsedHours computes correct decimal hours', () => {
  const start = '2026-10-26T09:00:00.000Z';
  const end = '2026-10-26T12:30:00.000Z';
  const hours = calculateElapsedHours(start, end);
  assert.equal(hours, 3.5);
});

test('calculateElapsedHours handles invalid or inverted time cleanly', () => {
  const start = '2026-10-26T12:00:00.000Z';
  const end = '2026-10-26T09:00:00.000Z';
  assert.equal(calculateElapsedHours(start, end), 0);
  assert.equal(calculateElapsedHours('invalid-date'), 0);
});

test('formatHoursVerbose outputs readable hour strings', () => {
  assert.equal(formatHoursVerbose(0), '0 hrs');
  assert.equal(formatHoursVerbose(0.5), '30 mins');
  assert.equal(formatHoursVerbose(1), '1 hr');
  assert.equal(formatHoursVerbose(2.5), '2h 30m');
});

test('generateSWEId generates initials and 4 digit code', () => {
  const code = generateSWEId('Marcus Chen');
  assert.ok(isValidSWEId(code));
  assert.ok(code.startsWith('MC-'));
});

test('maskStudentName conceals full last name on kiosk', () => {
  assert.equal(maskStudentName('Marcus Chen'), 'Marcus C.');
  assert.equal(maskStudentName('Sarah Jane Smith'), 'Sarah S.');
  assert.equal(maskStudentName('Alex'), 'Alex');
});

test('filterSessionsByPeriod filters today vs all sessions', () => {
  const now = new Date();
  const todayISO = now.toISOString();
  const pastISO = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();

  const sessions = [
    { checkInTime: todayISO, facilityId: 'fac-1' },
    { checkInTime: pastISO, facilityId: 'fac-1' },
  ];

  const todaySessions = filterSessionsByPeriod(sessions, 'today');
  assert.equal(todaySessions.length, 1);

  const allSessions = filterSessionsByPeriod(sessions, 'all');
  assert.equal(allSessions.length, 2);
});
