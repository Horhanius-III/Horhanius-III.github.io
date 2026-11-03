/**
 * Generates unique, memorable So What Else Student / Volunteer IDs.
 * Format: [Initials]-[4-Digit Random Number], e.g. "JD-4912" or "MC-8831"
 */
export function generateSWEId(fullName: string, existingIds: string[] = []): string {
  const clean = fullName.trim();
  const parts = clean.split(/\s+/).filter(Boolean);

  let prefix = 'SWE';
  if (parts.length >= 2) {
    prefix = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    prefix = parts[0].slice(0, 2).toUpperCase();
  }

  // Ensure prefix is alphanumeric
  prefix = prefix.replace(/[^A-Z]/g, 'X') || 'SW';

  let attempts = 0;
  let code = '';
  do {
    const num = Math.floor(1000 + Math.random() * 9000);
    code = `${prefix}-${num}`;
    attempts++;
  } while (existingIds.includes(code) && attempts < 100);

  return code;
}

/**
 * Validates a SWE unique ID format (e.g. "JD-4812" or "SWE-1234").
 */
export function isValidSWEId(id: string): boolean {
  if (!id) return false;
  return /^[A-Z0-9]{1,4}-\d{4}$/i.test(id.trim());
}

/**
 * Masks student name for public kiosk display (e.g., "Marcus Chen" -> "Marcus C.").
 */
export function maskStudentName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${first} ${lastInitial}.`;
}
