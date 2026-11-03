import { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Navigation,
  QrCode,
  Scale,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { SWE_FACILITIES, ACTIVITY_TYPES } from '../../data/facilities';
import { storageService } from '../../services/storage';
import { GPSInfo, ServiceSession, Volunteer, VolunteerType } from '../../types';
import { formatTimeOnly } from '../../utils/hours';
import { useGeolocation } from '../../utils/useGeolocation';
import {
  getVolunteerTypeConfig,
  isCommunityServiceVolunteer,
  VOLUNTEER_TYPE_OPTIONS,
} from '../../utils/volunteerType';
import { GpsBadge } from '../shared/GpsBadge';

interface KioskCheckInProps {
  onSuccessCheckIn?: (session: ServiceSession, volunteer: Volunteer) => void;
  onGoToCheckout?: () => void;
}

export function KioskCheckIn({ onSuccessCheckIn, onGoToCheckout }: KioskCheckInProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [volunteerType, setVolunteerType] = useState<VolunteerType>('student_ssl');
  const [showMorePrograms, setShowMorePrograms] = useState(false);
  const [showSection3, setShowSection3] = useState(false);
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [facilityId, setFacilityId] = useState(SWE_FACILITIES[0].id);
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [notes, setNotes] = useState('');
  const [selectedSweId, setSelectedSweId] = useState<string | null>(null);
  const [matchedVolunteers, setMatchedVolunteers] = useState<Volunteer[]>([]);

  const [copiedId, setCopiedId] = useState(false);
  const [submittedSession, setSubmittedSession] = useState<{
    session: ServiceSession;
    volunteer: Volunteer;
  } | null>(null);
  const [alreadyServingSession, setAlreadyServingSession] = useState<{
    session: ServiceSession;
    volunteer: Volunteer;
  } | null>(null);

  const selectedFacility =
    SWE_FACILITIES.find((f) => f.id === facilityId) || SWE_FACILITIES[0];

  const { gpsInfo, isLoading: isGpsLoading, error: gpsError, requestRealGPS, simulateLocation } =
    useGeolocation();

  // Proactively check browser location on mount if permissions were already granted
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        ?.query({ name: 'geolocation' as PermissionName })
        .then((perm) => {
          if (perm.state === 'granted') {
            requestRealGPS(selectedFacility);
          }
        })
        .catch(() => {});
    }
  }, [selectedFacility, requestRealGPS]);

  // Real-time check: is the current person being entered already serving or pending?
  const activeSessionForCurrent = useMemo(() => {
    if (!name.trim() && !selectedSweId) return undefined;
    return storageService.getActiveSessionByVolunteer({
      sweId: selectedSweId || undefined,
      email: email.trim() || undefined,
      name: name.trim() || undefined,
    });
  }, [name, email, selectedSweId]);

  // If user inputs email, look up all existing volunteers under this email for family support
  const handleEmailLookup = (cleanEmail: string) => {
    if (!cleanEmail.trim()) {
      setMatchedVolunteers([]);
      return;
    }
    const found = storageService.findVolunteersByEmail(cleanEmail);
    setMatchedVolunteers(found);

    // If exactly 1 student found and name field is empty, autofill
    if (found.length === 1 && !name.trim()) {
      handleSelectStudent(found[0]);
    }
  };

  const handleSelectStudent = (v: Volunteer) => {
    setName(v.name);
    setEmail(v.email);
    setSelectedSweId(v.sweId);
    setVolunteerType(v.volunteerType || (v.needsSSL === false ? 'adult' : 'student_ssl'));
    if (v.school) setSchool(v.school);
    if (v.grade) setGrade(v.grade);
    if (v.school || v.grade) setShowSection3(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const isStudent = volunteerType === 'student_ssl';

    const volunteer = storageService.findOrCreateVolunteer({
      name,
      email,
      volunteerType,
      needsSSL: isStudent,
      formRequirement: isStudent ? 'ssl_mcps' : 'none',
      sweId: selectedSweId || undefined,
      school: school.trim() || undefined,
      grade: grade.trim() || undefined,
      authMethod: 'kiosk',
    });

    // Check if this volunteer is already serving!
    const active = storageService.getActiveSessionByVolunteer(volunteer);
    if (active) {
      setAlreadyServingSession({ session: active, volunteer });
      return;
    }

    // Determine GPS info if not already obtained
    let finalGps: GPSInfo | undefined = gpsInfo;
    if (!finalGps) {
      finalGps = await requestRealGPS(selectedFacility);
    }

    const session = storageService.requestCheckIn({
      volunteer,
      facilityId: selectedFacility.id,
      activityType,
      gps: finalGps,
      notes: notes.trim() || undefined,
    });

    setSubmittedSession({ session, volunteer });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    setSchool('');
    setGrade('');
    setNotes('');
    setSelectedSweId(null);
    setMatchedVolunteers([]);
    setShowSection3(false);
    setSubmittedSession(null);
    setAlreadyServingSession(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ALREADY SERVING / DUPLICATE CHECK-IN PREVENTED VIEW
  if (alreadyServingSession) {
    const { volunteer, session } = alreadyServingSession;
    const volConfig = getVolunteerTypeConfig(volunteer.volunteerType, volunteer.needsSSL);
    const isPending = session.checkInStatus === 'pending';

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200 max-w-lg mx-auto space-y-5 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <span>⚠️ Already Checked In</span>
          </div>
          <h2 className="text-2xl font-black text-stone-900">
            You Are Currently Serving
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
            <strong className="text-stone-900">{volunteer.name}</strong> is already checked in and actively logging service hours. To keep hours accurate, volunteers cannot check in multiple times simultaneously.
          </p>
        </div>

        {/* Current Active Shift Details Card */}
        <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/90 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="space-y-0.5">
              <span className="font-extrabold text-stone-900 text-base">
                {volunteer.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white text-stone-800 border border-stone-300">
                  {volunteer.sweId}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${volConfig.bgColor} ${volConfig.textColor} ${volConfig.borderColor}`}>
                  {volConfig.badge}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                isPending
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {isPending ? '⏳ Awaiting Approval' : '🟢 Currently Serving'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-stone-600">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase">Location</p>
              <p className="font-semibold text-stone-800 mt-0.5">{session.facilityName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase">Check-In Time</p>
              <p className="font-semibold text-stone-800 mt-0.5">{formatTimeOnly(session.checkInTime)}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase">Service Activity</p>
            <p className="font-semibold text-stone-800 text-xs mt-0.5">{session.activityType}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {onGoToCheckout && (
            <button
              type="button"
              onClick={onGoToCheckout}
              className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm sm:text-base transition-all shadow-md shadow-orange-700/20 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Ready to Leave? Go to Check-Out</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetForNext}
            className="min-h-[48px] py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-colors"
          >
            Check In Another Person
          </button>
        </div>
      </div>
    );
  }

  // SUCCESS CONFIRMATION VIEW
  if (submittedSession) {
    const { volunteer, session } = submittedSession;
    const volConfig = getVolunteerTypeConfig(volunteer.volunteerType, volunteer.needsSSL);
    const isCommunity = isCommunityServiceVolunteer(volunteer) || isCommunityServiceVolunteer(session);
    const needsForm = !isCommunity;

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        {/* SHORT & BIG PROMINENT NOTICE FOR VOLUNTEERS NEEDING FORMS */}
        {needsForm ? (
          <div className="bg-amber-400 text-stone-950 p-5 sm:p-6 rounded-2xl border-4 border-amber-500 shadow-xl text-center space-y-2">
            <div className="flex items-center justify-center gap-2.5 font-black text-xl sm:text-2xl uppercase tracking-tight text-stone-950">
              <AlertTriangle className="w-8 h-8 text-stone-950 shrink-0" />
              <span>IN-PERSON CHECK-IN AT FRONT DESK IS REQUIRED</span>
            </div>
            <p className="text-sm sm:text-base font-black text-stone-900 max-w-md mx-auto leading-snug">
              Please report to the Front Desk / Supervisor right now to have your SSL attendance officially verified.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50 text-emerald-950 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 shadow-xs text-center space-y-1">
            <div className="flex items-center justify-center gap-2 font-black text-base sm:text-lg text-emerald-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>Check-In Confirmed! You are ready to start serving.</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-emerald-700 max-w-md mx-auto">
              No front-desk paperwork needed. Your service hours will automatically record to your permanent community record.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center">
          <img
            src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
            alt="So What Else"
            className="w-16 h-16 rounded-2xl object-contain bg-[#1c1c1c] shadow-md ring-2 ring-orange-500/20 mb-3"
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 uppercase tracking-wider">
              {needsForm ? 'Check-In Notice Sent' : 'Shift Active & Running'}
            </span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${volConfig.badgeClass}`}>
              {volConfig.badge}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Welcome to So What Else, {volunteer.name}!
          </h2>
          <p className="text-stone-600 mt-2 text-sm sm:text-base">
            {needsForm
              ? `Your check-in has been sent to the on-site supervisor for verification at ${session.facilityName}.`
              : `Your community service session is now underway at ${session.facilityName}.`}
          </p>

          <p className="text-xs text-stone-500 mt-1 max-w-md">
            {needsForm
              ? '🎓 Program: MCPS Student Service Learning (SSL). Your supervisor will certify your hours on MCPS Form 560-51 upon shift completion.'
              : '👤 Program: Adult / Community Volunteer. Your verified service hours will be saved to your permanent volunteer profile.'}
          </p>
        </div>

        {/* Unique Volunteer ID Card */}
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
                <span className="ml-2 text-stone-400">• {volConfig.shortLabel}</span>
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
  const activeVolConfig = getVolunteerTypeConfig(volunteerType);

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
          Please provide your volunteer details to log your service hours (Students & Adult Volunteers).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Volunteer Category & Form Requirement */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-600" />
              <span>1. Volunteer Program & Form Requirement</span>
            </label>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${activeVolConfig.badgeClass}`}>
              {activeVolConfig.badge}
            </span>
          </div>

          {/* Primary Two Program Choices: Student SSL vs Adult Volunteer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setVolunteerType('student_ssl')}
              className={`p-3.5 rounded-2xl border text-left transition-all min-h-[58px] flex flex-col justify-between ${
                volunteerType === 'student_ssl'
                  ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/30'
                  : 'border-stone-200 bg-stone-50/60 hover:bg-white text-stone-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                  <span>🎓 Student (Needs SSL)</span>
                </span>
                {volunteerType === 'student_ssl' && (
                  <Check className="w-4 h-4 text-orange-600" />
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                MCPS middle/high school SSL Form 560-51 required for graduation.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setVolunteerType('adult')}
              className={`p-3.5 rounded-2xl border text-left transition-all min-h-[58px] flex flex-col justify-between ${
                volunteerType === 'adult'
                  ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/30'
                  : 'border-stone-200 bg-stone-50/60 hover:bg-white text-stone-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                  <span>👤 Adult Volunteer</span>
                </span>
                {volunteerType === 'adult' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                General community service. Lifetime hours logged (no SSL form needed).
              </p>
            </button>
          </div>

          {/* Optional Future Program Form Expander */}
          <div>
            <button
              type="button"
              onClick={() => setShowMorePrograms(!showMorePrograms)}
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors py-1"
            >
              <span>{showMorePrograms ? '− Hide additional program options' : '+ Other Programs: Court-Mandated, Corporate, Other'}</span>
              {showMorePrograms ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showMorePrograms && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 animate-fade-in text-xs">
                {[
                  {
                    id: 'court_mandated',
                    title: '⚖️ Court Mandated',
                    sub: 'Restitution service letters',
                  },
                  {
                    id: 'corporate',
                    title: '🏢 Corporate Group',
                    sub: 'Employer grant match',
                  },
                  {
                    id: 'other',
                    title: '📋 Other Program',
                    sub: 'Custom verification',
                  },
                ].map((prog) => (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => setVolunteerType(prog.id as VolunteerType)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      volunteerType === prog.id
                        ? 'border-stone-800 bg-white shadow-xs font-bold text-stone-950'
                        : 'border-stone-200 bg-white/70 hover:bg-white text-stone-700'
                    }`}
                  >
                    <p className="font-bold text-xs">{prog.title}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{prog.sub}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Volunteer Contact Details */}
        <div className="space-y-4 pt-2 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>2. Volunteer Information</span>
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
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  const match = matchedVolunteers.find(
                    (v) => v.name.toLowerCase() === val.trim().toLowerCase()
                  );
                  if (match) {
                    setSelectedSweId(match.sweId);
                    setVolunteerType(match.volunteerType || (match.needsSSL === false ? 'adult' : 'student_ssl'));
                    if (match.school) setSchool(match.school);
                    if (match.grade) setGrade(match.grade);
                  } else {
                    setSelectedSweId(null);
                  }
                }}
                placeholder="e.g. Marcus Chen or Robert Taylor"
                className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-900 text-base"
              />
              <User className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  handleEmailLookup(e.target.value);
                }}
                onBlur={() => handleEmailLookup(email)}
                placeholder="volunteer@gmail.com or student@mcpsmd.net"
                className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-900 text-base"
              />
              <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Family members or siblings can use the same shared email.
            </p>
          </div>

          {/* Sibling / Multi-Volunteer Quick-Selector */}
          {matchedVolunteers.length > 0 && (
            <div className="p-3.5 bg-orange-50/80 border border-orange-200/90 rounded-2xl space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span>Volunteers Linked to this Email ({matchedVolunteers.length}):</span>
                </span>
                <span className="text-[11px] text-stone-500 font-medium">Tap to pick person</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {matchedVolunteers.map((vol) => {
                  const isSelected = selectedSweId === vol.sweId;
                  const cfg = getVolunteerTypeConfig(vol.volunteerType, vol.needsSSL);
                  const active = storageService.getActiveSessionByVolunteer(vol);
                  const isServing = Boolean(active);

                  return (
                    <button
                      key={vol.id}
                      type="button"
                      onClick={() => handleSelectStudent(vol)}
                      className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-xs ring-2 ring-orange-600/30'
                          : 'bg-white border border-stone-200 text-stone-800 hover:border-orange-400 active:bg-orange-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{vol.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-orange-700 text-white' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {vol.sweId}
                      </span>
                      <span className="text-[10px] opacity-80">({cfg.shortLabel})</span>
                      {isServing && (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          🟢 Serving
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Information text box: Input Name to Register New Volunteer */}
              <div className="p-3 bg-white/95 border border-orange-200 rounded-xl flex items-start gap-2.5 text-xs text-stone-700 shadow-2xs">
                <span className="text-base leading-none mt-0.5">✍️</span>
                <div className="space-y-0.5">
                  <p className="font-extrabold text-stone-900">
                    Input Name to Register New Volunteer
                  </p>
                  <p className="text-[11px] text-stone-600 leading-snug">
                    To register a new sibling or family member under this shared email, simply type their name in the <strong>Full Legal Name</strong> field above. They will be assigned their own distinct SWE ID.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: School or Affiliation Details (Expandable) */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowSection3(!showSection3)}
              className="flex items-center justify-between w-full py-2.5 px-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 active:bg-stone-200 transition-colors text-left border border-stone-200/80 group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-orange-200">
                  {showSection3 ? '−' : '+'}
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-orange-600" />
                    <span>
                      {volunteerType === 'student_ssl'
                        ? '3. School & Grade Information (Optional)'
                        : '3. Organization / Affiliation (Optional)'}
                    </span>
                    {(school || grade) && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Filled
                      </span>
                    )}
                  </span>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {showSection3
                      ? 'Click to collapse this optional section'
                      : volunteerType === 'student_ssl'
                      ? 'Click to add school and grade if needed for MCPS SSL form'
                      : 'Click to add company, college, or group affiliation'}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-stone-400 group-hover:text-stone-600">
                {showSection3 ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>
          </div>

          {showSection3 && (
            <div className="mt-3.5 space-y-3.5 p-4 bg-stone-50/60 rounded-2xl border border-stone-200/70 animate-fade-in">
              {volunteerType === 'adult' ? (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Adult Volunteer Program:</strong> School info is optional. Your volunteer hours are verified on-site and saved to your permanent community service record.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-stone-500">
                  MCPS student school and grade information is optional and can be updated at any time.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    {volunteerType === 'student_ssl'
                      ? 'School Name (Optional)'
                      : 'Company / Organization / School (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder={
                      volunteerType === 'student_ssl'
                        ? 'e.g. Richard Montgomery High'
                        : 'e.g. Community Member, Employer, or College'
                    }
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-800 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    {volunteerType === 'student_ssl' ? 'Grade Level' : 'Category / Grade Level'}
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-800 text-sm bg-white"
                  >
                    <option value="">Select (Optional)</option>
                    <option value="9th Grade (Freshman)">9th Grade (Freshman)</option>
                    <option value="10th Grade (Sophomore)">10th Grade (Sophomore)</option>
                    <option value="11th Grade (Junior)">11th Grade (Junior)</option>
                    <option value="12th Grade (Senior)">12th Grade (Senior)</option>
                    <option value="Middle School">Middle School</option>
                    <option value="College / Adult">College / Adult Volunteer</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Facility Location & Volunteer Role */}
        <div className="space-y-4 pt-2 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>4. Facility & Service Activity</span>
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

        {/* Active Shift Warning & Duplicate Prevention Alert */}
        {activeSessionForCurrent && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2 text-xs text-amber-950 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2 font-black text-sm text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{name || 'This volunteer'} is already checked in and serving!</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              An active shift at <strong>{activeSessionForCurrent.facilityName}</strong> is already underway (checked in at {formatTimeOnly(activeSessionForCurrent.checkInTime)}, {activeSessionForCurrent.activityType}). To prevent duplicate time records, volunteers can only have one active shift at a time.
            </p>
            {onGoToCheckout && (
              <button
                type="button"
                onClick={onGoToCheckout}
                className="w-full mt-2 py-3 px-4 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Finished Your Shift? Proceed to Fast Check-Out →</span>
              </button>
            )}
          </div>
        )}

        {/* Submit Button - disabled if already serving */}
        <button
          type="submit"
          disabled={Boolean(activeSessionForCurrent)}
          className={`w-full min-h-[52px] py-3.5 px-6 rounded-2xl font-bold text-base sm:text-lg transition-all ${
            activeSessionForCurrent
              ? 'bg-stone-200 text-stone-500 cursor-not-allowed border border-stone-300 shadow-none'
              : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white shadow-lg shadow-orange-600/25 hover:shadow-xl active:scale-[0.99]'
          }`}
        >
          {activeSessionForCurrent
            ? '⚠️ Already Serving — Duplicate Check-In Blocked'
            : 'Submit Check-In Request'}
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
