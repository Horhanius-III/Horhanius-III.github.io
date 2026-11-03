import { useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  GraduationCap,
  Heart,
  IdCard,
  Mail,
  MapPin,
  Navigation,
  QrCode,
  Sparkles,
  User,
} from 'lucide-react';
import { SWE_FACILITIES, ACTIVITY_TYPES } from '../../data/facilities';
import { storageService } from '../../services/storage';
import { GPSInfo, ServiceSession, Volunteer } from '../../types';
import { useGeolocation } from '../../utils/useGeolocation';
import { GpsBadge } from '../shared/GpsBadge';

interface KioskCheckInProps {
  onSuccessCheckIn?: (session: ServiceSession, volunteer: Volunteer) => void;
  onGoToCheckout?: () => void;
}

export function KioskCheckIn({ onSuccessCheckIn, onGoToCheckout }: KioskCheckInProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [facilityId, setFacilityId] = useState(SWE_FACILITIES[0].id);
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [notes, setNotes] = useState('');

  const [copiedId, setCopiedId] = useState(false);
  const [submittedSession, setSubmittedSession] = useState<{
    session: ServiceSession;
    volunteer: Volunteer;
  } | null>(null);

  const selectedFacility =
    SWE_FACILITIES.find((f) => f.id === facilityId) || SWE_FACILITIES[0];

  const { gpsInfo, isLoading: isGpsLoading, error: gpsError, requestRealGPS, simulateLocation } =
    useGeolocation();

  // If user inputs email, look up existing volunteer for convenience
  const handleEmailBlur = () => {
    if (!email.trim()) return;
    const existing = storageService.findVolunteerByEmail(email);
    if (existing) {
      if (!name) setName(existing.name);
      if (!studentId && existing.studentId) setStudentId(existing.studentId);
      if (!school && existing.school) setSchool(existing.school);
      if (!grade && existing.grade) setGrade(existing.grade);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    // Determine GPS info if not already obtained
    let finalGps: GPSInfo | undefined = gpsInfo;
    if (!finalGps) {
      // Prompt GPS or default to onsite simulation if browser permission not yet triggered
      finalGps = await requestRealGPS(selectedFacility);
    }

    const volunteer = storageService.findOrCreateVolunteer({
      name,
      email,
      studentId: studentId.trim() || undefined,
      school: school.trim() || undefined,
      grade: grade.trim() || undefined,
      authMethod: 'kiosk',
    });

    const session = storageService.requestCheckIn({
      volunteer,
      facilityId: selectedFacility.id,
      activityType,
      gps: finalGps,
      notes: notes.trim() || undefined,
    });

    setSubmittedSession({ session, volunteer });
    onSuccessCheckIn?.(session, volunteer);
  };

  const handleCopyId = () => {
    if (!submittedSession) return;
    navigator.clipboard?.writeText(submittedSession.volunteer.sweId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleResetForNext = () => {
    setName('');
    setEmail('');
    setStudentId('');
    setSchool('');
    setGrade('');
    setNotes('');
    setSubmittedSession(null);
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedSession) {
    const { volunteer, session } = submittedSession;
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="flex flex-col items-center">
          <img
            src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
            alt="So What Else"
            className="w-16 h-16 rounded-2xl object-contain bg-[#1c1c1c] shadow-md ring-2 ring-orange-500/20 mb-3"
          />
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 uppercase tracking-wider mb-2">
            Check-In Notice Sent
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Welcome to So What Else, {volunteer.name}!
          </h2>
          <p className="text-stone-600 mt-2 text-sm sm:text-base">
            Your check-in has been sent to the on-site supervisor for verification at{' '}
            <span className="font-semibold text-stone-900">{session.facilityName}</span>.
          </p>
        </div>

        {/* Unique Student ID Card */}
        <div className="bg-[#1c1c1c] text-white rounded-2xl p-5 sm:p-6 shadow-xl text-left relative overflow-hidden border border-stone-800">
          <div className="absolute right-3 top-3 opacity-15">
            <QrCode className="w-24 h-24 text-white" />
          </div>

          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Official So What Else Volunteer ID</span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-orange-400">
                {volunteer.sweId}
              </p>
              <p className="text-xs text-stone-300 mt-1">
                Assigned to: <span className="text-white font-medium">{volunteer.name}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyId}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-colors min-h-[40px]"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-stone-300">
            <span>Fast Check-Out Code</span>
            <span>Keep this for fast check-out!</span>
          </div>
        </div>

        {/* GPS Verification Status */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Location Verification
            </span>
            <GpsBadge gps={session.checkInGps} />
          </div>
          <p className="text-xs text-stone-600">
            {session.checkInGps?.isOutsideGeofence ? (
              <span className="text-rose-600 font-medium">
                ⚠️ Notice: You checked in outside the 300m facility radius. Supervisor will review your physical location on-site.
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">
                ✓ Location confirmed within facility radius ({session.checkInGps?.distanceMeters ?? 0}m from center).
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleResetForNext}
            className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-base transition-all shadow-md shadow-orange-700/20 active:scale-[0.99]"
          >
            Check In Another Volunteer
          </button>

          {onGoToCheckout && (
            <button
              type="button"
              onClick={onGoToCheckout}
              className="min-h-[48px] py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm transition-colors"
            >
              Go to Check-Out
            </button>
          )}
        </div>
      </div>
    );
  }

  // STANDARD FORM VIEW
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200 mb-1">
          <Heart className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
          <span>Kiosk Self Check-In</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Volunteer Sign-In
        </h2>
        <p className="text-stone-500 text-xs sm:text-sm">
          Please provide your student information to log your service hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Student Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Required Student Details</span>
          </h3>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marcus Chen"
                className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-900 text-base"
              />
              <User className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Email Address (for SSL Form delivery) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="student@mcpsmd.net or gmail.com"
                className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-900 text-base"
              />
              <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>
        </div>

        {/* Step 2: Optional School Information */}
        <div className="space-y-4 pt-2 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>School Information (Optional for SSL)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                School Name
              </label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Richard Montgomery High"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Grade Level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-800 text-sm bg-white"
              >
                <option value="">Select Grade (Optional)</option>
                <option value="9th Grade (Freshman)">9th Grade (Freshman)</option>
                <option value="10th Grade (Sophomore)">10th Grade (Sophomore)</option>
                <option value="11th Grade (Junior)">11th Grade (Junior)</option>
                <option value="12th Grade (Senior)">12th Grade (Senior)</option>
                <option value="Middle School">Middle School</option>
                <option value="College / Adult">College / Adult Volunteer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              Student ID / Existing SWE ID (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. MCPS ID # or existing code"
                className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-800 text-sm"
              />
              <IdCard className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* Step 3: Facility Location & Volunteer Role */}
        <div className="space-y-4 pt-2 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>Facility & Service Activity</span>
          </h3>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Pantry / Warehouse Location
            </label>
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="w-full px-3.5 py-3 min-h-[48px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-900 text-base bg-white font-medium"
            >
              {SWE_FACILITIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Service Role / Activity
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-800 text-sm bg-white"
            >
              {ACTIVITY_TYPES.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 4: GPS Geofence Verification */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-orange-600" />
              <span>Location Geofence Verification</span>
            </span>
            <GpsBadge gps={gpsInfo} />
          </div>

          <p className="text-xs text-stone-500">
            Browser GPS is checked against the 300m facility radius to verify physical on-site presence.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isGpsLoading}
              onClick={() => requestRealGPS(selectedFacility)}
              className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isGpsLoading ? 'Locating...' : 'Allow Browser GPS'}</span>
            </button>

            {/* Quick Testing Simulation Shortcuts */}
            <div className="flex items-center gap-1.5 ml-auto text-xs">
              <span className="text-stone-400 text-[11px] hidden sm:inline">Test Sim:</span>
              <button
                type="button"
                onClick={() => simulateLocation(selectedFacility, 'onsite')}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                title="Simulate within 35m of facility"
              >
                On-Site (&lt;50m)
              </button>
              <button
                type="button"
                onClick={() => simulateLocation(selectedFacility, 'offsite')}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors"
                title="Simulate outside 300m (850m away)"
              >
                Offsite (&gt;300m)
              </button>
            </div>
          </div>

          {gpsError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
              {gpsError}
            </p>
          )}
        </div>

        {/* Submit Button - large, prominent, cell phone friendly */}
        <button
          type="submit"
          className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-base sm:text-lg shadow-lg shadow-orange-600/25 transition-all hover:shadow-xl active:scale-[0.99]"
        >
          Submit Check-In Request
        </button>

        <p className="text-center text-xs text-stone-500">
          Need to check out?{' '}
          <button
            type="button"
            onClick={onGoToCheckout}
            className="text-orange-600 font-bold underline underline-offset-2 hover:text-orange-700 p-1"
          >
            Switch to Fast Check-Out
          </button>
        </p>
      </form>
    </div>
  );
}
