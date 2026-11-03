/**
 * Hours calculation and formatting utilities for SSL (Student Service Learning) records.
 */

/**
 * Calculates hours elapsed between two ISO date strings.
 * Defaults to current time if endTime is not provided.
 * Returns float rounded to 2 decimal places.
 */
export function calculateElapsedHours(
  startTimeISO: string,
  endTimeISO?: string,
  nowMs?: number
): number {
  const start = new Date(startTimeISO).getTime();
  const end = endTimeISO ? new Date(endTimeISO).getTime() : (nowMs ?? Date.now());

  if (isNaN(start) || isNaN(end) || end <= start) {
    return 0;
  }

  const diffHours = (end - start) / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100;
}

export type HourRoundingMode = 'ceil_half' | 'round_half' | 'exact';

/**
 * Rounds hours based on policy:
 * - 'ceil_half': Round UP to half an hour (e.g. 2.1 -> 2.5, 2.6 -> 3.0, 0.1 -> 0.5)
 * - 'round_half': Round to nearest half an hour (e.g. 2.1 -> 2.0, 2.3 -> 2.5, 2.75 -> 3.0)
 * - 'exact': Keep exact decimal hours (2 decimals)
 */
export function roundHours(hours: number, mode: HourRoundingMode = 'ceil_half'): number {
  if (hours <= 0) return 0;
  if (mode === 'ceil_half') {
    return Math.ceil(hours * 2) / 2;
  }
  if (mode === 'round_half') {
    return Math.round(hours * 2) / 2;
  }
  return Math.round(hours * 100) / 100;
}

/**
 * Formats a decimal hour number (e.g. 2.5 -> "2h 30m" or "2.5 hrs").
 */
export function formatHoursVerbose(hours: number): string {
  if (hours <= 0) return '0 hrs';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) {
    return `${minutes} min${minutes === 1 ? '' : 's'}`;
  }
  if (minutes === 0) {
    return `${wholeHours} hr${wholeHours === 1 ? '' : 's'}`;
  }
  return `${wholeHours}h ${minutes}m`;
}

/**
 * Formats a timestamp into a friendly human readable date and time.
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Filters service sessions by time period presets.
 */
export function filterSessionsByPeriod<T extends { checkInTime: string; facilityId?: string }>(
  sessions: T[],
  period: 'today' | 'week' | 'month' | 'past90' | 'all' | 'custom',
  customStart?: string,
  customEnd?: string,
  facilityFilter?: string
): T[] {
  const now = new Date();

  return sessions.filter((s) => {
    if (facilityFilter && facilityFilter !== 'all' && s.facilityId !== facilityFilter) {
      return false;
    }

    const sessionDate = new Date(s.checkInTime);
    if (isNaN(sessionDate.getTime())) return false;

    if (period === 'all') return true;

    if (period === 'today') {
      return (
        sessionDate.getFullYear() === now.getFullYear() &&
        sessionDate.getMonth() === now.getMonth() &&
        sessionDate.getDate() === now.getDate()
      );
    }

    if (period === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return sessionDate >= oneWeekAgo && sessionDate <= now;
    }

    if (period === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return sessionDate >= oneMonthAgo && sessionDate <= now;
    }

    if (period === 'past90') {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return sessionDate >= ninetyDaysAgo && sessionDate <= now;
    }

    if (period === 'custom') {
      if (!customStart) return true;
      const start = new Date(customStart);
      const end = customEnd ? new Date(customEnd) : now;
      return sessionDate >= start && sessionDate <= end;
    }

    return true;
  });
}
