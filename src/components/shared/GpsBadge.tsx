import { AlertTriangle, CheckCircle2, HelpCircle, MapPin } from 'lucide-react';
import { GPSInfo } from '../../types';
import { formatDistance } from '../../utils/geo';

interface GpsBadgeProps {
  gps?: GPSInfo;
  className?: string;
  showDetails?: boolean;
}

export function GpsBadge({ gps, className = '', showDetails = true }: GpsBadgeProps) {
  if (!gps) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        title="No GPS data recorded"
      >
        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        <span>No GPS</span>
      </span>
    );
  }

  if (gps.deniedOrUnavailable) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        title="GPS permission denied or unavailable"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span>GPS Denied / Unavailable</span>
      </span>
    );
  }

  if (gps.isOutsideGeofence) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 shadow-xs ${className}`}
        title={`Flagged: ${formatDistance(gps.distanceMeters)} from facility (>300m limit)`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
        <span>
          ⚠️ Flagged: {formatDistance(gps.distanceMeters)} away
          {showDetails && ' (>300m)'}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      title={`Verified On-Site: ${formatDistance(gps.distanceMeters)} from facility`}
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>
        <MapPin className="w-3 h-3 inline mr-0.5" />
        On-Site ({formatDistance(gps.distanceMeters)})
      </span>
    </span>
  );
}
