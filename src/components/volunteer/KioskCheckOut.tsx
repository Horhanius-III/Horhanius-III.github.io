import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  MessageSquare,
  Search,
  ShieldAlert,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { GPSInfo, ServiceSession } from '../../types';
import { calculateElapsedHours, formatHoursVerbose, formatTimeOnly } from '../../utils/hours';
import { maskStudentName } from '../../utils/idGenerator';
import { useGeolocation } from '../../utils/useGeolocation';
import { getVolunteerTypeConfig } from '../../utils/volunteerType';
import { GpsBadge } from '../shared/GpsBadge';

interface KioskCheckOutProps {
  onSuccessCheckOut?: (session: ServiceSession) => void;
  onGoToCheckIn?: () => void;
}

export function KioskCheckOut({ onSuccessCheckOut, onGoToCheckIn }: KioskCheckOutProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSession, setActiveSession] = useState<ServiceSession | null>(null);
  const [multipleActiveSessions, setMultipleActiveSessions] = useState<ServiceSession[]>([]);
  const [batchSubmittedSessions, setBatchSubmittedSessions] = useState<ServiceSession[] | null>(null);
  const [searchError, setSearchError] = useState('');
  const [notes, setNotes] = useState('');
  const [submittedSession, setSubmittedSession] = useState<ServiceSession | null>(null);

  const { gpsInfo, isLoading: isGpsLoading, requestRealGPS, simulateLocation } =
    useGeolocation();

  // Search by Unique SWE ID (e.g. "MP-7723") or Registered Email
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setMultipleActiveSessions([]);
    setActiveSession(null);
    const query = searchQuery.trim();
    if (!query) return;

    const db = storageService.getDatabase();
    // 1. Look for ALL active sessions matching sweId or volunteer email
    const matchingActive = db.sessions.filter((s) => {
      const matchSwe = s.sweId.toUpperCase() === query.toUpperCase();
      const matchEmail = s.volunteerEmail.toLowerCase() === query.toLowerCase();
      const isActive =
        s.checkInStatus === 'approved' && s.checkOutStatus !== 'approved';
      return (matchSwe || matchEmail) && isActive;
    });

    if (matchingActive.length === 1) {
      setActiveSession(matchingActive[0]);
      return;
    } else if (matchingActive.length > 1) {
      // Multiple students sharing this parent email are actively on-site!
      setMultipleActiveSessions(matchingActive);
      return;
    }

    // Check if session is still pending admin check-in approval
    const pendingCheckIn = db.sessions.filter((s) => {
      const matchSwe = s.sweId.toUpperCase() === query.toUpperCase();
      const matchEmail = s.volunteerEmail.toLowerCase() === query.toLowerCase();
      return (matchSwe || matchEmail) && s.checkInStatus === 'pending';
    });

    if (pendingCheckIn.length > 0) {
      const names = pendingCheckIn.map((p) => maskStudentName(p.volunteerName)).join(', ');
      setSearchError(
        `Check-in for ${names} is currently PENDING supervisor on-site approval. Please ask the supervisor to approve your check-in first!`
      );
      return;
    }

    // Check if volunteer has already checked out
    const alreadyCheckedOut = db.sessions.filter((s) => {
      const matchSwe = s.sweId.toUpperCase() === query.toUpperCase();
      const matchEmail = s.volunteerEmail.toLowerCase() === query.toLowerCase();
      return (matchSwe || matchEmail) && s.checkOutStatus === 'approved';
    });

    if (alreadyCheckedOut.length > 0) {
      setSearchError(
        `Volunteer(s) linked to "${query}" have already checked out for today. No active session found.`
      );
      return;
    }

    setSearchError(
      `No active check-in session found for "${query}". Please verify your SWE ID (e.g. MP-7723) or registered email.`
    );
  };

  const handleConfirmCheckout = async () => {
    if (!activeSession) return;

    const facility =
      storageService
        .getDatabase()
        .facilities.find((f) => f.id === activeSession.facilityId) || {
        lat: 39.0531,
        lng: -77.1082,
        geofenceMeters: 300,
      };

    let finalGps: GPSInfo | undefined = gpsInfo;
    if (!finalGps) {
      finalGps = await requestRealGPS(facility as any);
    }

    const updated = storageService.requestCheckOut({
      sessionId: activeSession.id,
      notes: notes.trim() || undefined,
      gps: finalGps,
    });

    if (updated) {
      setSubmittedSession(updated);
      onSuccessCheckOut?.(updated);
    }
  };

  // Check out all siblings in a single action
  const handleCheckOutAll = async () => {
    if (multipleActiveSessions.length === 0) return;

    const facility =
      storageService
        .getDatabase()
        .facilities.find((f) => f.id === multipleActiveSessions[0].facilityId) || {
        lat: 39.0531,
        lng: -77.1082,
        geofenceMeters: 300,
      };

    let finalGps: GPSInfo | undefined = gpsInfo;
    if (!finalGps) {
      finalGps = await requestRealGPS(facility as any);
    }

    const completed: ServiceSession[] = [];
    for (const sess of multipleActiveSessions) {
      const updated = storageService.requestCheckOut({
        sessionId: sess.id,
        notes: notes.trim() || 'Family departure together',
        gps: finalGps,
      });
      if (updated) {
        completed.push(updated);
        onSuccessCheckOut?.(updated);
      }
    }

    setBatchSubmittedSessions(completed);
    setMultipleActiveSessions([]);
  };

  const handleReset = () => {
    setSearchQuery('');
    setActiveSession(null);
    setMultipleActiveSessions([]);
    setBatchSubmittedSessions(null);
    setSearchError('');
    setNotes('');
    setSubmittedSession(null);
  };

  // SUCCESS SUBMITTED VIEW
  if (submittedSession) {
    const elapsed = calculateElapsedHours(
      submittedSession.checkInTime,
      submittedSession.checkOutTime
    );
    const volConfig = getVolunteerTypeConfig(
      submittedSession.volunteerType,
      submittedSession.needsSSL
    );

    const isAutoApproved = submittedSession.checkOutStatus === 'approved';

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="flex flex-col items-center">
          <img
            src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
            alt="So What Else"
            className="w-16 h-16 rounded-2xl object-contain bg-[#1c1c1c] shadow-md ring-2 ring-orange-500/20 mb-3"
          />
          <div className="flex items-center gap-2 mb-2">
            {isAutoApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Shift Complete & Hours Credited!</span>
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 uppercase tracking-wider">
                Pending Supervisor Approval
              </span>
            )}
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${volConfig.badgeClass}`}>
              {volConfig.badge}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Thank You for Serving!
          </h2>

          {isAutoApproved ? (
            <div className="mt-2 space-y-2">
              <p className="text-stone-700 text-sm sm:text-base">
                Your shift of{' '}
                <span className="font-extrabold text-emerald-700">
                  {formatHoursVerbose(elapsed)}
                </span>{' '}
                is verified and saved directly to your community record. No supervisor sign-off line is required!
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                ✓ Fast-track community checkout: Hours credited instantly without delay.
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-stone-600 text-sm sm:text-base">
                Your check-out request of{' '}
                <span className="font-bold text-orange-600">
                  {formatHoursVerbose(elapsed)}
                </span>{' '}
                has been submitted to the pantry supervisor for official SSL certificate sign-off.
              </p>
              <div className="p-3 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-700 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                <span>
                  <strong>Timer Locked:</strong> Click registered at {formatTimeOnly(submittedSession.checkOutTime || new Date().toISOString())}. Waiting for supervisor approval will not alter your credited hours.
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-stone-500 mt-1">
            {submittedSession.volunteerType === 'student_ssl' || submittedSession.needsSSL
              ? '🎓 Hours will be credited toward your MCPS SSL Form 560-51 certificate.'
              : '👤 Hours are saved to your So What Else community service profile.'}
          </p>
        </div>

        {/* Masked Privacy Summary Card */}
        <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Volunteer Service Record
            </span>
            <span className="text-xs font-mono font-bold text-stone-800 bg-white px-2.5 py-1 rounded-md border border-stone-200">
              {submittedSession.sweId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-stone-400">Volunteer</p>
              <p className="font-semibold text-stone-800">
                {maskStudentName(submittedSession.volunteerName)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Facility</p>
              <p className="font-semibold text-stone-800 truncate">
                {submittedSession.facilityName}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Logged Hours</p>
              <p className="font-extrabold text-orange-600 text-base">
                {formatHoursVerbose(elapsed)} ({elapsed} hrs)
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">GPS Exit Status</p>
              <div className="mt-0.5">
                <GpsBadge gps={submittedSession.checkOutGps} showDetails={false} />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-[#1c1c1c] hover:bg-stone-800 text-white font-bold text-base transition-all shadow-md active:scale-[0.99]"
        >
          Done / Next Volunteer
        </button>
      </div>
    );
  }

  // BATCH FAMILY SUCCESS VIEW
  if (batchSubmittedSessions && batchSubmittedSessions.length > 0) {
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="flex flex-col items-center">
          <img
            src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
            alt="So What Else"
            className="w-16 h-16 rounded-2xl object-contain bg-[#1c1c1c] shadow-md ring-2 ring-orange-500/20 mb-3"
          />
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 uppercase tracking-wider mb-2">
            Family Check-Out Submitted ({batchSubmittedSessions.length} Students)
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Thank You for Serving Together!
          </h2>
          <p className="text-stone-600 mt-2 text-sm sm:text-base">
            Check-out requests for all students under this family account have been submitted to the pantry supervisor for final sign-off.
          </p>
        </div>

        <div className="space-y-3">
          {batchSubmittedSessions.map((sess) => {
            const el = calculateElapsedHours(sess.checkInTime, sess.checkOutTime);
            return (
              <div
                key={sess.id}
                className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-stone-900 text-sm">
                    {maskStudentName(sess.volunteerName)}
                  </p>
                  <p className="text-xs text-stone-500 font-mono">
                    ID: {sess.sweId} • {sess.facilityName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-orange-600">
                    {formatHoursVerbose(el)}
                  </span>
                  <p className="text-[10px] text-amber-800 font-bold">Pending Approval</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-[#1c1c1c] hover:bg-stone-800 text-white font-bold text-base transition-all shadow-md active:scale-[0.99]"
        >
          Done / Next Volunteer
        </button>
      </div>
    );
  }

  // MULTIPLE ACTIVE STUDENTS FOUND UNDER THIS EMAIL (Family Selection Step)
  if (multipleActiveSessions.length > 0) {
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90 max-w-xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img
              src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
              alt="So What Else"
              className="w-16 h-16 rounded-2xl object-contain bg-[#1c1c1c] shadow-md ring-2 ring-orange-500/20"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
            <Users className="w-3.5 h-3.5 text-orange-600" />
            <span>Multiple Active Volunteers Found</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Which Volunteer is Checking Out?
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm">
            We found {multipleActiveSessions.length} volunteers currently on shift under this email.
          </p>
        </div>

        <div className="space-y-3">
          {multipleActiveSessions.map((sess) => {
            const elapsed = calculateElapsedHours(sess.checkInTime);
            const cfg = getVolunteerTypeConfig(sess.volunteerType, sess.needsSSL);
            return (
              <div
                key={sess.id}
                className="p-4 rounded-2xl border border-stone-200 bg-stone-50/80 hover:border-orange-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-stone-900 text-base">
                        {maskStudentName(sess.volunteerName)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-orange-100 text-orange-900">
                        {sess.sweId}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.badgeClass}`}>
                        {cfg.shortLabel}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      {sess.facilityName} • Signed in {formatTimeOnly(sess.checkInTime)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-orange-600">
                      {formatHoursVerbose(elapsed)}
                    </span>
                    <p className="text-[11px] text-stone-400">elapsed</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSession(sess);
                    setMultipleActiveSessions([]);
                  }}
                  className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Check Out {maskStudentName(sess.volunteerName)}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={handleCheckOutAll}
            className="w-full py-3.5 px-4 min-h-[48px] rounded-xl bg-[#1c1c1c] hover:bg-stone-800 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-orange-400" />
            <span>Check Out All {multipleActiveSessions.length} Volunteers Together</span>
          </button>

          <button
            type="button"
            onClick={() => setMultipleActiveSessions([])}
            className="w-full py-2.5 px-4 min-h-[44px] rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE SESSION CONFIRMATION CARD (Step 2)
  if (activeSession) {
    const elapsedNow = calculateElapsedHours(activeSession.checkInTime);
    const activeCfg = getVolunteerTypeConfig(activeSession.volunteerType, activeSession.needsSSL);
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90 max-w-xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Active Service Session Located</span>
            </span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeCfg.badgeClass}`}>
              {activeCfg.badge}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Confirm Your Departure
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm">
            Please verify your service time before submitting to supervisor.
          </p>
        </div>

        {/* Privacy-Preserving Volunteer Info Card */}
        <div className="bg-[#1c1c1c] text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 border border-stone-800">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">
                Volunteer ({activeCfg.shortLabel})
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {maskStudentName(activeSession.volunteerName)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">SWE ID</p>
              <p className="text-base font-mono font-bold text-orange-400">
                {activeSession.sweId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm pt-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <p className="text-[11px] text-stone-400">Signed In At</p>
                <p className="font-semibold text-stone-200">
                  {formatTimeOnly(activeSession.checkInTime)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-stone-400">Facility</p>
                <p className="font-semibold text-stone-200 truncate">
                  {activeSession.facilityName}
                </p>
              </div>
            </div>
          </div>

          {/* Large Elapsed Time Counter */}
          <div className="bg-white/10 rounded-xl p-4 text-center border border-white/10 backdrop-blur-xs">
            <p className="text-xs uppercase font-bold text-orange-400 tracking-wider">
              Elapsed Service Time
            </p>
            <p className="text-3xl sm:text-4xl font-black text-white mt-1">
              {formatHoursVerbose(elapsedNow)}
            </p>
            <p className="text-xs text-stone-300 mt-0.5">({elapsedNow} total hours)</p>
          </div>
        </div>

        {/* Optional Reflection / Notes */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
            <span>Service Reflection & Tasks Completed (Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Packed 65 grocery bags, sorted produce crates, helped load cars."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-stone-800"
          />
        </div>

        {/* GPS Departure Check */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">
              Exit Geofence Verification
            </span>
            <GpsBadge gps={gpsInfo} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isGpsLoading}
              onClick={() => {
                const fac = storageService
                  .getDatabase()
                  .facilities.find((f) => f.id === activeSession.facilityId);
                if (fac) requestRealGPS(fac);
              }}
              className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            >
              {isGpsLoading ? 'Checking...' : 'Verify Exit GPS'}
            </button>

            <div className="flex items-center gap-1.5 ml-auto text-xs">
              <span className="text-stone-400 text-[11px]">Simulate:</span>
              <button
                type="button"
                onClick={() => {
                  const fac = storageService
                    .getDatabase()
                    .facilities.find((f) => f.id === activeSession.facilityId);
                  if (fac) simulateLocation(fac, 'onsite');
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              >
                Onsite (&lt;50m)
              </button>
              <button
                type="button"
                onClick={() => {
                  const fac = storageService
                    .getDatabase()
                    .facilities.find((f) => f.id === activeSession.facilityId);
                  if (fac) simulateLocation(fac, 'offsite');
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200"
              >
                Offsite (&gt;300m)
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setActiveSession(null)}
            className="flex-1 min-h-[48px] py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmCheckout}
            className="flex-2 min-h-[48px] py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4" />
            <span>Submit Check-Out Request</span>
          </button>
        </div>
      </div>
    );
  }

  // STEP 1: Fast ID / Email Search View
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90 max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-1">
          <img
            src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
            alt="So What Else"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-[#1c1c1c] shadow-md ring-2 ring-orange-500/20"
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-1">
          <Heart className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
          <span>Privacy-Preserving Check-Out</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Volunteer Sign-Out
        </h2>
        <p className="text-stone-500 text-xs sm:text-sm">
          Enter your assigned Unique SWE ID (or email) to complete your shift.
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1">
            Unique SWE ID or Registered Email
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. MP-7723 or student@mcpsmd.net"
              className="w-full pl-11 pr-4 py-3.5 min-h-[48px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-900 font-mono text-base uppercase placeholder:font-sans placeholder:normal-case"
            />
            <KeyRound className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          </div>
          <p className="text-xs text-stone-400 mt-1.5">
            Tip: Your unique ID was generated upon check-in (e.g. <span className="font-mono font-bold text-stone-600">MP-7723</span>).
          </p>
        </div>

        {searchError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{searchError}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-base shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          <span>Find Active Session</span>
        </button>

        {/* Demo Quick Shortcuts for rapid testing */}
        <div className="pt-3 border-t border-stone-100">
          <p className="text-xs text-stone-400 font-medium mb-2 text-center">
            Demo Active Volunteers (Tap to test):
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setSearchQuery('MP-7723')}
              className="px-3 py-1.5 min-h-[36px] text-xs rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-900 font-mono font-bold border border-orange-200 transition-colors"
            >
              MP-7723 (Maya P.)
            </button>
            <button
              type="button"
              onClick={() => setSearchQuery('JW-3109')}
              className="px-3 py-1.5 min-h-[36px] text-xs rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-mono font-bold border border-amber-200 transition-colors"
            >
              JW-3109 (Jordan W.)
            </button>
            <button
              type="button"
              onClick={() => setSearchQuery('davis.family@gmail.com')}
              className="px-3 py-1.5 min-h-[36px] text-xs rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold border border-stone-300 transition-colors flex items-center gap-1"
            >
              <Users className="w-3 h-3 text-orange-600" />
              <span>davis.family@gmail.com (Family)</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-stone-500 pt-2">
          Haven't checked in yet?{' '}
          <button
            type="button"
            onClick={onGoToCheckIn}
            className="text-orange-600 font-bold underline underline-offset-2 hover:text-orange-700 p-1"
          >
            Switch to Check-In Form
          </button>
        </p>
      </form>
    </div>
  );
}
