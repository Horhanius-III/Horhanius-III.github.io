import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  XCircle,
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

interface ApprovalQueueProps {
  adminName: string;
}

export function ApprovalQueue({ adminName }: ApprovalQueueProps) {
  const [filterTab, setFilterTab] = useState<'pending_checkin' | 'active_serving' | 'pending_checkout'>('pending_checkin');
  const [search, setSearch] = useState('');
  const [rejectingSessionId, setRejectingSessionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [sessions, setSessions] = useState<ServiceSession[]>(() => storageService.getSessions());
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'info' = 'success') => {
    setActionFeedback({ type, message });
    setTimeout(() => {
      setActionFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  useEffect(() => {
    // Initial fetch
    setSessions(storageService.getSessions());

    // Subscribe to storageService updates (including same tab and cross-tab/BroadcastChannel)
    const unsubscribe = storageService.subscribe(() => {
      setSessions(storageService.getSessions());
    });

    return unsubscribe;
  }, []);

  // 1. Pending Check-Ins
  const pendingCheckIns = sessions.filter(
    (s) => s.checkInStatus === 'pending'
  );

  // 2. Currently Serving (Checked-in and approved, not yet requested checkout or pending checkout)
  const currentlyServing = sessions.filter(
    (s) => s.checkInStatus === 'approved' && s.checkOutStatus === 'not_requested'
  );

  // 3. Pending Checkouts (Requested checkout, waiting supervisor verification)
  const pendingCheckOuts = sessions.filter(
    (s) => s.checkInStatus === 'approved' && s.checkOutStatus === 'pending'
  );

  const getFilteredList = () => {
    let list: ServiceSession[] = [];
    if (filterTab === 'pending_checkin') list = pendingCheckIns;
    else if (filterTab === 'active_serving') list = currentlyServing;
    else if (filterTab === 'pending_checkout') list = pendingCheckOuts;

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (s) =>
        s.volunteerName.toLowerCase().includes(q) ||
        s.sweId.toLowerCase().includes(q) ||
        s.facilityName.toLowerCase().includes(q) ||
        (s.school && s.school.toLowerCase().includes(q))
    );
  };

  const currentList = getFilteredList();

  const handleApproveCheckIn = (session: ServiceSession) => {
    storageService.approveCheckIn(session.id, adminName);
    setSessions(storageService.getSessions());
    showFeedback(`Approved check-in for ${session.volunteerName}. Active shift started.`);
  };

  const handleApproveCheckOut = (session: ServiceSession) => {
    storageService.approveCheckOut(session.id, adminName);
    setSessions(storageService.getSessions());
    const isCurrentlyServing = session.checkOutStatus === 'not_requested';
    showFeedback(
      isCurrentlyServing
        ? `Successfully signed out ${session.volunteerName}. Shift finalized and verified.`
        : `Approved checkout for ${session.volunteerName}. Verified hours logged.`
    );
  };

  const handleReject = () => {
    if (!rejectingSessionId || !rejectReason.trim()) return;
    const session = sessions.find((s) => s.id === rejectingSessionId);
    storageService.rejectCheckIn(rejectingSessionId, adminName, rejectReason.trim());
    setRejectingSessionId(null);
    setRejectReason('');
    setSessions(storageService.getSessions());
    showFeedback(
      `Check-in request for ${session?.volunteerName || 'volunteer'} rejected.`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Counters & Filter Tabs - touch friendly for phone screens */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setFilterTab('pending_checkin')}
          className={`p-4 rounded-2xl text-left border min-h-[44px] transition-all ${
            filterTab === 'pending_checkin'
              ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/50 shadow-xs'
              : 'bg-white border-stone-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Check-In Requests
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-200 text-amber-950">
              {pendingCheckIns.length}
            </span>
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">
            {pendingCheckIns.length}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Awaiting in-person verification
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('active_serving')}
          className={`p-4 rounded-2xl text-left border min-h-[44px] transition-all ${
            filterTab === 'active_serving'
              ? 'bg-orange-50/90 border-orange-400 ring-2 ring-orange-400/50 shadow-xs'
              : 'bg-white border-stone-200 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-900">
              Currently Serving
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-orange-200 text-orange-950">
              {currentlyServing.length}
            </span>
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">
            {currentlyServing.length}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">Active on-site right now</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('pending_checkout')}
          className={`p-4 rounded-2xl text-left border min-h-[44px] transition-all ${
            filterTab === 'pending_checkout'
              ? 'bg-stone-100 border-stone-400 ring-2 ring-stone-400/50 shadow-xs'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Check-Out Requests
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-stone-200 text-stone-900">
              {pendingCheckOuts.length}
            </span>
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">
            {pendingCheckOuts.length}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">Ready for final sign-off</p>
        </button>
      </div>

      {/* Search Bar & Manual Refresh */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter queue by student name, ID, facility, or school..."
            className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white"
          />
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
        </div>
        <button
          type="button"
          onClick={() => {
            setSessions(storageService.getSessions());
            showFeedback('Queue refreshed with latest updates.', 'info');
          }}
          title="Refresh queue"
          className="p-3 bg-white border border-stone-200 hover:border-stone-300 rounded-2xl text-stone-600 hover:text-stone-900 transition-colors shadow-2xs flex items-center justify-center min-h-[48px] min-w-[48px]"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Real-time Feedback Banner */}
      {actionFeedback && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 border shadow-xs transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs text-slate-400 hover:text-slate-700 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main List of Volunteer Cards */}
      {currentList.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-2">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">Queue is Empty</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterTab === 'pending_checkin' && 'No volunteers waiting for check-in approval.'}
            {filterTab === 'active_serving' && 'No volunteers currently serving at this moment.'}
            {filterTab === 'pending_checkout' && 'No volunteers waiting for check-out sign-off.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((session) => {
            const elapsed = calculateElapsedHours(
              session.checkInTime,
              session.checkOutTime
            );
            const isGpsFlagged = Boolean(
              session.checkInGps?.isOutsideGeofence ||
                session.checkOutGps?.isOutsideGeofence
            );

            return (
              <div
                key={session.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  isGpsFlagged
                    ? 'border-rose-300 ring-1 ring-rose-300/50 bg-rose-50/10'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Student & Activity Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                        {session.volunteerName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {session.sweId}
                      </span>
                      {session.school && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>{session.school} {session.grade && `(${session.grade})`}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-800">
                          {session.facilityName}
                        </span>
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Arrived: {formatTimeOnly(session.checkInTime)}</span>
                      </span>

                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {session.activityType}
                      </span>
                    </div>

                    {session.notes && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{session.notes}"
                      </p>
                    )}

                    {/* Geolocation Verification & Flag warning */}
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        Check-In Location:
                      </span>
                      <GpsBadge gps={session.checkInGps} />

                      {session.checkOutGps && (
                        <>
                          <span className="text-[11px] font-bold text-slate-500 uppercase ml-2">
                            Check-Out Location:
                          </span>
                          <GpsBadge gps={session.checkOutGps} />
                        </>
                      )}
                    </div>

                    {/* Prominent Geofence Alert Warning */}
                    {isGpsFlagged && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            ⚠️ GPS Geofence Flag (&gt;300m threshold)
                          </p>
                          <p className="text-rose-700 mt-0.5">
                            This volunteer requested sign-in or checkout outside the 300-meter facility radius. Please confirm they are physically on-site before approving.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Action Section */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-end lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto">
                    {/* Live Duration Display */}
                    <div className="flex sm:flex-col justify-between items-center sm:items-end bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl w-full sm:w-auto">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                        Elapsed Time
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 flex sm:inline items-baseline gap-1.5">
                        {formatHoursVerbose(elapsed)}
                        <span className="text-xs font-semibold text-slate-500">({elapsed}h)</span>
                      </p>
                    </div>

                    {/* Buttons depending on queue tab */}
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-end">
                      {filterTab === 'pending_checkin' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setRejectingSessionId(session.id)}
                            className="w-full sm:w-auto py-3 px-4 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 active:bg-rose-100 text-xs sm:text-sm font-bold transition-colors min-h-[46px] flex items-center justify-center"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveCheckIn(session)}
                            className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-sm font-extrabold shadow-md shadow-orange-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Confirm Onsite & Approve</span>
                          </button>
                        </>
                      )}

                      {filterTab === 'active_serving' && (
                        <button
                          type="button"
                          onClick={() => handleApproveCheckOut(session)}
                          className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-[#1c1c1c] hover:bg-stone-800 active:bg-black text-white text-sm sm:text-base font-extrabold shadow-md shadow-black/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 min-h-[50px]"
                        >
                          <UserCheck className="w-5 h-5 text-orange-400" />
                          <span>Sign-Off & Checkout</span>
                        </button>
                      )}

                      {filterTab === 'pending_checkout' && (
                        <button
                          type="button"
                          onClick={() => handleApproveCheckOut(session)}
                          className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-sm sm:text-base font-black shadow-lg shadow-orange-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 min-h-[50px]"
                        >
                          <CheckCircle2 className="w-5 h-5 text-white" />
                          <span>Approve Checkout ({elapsed} hrs)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="font-bold text-slate-900 text-base">
              Reject Check-In Request
            </h4>
            <p className="text-xs text-slate-500">
              Please enter the reason for rejection (e.g. volunteer was not physically present or entered wrong facility).
            </p>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejecting..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRejectingSessionId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
