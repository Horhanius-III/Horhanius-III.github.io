import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHaversineDistance, evaluateGeofence, formatDistance } from './geo.js';

test('calculateHaversineDistance calculates realistic distance between two coordinates', () => {
  // Rockville Food Pantry approximate coords (39.0840, -77.1528)
  // Target point 100 meters away (approx 39.0849, -77.1528)
  const d = calculateHaversineDistance(39.0840, -77.1528, 39.0849, -77.1528);
  assert.ok(d > 90 && d < 110, `Expected distance around 100m, got ${d}m`);
});

test('evaluateGeofence flags locations outside 300 meters', () => {
  // Same location -> 0m -> inside geofence
  const inside = evaluateGeofence(39.0840, -77.1528, 39.0840, -77.1528, 300);
  assert.equal(inside.isOutsideGeofence, false);
  assert.equal(inside.distanceMeters, 0);

  // Far location (~5 km away) -> outside geofence
  const outside = evaluateGeofence(39.1200, -77.1528, 39.0840, -77.1528, 300);
  assert.equal(outside.isOutsideGeofence, true);
  assert.ok(outside.distanceMeters > 3000, `Expected > 3000m, got ${outside.distanceMeters}`);
});

test('formatDistance displays meters and kilometers correctly', () => {
  assert.equal(formatDistance(140), '140m');
  assert.equal(formatDistance(2400), '2.4 km');
});
