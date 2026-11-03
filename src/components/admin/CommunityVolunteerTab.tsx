import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Heart,
  History,
  Info,
  MapPin,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { ServiceSession } from '../../types';
import {
  calculateElapsedHours,
  formatDateTime,
  formatHoursVerbose,
  formatTimeOnly,
} from '../../utils/hours';
import { GpsBadge } from '../shared/GpsBadge';

interface CommunityVolunteerTabProps {
  adminName: string;
}

export function CommunityVolunteerTab({ adminName }: CommunityVolunteerTabProps) {
  const [sessions, setSessions] = useState<ServiceSession[]>(() =>
    storageService.getSessions()
  );
  const [search, setSearch] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sign-off modal state
  const [signOffSession, setSignOffSession] = useState<ServiceSession | null>(null);
  const [signOffNotes, setSignOffNotes] = useState('');

  // Day close modal state
  const [showDayCloseModal, setShowDayCloseModal] = useState(false);
  const [dayCloseFacilityId, setDayCloseFacilityId] = useState<string>('all');
  const [dayCloseTimeMode, setDayCloseTimeMode] = useState<'facility_default' | 'current_time' | 'custom'>('facility_default');
  const [dayCloseCustomTime, setDayCloseCustomTime] = useState('17:00');
  const [dayCloseNotes, setDayCloseNotes] = useState('Facility end-of-day uniform sign-off');

  const refreshData = () => {
    setSessions(storageService.getSessions());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = storageService.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, []);

  const facilities = storageService.getFacilities();
  const stats = storageService.getCommunityServiceStats();
  const currentlyServing = storageService.getCommunityServingSessions();
  const completedSessions = storageService.getCommunityCompletedSessions();

  // Candidates for batch day close
  const dayCloseCandidates = currentlyServing.filter((s) => {
    return dayCloseFacilityId === 'all' || s.facilityId === dayCloseFacilityId;
  });

  const handleConfirmDayClose = () => {
    let customCloseTime: string | undefined = undefined;
    if (dayCloseTimeMode === 'current_time') {
      const now = new Date();
      customCloseTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    } else if (dayCloseTimeMode === 'custom') {
      customCloseTime = dayCloseCustomTime;
    }

    const closed = storageService.closeDayForAllCommunityVolunteers({
      facilityId: dayCloseFacilityId === 'all' ? undefined : dayCloseFacilityId,
      customCloseTime,
      adminName,
      notes: dayCloseNotes || undefined,
    });

    setShowDayCloseModal(false);
    refreshData();
    if (closed.signedOffCount > 0) {
      setFeedback(
        `Facility successfully closed for the day! Signed off ${closed.signedOffCount} community volunteer shift${
          closed.signedOffCount === 1 ? '' : 's'
        } (${closed.totalHoursCredited} hrs total credited) with uniform closing hours.`
      );
    } else {
      setFeedback('No active community volunteer shifts were pending close at this facility.');
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  // Filter currently serving list
  const filteredServing = currentlyServing.filter((s) => {
    const matchSearch =
      s.volunteerName.toLowerCase().includes(search.toLowerCase()) ||
      s.sweId.toLowerCase().includes(search.toLowerCase()) ||
      s.volunteerEmail.toLowerCase().includes(search.toLowerCase());

    const matchFacility =
      selectedFacility === 'all' || s.facilityId === selectedFacility;

    return matchSearch && matchFacility;
  });

  // Filter completed list
  const filteredCompleted = completedSessions.filter((s) => {
    const matchSearch =
      s.volunteerName.toLowerCase().includes(search.toLowerCase()) ||
      s.sweId.toLowerCase().includes(search.toLowerCase());

    const matchFacility =
      selectedFacility === 'all' || s.facilityId === selectedFacility;

    return matchSearch && matchFacility;
  });

  const handleQuickSignOff = (session: ServiceSession) => {
    storageService.completeCommunityShift(session.id, adminName, signOffNotes || undefined);
    setSignOffSession(null);
    setSignOffNotes('');
    setFeedback(`Shift signed off for ${session.volunteerName}. Verified hours saved!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Currently Serving Live Counter */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Serving Right Now
            </span>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {stats.currentlyServingCount}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active On-Site
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            No form waitlist. Fast-track community volunteers.
          </p>
        </div>

        {/* Total Hours Beyond SSL */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Community Hours (Beyond SSL)
            </span>
            <Heart className="w-5 h-5 text-orange-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-orange-600 tracking-tight">
              {stats.totalHoursBeyondSSL}
            </span>
            <span className="text-xs font-bold text-stone-500">hours</span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Logged by adult & general service volunteers.
          </p>
        </div>

        {/* Total General Volunteers */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Community Volunteers
            </span>
            <Users className="w-5 h-5 text-stone-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {stats.totalCommunityVolunteers}
            </span>
            <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
              Registered
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Adults & community members serving without forms.
          </p>
        </div>

        {/* GPS On-Site Verification */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              GPS Verified On-Site
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">
              {stats.gpsOnsiteCount}
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Shifts Inside Radius
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            {stats.gpsFlaggedCount > 0
              ? `⚠️ ${stats.gpsFlaggedCount} shifts flagged (>300m away)`
              : 'All recorded shifts within 300m facility radius.'}
          </p>
        </div>
      </div>

      {/* Rationale & Simplified Flow Banner */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-stone-50 border border-orange-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-base">
              Streamlined Community Volunteer Workflow (No Form Required)
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
              Volunteers who do not need MCPS SSL or court-mandated certificates have low incentive for hour inflation. They are <strong>automatically activated upon check-in</strong> to eliminate front-desk bottleneck lines, and their presence is tracked here with GPS coordinates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <History className="w-4 h-4 text-stone-500" />
            <span>{showHistory ? 'Show Active Only' : 'View Completed Shifts'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDayCloseModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1c1c1c] hover:bg-stone-800 active:bg-black text-white font-bold text-xs transition-colors flex items-center gap-1.5 min-h-[44px] shadow-sm"
          >
            <Moon className="w-4 h-4 text-orange-400" />
            <span>Close Facility for Day ({currentlyServing.length} Active)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-md animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search & Facility Filters */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search community volunteers by name, email, or SWE ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-stone-900"
          />
        </div>

        <select
          value={selectedFacility}
          onChange={(e) => setSelectedFacility(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[42px]"
        >
          <option value="all">All Pantry & Hub Locations</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} {f.closingTime ? `(Closes ${f.closingTime})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Active Serving Volunteers Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="font-extrabold text-stone-900 text-base">
              Currently Serving on Site ({filteredServing.length})
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
              Auto-approved & active
            </span>
            {filteredServing.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDayCloseFacilityId(selectedFacility);
                  setShowDayCloseModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 min-h-[36px]"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Sign-Off All ({filteredServing.length})</span>
              </button>
            )}
          </div>
        </div>

        {filteredServing.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-800 text-sm">
              No Community Volunteers Currently Serving
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              When an adult or general volunteer checks in at the kiosk (without requesting an SSL form), they will immediately appear here with live time and GPS status.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredServing.map((session) => {
              const elapsed = calculateElapsedHours(session.checkInTime);

              return (
                <div
                  key={session.id}
                  className="p-5 hover:bg-stone-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Volunteer Details */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-stone-900 text-base">
                        {session.volunteerName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
                        {session.sweId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
                        General Volunteer (No Forms)
                      </span>
                      <GpsBadge gps={session.checkInGps} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1 text-stone-700 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>{session.facilityName}</span>
                      </span>
                      <span>•</span>
                      <span className="font-medium text-stone-800">
                        {session.activityType}
                      </span>
                      <span>•</span>
                      <span>Checked In: {formatTimeOnly(session.checkInTime)}</span>
                    </div>

                    {session.notes && (
                      <p className="text-xs text-stone-600 bg-stone-100/70 px-3 py-1.5 rounded-xl border border-stone-200/60 inline-block">
                        Note: {session.notes}
                      </p>
                    )}
                  </div>

                  {/* Elapsed Timer & 1-Click Sign-Off */}
                  <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
                    <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-2xl text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                        Serving Time
                      </span>
                      <span className="font-mono font-black text-emerald-950 text-base">
                        {formatHoursVerbose(elapsed)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSignOffSession(session)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sign-Off & Complete Shift</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Community Shifts Section */}
      {showHistory && (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
              <History className="w-4 h-4 text-stone-500" />
              <span>Completed Community Service Shifts ({filteredCompleted.length})</span>
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              Verified & credited beyond SSL
            </span>
          </div>

          {filteredCompleted.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">
              No completed community service shifts recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredCompleted.map((session) => (
                <div
                  key={session.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm">
                        {session.volunteerName}
                      </span>
                      <span className="font-mono text-stone-500">{session.sweId}</span>
                      <GpsBadge gps={session.checkInGps} />
                    </div>
                    <p className="text-stone-500">
                      {session.facilityName} • {session.activityType} • {formatDateTime(session.checkInTime)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-stone-100 text-stone-800 border border-stone-200">
                      {session.totalHours} hrs verified
                    </span>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Signed off by {session.checkOutApprovedBy || 'Admin'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sign-Off Confirmation Modal */}
      {signOffSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg">
                  Sign Off Community Shift
                </h3>
                <p className="text-xs text-stone-500">
                  {signOffSession.volunteerName} ({signOffSession.sweId})
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Location:</span>
                <span className="font-semibold text-stone-800">{signOffSession.facilityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Check-in:</span>
                <span className="font-semibold text-stone-800">{formatTimeOnly(signOffSession.checkInTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">GPS Onsite Verification:</span>
                <GpsBadge gps={signOffSession.checkInGps} />
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 font-bold">
                <span className="text-stone-700">Elapsed Hours to Credit:</span>
                <span className="text-orange-600 font-mono text-sm">
                  {formatHoursVerbose(calculateElapsedHours(signOffSession.checkInTime))}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Optional Supervisor Note
              </label>
              <input
                type="text"
                value={signOffNotes}
                onChange={(e) => setSignOffNotes(e.target.value)}
                placeholder="e.g. Great work loading morning produce boxes"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <p className="text-[11px] text-stone-500 leading-normal">
              Because this volunteer does not require an MCPS SSL form, their shift is saved directly to their community record and total hours beyond SSL are updated immediately.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSignOffSession(null)}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleQuickSignOff(signOffSession)}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20"
              >
                Confirm & Credit Hours
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Day-Close Facility Modal */}
      {showDayCloseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-orange-400 flex items-center justify-center shrink-0 shadow-md">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg">
                  Close Facility for the Day
                </h3>
                <p className="text-xs text-stone-500">
                  Batch sign-off remaining community volunteers with uniform closing hours
                </p>
              </div>
            </div>

            {/* Facility Target Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Select Facility to Close
              </label>
              <select
                value={dayCloseFacilityId}
                onChange={(e) => setDayCloseFacilityId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[44px]"
              >
                <option value="all">All Facilities ({currentlyServing.length} active community volunteers)</option>
                {facilities.map((f) => {
                  const count = currentlyServing.filter((s) => s.facilityId === f.id).length;
                  return (
                    <option key={f.id} value={f.id}>
                      {f.name} — Closes at {f.closingTime || '17:00'} ({count} active)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Uniform Close Time Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Uniform Departure Time Setting
              </label>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  dayCloseTimeMode === 'facility_default'
                    ? 'border-orange-500 bg-orange-50/70 font-bold text-orange-950 ring-1 ring-orange-500'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="dayCloseMode"
                      checked={dayCloseTimeMode === 'facility_default'}
                      onChange={() => setDayCloseTimeMode('facility_default')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <p className="font-bold text-stone-900">Official Facility Closing Hours (Default)</p>
                      <p className="text-[11px] text-stone-500 font-normal">
                        Applies official facility closing time (e.g. 5:00 PM / 17:00) configured in Housekeeping
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700">
                    5:00 PM
                  </span>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  dayCloseTimeMode === 'current_time'
                    ? 'border-orange-500 bg-orange-50/70 font-bold text-orange-950 ring-1 ring-orange-500'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="dayCloseMode"
                      checked={dayCloseTimeMode === 'current_time'}
                      onChange={() => setDayCloseTimeMode('current_time')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <p className="font-bold text-stone-900">Current Moment (Real-Time)</p>
                      <p className="text-[11px] text-stone-500 font-normal">
                        Sign off all active volunteers right now at current clock time
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700">
                    Now
                  </span>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-2 transition-all ${
                  dayCloseTimeMode === 'custom'
                    ? 'border-orange-500 bg-orange-50/70 font-bold text-orange-950 ring-1 ring-orange-500'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="dayCloseMode"
                        checked={dayCloseTimeMode === 'custom'}
                        onChange={() => setDayCloseTimeMode('custom')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <div>
                        <p className="font-bold text-stone-900">Custom Uniform Time</p>
                        <p className="text-[11px] text-stone-500 font-normal">
                          Specify a precise closing time for today
                        </p>
                      </div>
                    </div>
                  </div>
                  {dayCloseTimeMode === 'custom' && (
                    <div className="pl-6 pt-1">
                      <input
                        type="time"
                        value={dayCloseCustomTime}
                        onChange={(e) => setDayCloseCustomTime(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 font-mono text-xs bg-white text-stone-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Candidates Preview List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700 uppercase tracking-wider">
                  Volunteers to Sign Off ({dayCloseCandidates.length})
                </span>
                <span className="text-stone-500">Fast-track community only</span>
              </div>

              {dayCloseCandidates.length === 0 ? (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                  No active community volunteers currently serving at this location.
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y divide-stone-200/80 rounded-2xl border border-stone-200 bg-stone-50 p-2 text-xs">
                  {dayCloseCandidates.map((sess) => (
                    <div key={sess.id} className="p-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-stone-900">{sess.volunteerName}</span>
                        <span className="text-[11px] text-stone-500 font-mono ml-2">{sess.sweId}</span>
                        <p className="text-[11px] text-stone-500">
                          {sess.facilityName} • Checked in: {formatTimeOnly(sess.checkInTime)}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Active Shift
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note input */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Optional Closing Note for Audit Trail
              </label>
              <input
                type="text"
                value={dayCloseNotes}
                onChange={(e) => setDayCloseNotes(e.target.value)}
                placeholder="e.g. Facility closed at 5:00 PM for scheduled sanitation"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              <strong>Notice:</strong> This action finalizes shifts for non-form adult and community volunteers up to the selected closing time. MCPS student SSL forms remain separate in their queue for individual signed certificates.
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDayCloseModal(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dayCloseCandidates.length === 0}
                onClick={handleConfirmDayClose}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Uniform Close ({dayCloseCandidates.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
