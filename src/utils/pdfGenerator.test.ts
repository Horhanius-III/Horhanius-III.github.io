import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCertificateHash, generateVerificationToken } from './pdfGenerator.js';

test('generateVerificationToken produces format SWE-XXXX-XXXX', () => {
  const token = generateVerificationToken();
  assert.match(token, /^SWE-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
});

test('generateCertificateHash produces consistent 32-character hex hash', () => {
  const hash1 = generateCertificateHash('MCPS-12345', '2026-10-26', 4.0, 'SWE-A1B2-C3D4');
  const hash2 = generateCertificateHash('MCPS-12345', '2026-10-26', 4.0, 'SWE-A1B2-C3D4');
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 32);
});
