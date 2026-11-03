import { useState, useEffect } from 'react';
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  LogOut,
  Mail,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react';
import { SWE_FACILITIES, ACTIVITY_TYPES } from '../../data/facilities';
import { storageService } from '../../services/storage';
import { GPSInfo, ServiceSession, Volunteer } from '../../types';
import { calculateElapsedHours, formatDateTime, formatHoursVerbose } from '../../utils/hours';
import { useGeolocation } from '../../utils/useGeolocation';
import { GpsBadge } from '../shared/GpsBadge';

interface PersonalPortalProps {
  onViewSSLForm?: (formId: string) => void;
}

export function PersonalPortal({ onViewSSLForm }: PersonalPortalProps) {
  const [currentUser, setCurrentUser] = useState<Volunteer | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Personal Check-in form state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState(SWE_FACILITIES[0].id);
  const [selectedActivity, setSelectedActivity] = useState(ACTIVITY_TYPES[0]);

  // Live tick for elapsed counter
  const [, setTicker] = useState(0);

  const { gpsInfo, isLoading: isGpsLoading, requestRealGPS, simulateLocation } =
    useGeolocation();

  useEffect(() => {
    // If not logged in, default to demo volunteer Marcus Chen
    const volunteers = storageService.getVolunteers();
    if (!currentUser && volunteers.length > 0) {
      setCurrentUser(volunteers[0]); // Marcus Chen
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 30000); // 30 sec re-render for live elapsed timer
    return () => clearInterval(timer);
  }, []);

  const handleGoogleLogin = (emailPreset?: string) => {
    const targetEmail = emailPreset || loginEmail || 'marcus.chen@student.mcpsmd.net';
    const volunteer = storageService.findVolunteerByEmail(targetEmail);
    if (volunteer) {
      setCurrentUser(volunteer);
      setLoginError('');
    } else {
      // Auto-create new personal profile
      const newVol = storageService.findOrCreateVolunteer({
        name: 'Alex Johnson',
        email: targetEmail,
        school: 'Bethesda-Chevy Chase High',
        grade: '11th Grade',
        authMethod: 'google',
      });
      setCurrentUser(newVol);
      setLoginError('');
    }
  };

  const handleSweIdLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    // Check if entered SWE ID or email
    let volunteer = storageService.findVolunteerBySweId(loginEmail.trim());
    if (!volunteer) {
      volunteer = storageService.findVolunteerByEmail(loginEmail.trim());
    }

    if (volunteer) {
      setCurrentUser(volunteer);
      setLoginError('');
    } else {
      setLoginError(`No account found matching "${loginEmail}". Please check ID or sign in with Google.`);
    }
  };

  // Check active session for this volunteer
  const activeSession = currentUser
    ? storageService.getActiveSessionForVolunteer(currentUser.id)
    : undefined;

  // Past completed sessions
  const pastSessions = currentUser
    ? storageService
        .getSessions()
        .filter((s) => s.volunteerId === currentUser.id && s.checkOutStatus === 'approved')
    : [];

  // My SSL Forms
  const mySSLForms = currentUser
    ? storageService
        .getSSLForms()
        .filter((f) => f.volunteerId === currentUser.id || f.studentEmail === currentUser.email)
    : [];

  const handlePersonalCheckIn = async () => {
    if (!currentUser) return;
    const fac =
      SWE_FACILITIES.find((f) => f.id === selectedFacilityId) || SWE_FACILITIES[0];

    let finalGps: GPSInfo | undefined = gpsInfo;
    if (!finalGps) {
      finalGps = await requestRealGPS(fac);
    }

    storageService.requestCheckIn({
      volunteer: currentUser,
      facilityId: fac.id,
      activityType: selectedActivity,
      gps: finalGps,
    });

    setShowCheckInModal(false);
  };

  const handlePersonalCheckOut = async () => {
    if (!activeSession) return;
    const fac =
      storageService
        .getDatabase()
        .facilities.find((f) => f.id === activeSession.facilityId) || SWE_FACILITIES[0];

    let finalGps: GPSInfo | undefined = gpsInfo;
    if (!finalGps) {
      finalGps = await requestRealGPS(fac as any);
    }

    storageService.requestCheckOut({
      sessionId: activeSession.id,
      gps: finalGps,
      notes: 'Checked out via personal mobile portal.',
    });
  };

  // NOT LOGGED IN VIEW
  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img
              src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
              alt="So What Else"
              className="w-16 h-16 rounded-2xl object-contain bg-[#1c1c1c] shadow-md ring-2 ring-orange-500/20"
            />
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Personal Volunteer Login
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm">
            Access your verified service hours, official SSL forms, and fast 1-tap check-in.
          </p>
        </div>

        {/* 3rd Party Google Login Button */}
        <button
          type="button"
          onClick={() => handleGoogleLogin('marcus.chen@student.mcpsmd.net')}
          className="w-full min-h-[48px] py-3.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 active:bg-stone-100 font-semibold text-stone-800 flex items-center justify-center gap-3 transition-colors shadow-xs"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs uppercase font-bold text-stone-400">or sign in with ID</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <form onSubmit={handleSweIdLogin} className="space-y-3">
          <input
            type="text"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="Unique SWE ID (e.g. MC-4821) or Email"
            className="w-full px-3.5 py-3 min-h-[48px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
          />

          {loginError && <p className="text-xs text-rose-600 font-medium">{loginError}</p>}

          <button
            type="submit"
            className="w-full min-h-[48px] py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm shadow-md shadow-orange-600/20 transition-colors"
          >
            Sign In to Profile
          </button>
        </form>
      </div>
    );
  }

  // LOGGED IN PERSONAL VIEW
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Student Profile Card */}
      <div className="bg-[#1c1c1c] text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-stone-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-600/20 text-orange-400 font-black text-lg sm:text-xl border border-orange-500/30 flex items-center justify-center shrink-0">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black text-white truncate">
                  {currentUser.name}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-xs font-mono font-bold">
                  {currentUser.sweId}
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5 flex items-center gap-2 truncate">
                <span>{currentUser.school || 'High School Volunteer'}</span>
                {currentUser.grade && <span>• {currentUser.grade}</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentUser(null)}
            className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Sign out of personal account"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Total Hours Badge Card */}
        <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3.5 sm:p-4 border border-white/10">
            <p className="text-[11px] sm:text-xs text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Verified SSL Hours</span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">
              {currentUser.totalHours} <span className="text-xs sm:text-sm font-normal text-stone-300">hrs</span>
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 sm:p-4 border border-white/10">
            <p className="text-[11px] sm:text-xs text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Service Shifts</span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">
              {currentUser.sessionCount}{' '}
              <span className="text-xs sm:text-sm font-normal text-stone-300">days</span>
            </p>
          </div>
        </div>
      </div>

      {/* Switch Demo Volunteer Profile Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500 bg-white px-4 py-3 rounded-2xl border border-stone-200/90 shadow-xs">
        <span className="font-semibold text-stone-600">Switch Demo Account:</span>
        <div className="flex gap-2 flex-wrap">
          {storageService.getVolunteers().map((vol) => (
            <button
              key={vol.id}
              type="button"
              onClick={() => setCurrentUser(vol)}
              className={`px-2.5 py-1 min-h-[32px] rounded-lg font-mono text-xs transition-colors ${
                vol.id === currentUser.id
                  ? 'bg-orange-600 text-white font-bold'
                  : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {vol.sweId} ({vol.name.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* CURRENT STATUS & ONE-TAP ACTION */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/90 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Current Service Status
        </h3>

        {!activeSession ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-orange-50/60 border border-orange-100">
            <div>
              <p className="font-bold text-stone-900 text-base">You are not checked in.</p>
              <p className="text-xs text-stone-600 mt-0.5">
                On-site at So What Else? Check in with your phone to start logging hours.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCheckInModal(true)}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm shadow-md shadow-orange-600/20 transition-all shrink-0"
            >
              Check In Now
            </button>
          </div>
        ) : activeSession.checkInStatus === 'pending' ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Clock className="w-4 h-4 animate-spin text-amber-600" />
              <span>Check-In Pending Supervisor Approval</span>
            </div>
            <p className="text-xs text-amber-800">
              Your arrival at <span className="font-semibold">{activeSession.facilityName}</span> is awaiting on-site coordinator sign-off.
            </p>
            <div className="pt-1">
              <GpsBadge gps={activeSession.checkInGps} />
            </div>
          </div>
        ) : activeSession.checkOutStatus === 'pending' ? (
          <div className="p-4 rounded-2xl bg-stone-100 border border-stone-300 space-y-2">
            <div className="flex items-center gap-2 text-stone-800 font-bold text-sm">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Check-Out Submitted — Awaiting Approval</span>
            </div>
            <p className="text-xs text-stone-600">
              Shift complete! Coordinator is verifying your logged hours.
            </p>
          </div>
        ) : (
          // ACTIVE AND SERVING!
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 text-white space-y-4 shadow-lg shadow-orange-600/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <span className="font-black text-sm uppercase tracking-wider text-orange-100">
                  Currently Serving
                </span>
              </div>
              <span className="text-xs bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs font-semibold">
                {activeSession.facilityName}
              </span>
            </div>

            <div className="text-center py-2">
              <p className="text-xs uppercase text-orange-100 font-bold tracking-wider">Elapsed Service Time</p>
              <p className="text-4xl sm:text-5xl font-black text-white mt-1">
                {formatHoursVerbose(calculateElapsedHours(activeSession.checkInTime))}
              </p>
              <p className="text-xs text-orange-100 mt-1 font-medium">
                Activity: {activeSession.activityType}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePersonalCheckOut}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-white hover:bg-stone-50 text-neutral-900 font-black text-base transition-all shadow-md active:scale-[0.99]"
            >
              End Shift & Check Out
            </button>
          </div>
        )}
      </div>

      {/* CHECK-IN MODAL FOR PERSONAL MODE */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl border border-stone-200/90 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                Check In for Service
              </h3>
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="text-stone-400 hover:text-stone-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-xl font-bold"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Select Pantry / Hub Location
              </label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full px-3.5 py-3 min-h-[48px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium bg-white"
              >
                {SWE_FACILITIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Service Role
              </label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full px-3.5 py-3 min-h-[48px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium bg-white"
              >
                {ACTIVITY_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* GPS check */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/90 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-700">GPS Geofence (300m)</span>
                <GpsBadge gps={gpsInfo} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={isGpsLoading}
                  onClick={() => {
                    const fac =
                      SWE_FACILITIES.find((f) => f.id === selectedFacilityId) ||
                      SWE_FACILITIES[0];
                    requestRealGPS(fac);
                  }}
                  className="px-3 py-1.5 min-h-[36px] rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold transition-colors"
                >
                  {isGpsLoading ? 'Checking...' : 'Check Browser GPS'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fac =
                      SWE_FACILITIES.find((f) => f.id === selectedFacilityId) ||
                      SWE_FACILITIES[0];
                    simulateLocation(fac, 'onsite');
                  }}
                  className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition-colors"
                >
                  Simulate On-site
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePersonalCheckIn}
                className="flex-2 min-h-[44px] py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-sm font-bold shadow-md shadow-orange-600/20 transition-colors"
              >
                Submit Check-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MY SSL FORMS SECTION */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/90 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-orange-600" />
            <span>My Official SSL Verification Forms</span>
          </h3>
          <span className="text-xs font-bold bg-orange-100 text-orange-900 px-2 py-0.5 rounded-md">
            {mySSLForms.length} Issued
          </span>
        </div>

        {mySSLForms.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">
            No official SSL forms have been generated yet. When your supervisor issues an SSL form, you can view and download it right here.
          </p>
        ) : (
          <div className="space-y-3">
            {mySSLForms.map((form) => (
              <div
                key={form.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-stone-200 hover:border-orange-300 transition-colors bg-stone-50/70"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">
                      Official SSL Verification
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">
                      {form.totalVerifiedHours} Hours
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Dates: {form.dateRange.start} to {form.dateRange.end} • Supervisor: {form.supervisorName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onViewSSLForm?.(form.id)}
                  className="self-start sm:self-auto min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c1c1c] hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>View / Download</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VERIFIED SERVICE HISTORY */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/90 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span>Past Verified Service Sessions</span>
        </h3>

        {pastSessions.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">
            No completed shifts yet. Check in to earn your first verified hours!
          </p>
        ) : (
          <div className="divide-y divide-stone-100">
            {pastSessions.map((session) => (
              <div key={session.id} className="py-3.5 flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-stone-800">{session.activityType}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {formatDateTime(session.checkInTime)} • {session.facilityName}
                  </p>
                  {session.checkOutApprovedBy && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Approved by {session.checkOutApprovedBy}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-orange-600 text-base">
                    +{session.totalHours} hrs
                  </span>
                  <p className="text-[10px] text-stone-400">Verified</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
