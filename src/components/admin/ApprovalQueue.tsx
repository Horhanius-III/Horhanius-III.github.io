import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileCheck,
  FileEdit,
  FileText,
  GraduationCap,
  Info,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { ServiceSession, SSLForm } from '../../types';
import {
  calculateElapsedHours,
  formatDateTime,
  formatHoursVerbose,
  formatTimeOnly,
  HourRoundingMode,
  roundHours,
} from '../../utils/hours';
import {
  ACADEMIC_PREPARATION_PRESETS,
  SERVICE_ACTIVITY_PRESETS,
} from '../../data/sslPresets';
import { GpsBadge } from '../shared/GpsBadge';
import { getVolunteerTypeConfig } from '../../utils/volunteerType';
import { populateOriginalMcpsFormPdf } from '../../utils/pdfGenerator';
import { SSLDocumentView } from './SSLDocumentView';

interface ApprovalQueueProps {
  adminName: string;
  adminEmail?: string;
  onViewSSLForm?: (formId: string) => void;
}

export function ApprovalQueue({ adminName, adminEmail, onViewSSLForm }: ApprovalQueueProps) {
  const [filterTab, setFilterTab] = useState<'pending_checkin' | 'active_serving' | 'pending_checkout'>('pending_checkin');
  const [volunteerProgramFilter, setVolunteerProgramFilter] = useState<'all' | 'students' | 'adults'>('all');
  const [search, setSearch] = useState('');
  const [rejectingSessionId, setRejectingSessionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [sessions, setSessions] = useState<ServiceSession[]>(() => storageService.getSessions());
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // Issued SSL Form Celebratory Result Modal
  const [issuedSSLResult, setIssuedSSLResult] = useState<{
    form: SSLForm;
    shareUrl: string;
    studentEmail: string;
    volunteerName: string;
    sweId: string;
  } | null>(null);

  // Full Issuance Modal for "Sign-Out & Issue SSL Form" & "Approve & Issue SSL Form"
  interface IssuanceModalState {
    session: ServiceSession;
    actionType: 'sign_out_and_issue' | 'approve_and_issue';
    rawHours: number;
  }
  const [issuingModalState, setIssuingModalState] = useState<IssuanceModalState | null>(null);
  const [issuingRoundingMode, setIssuingRoundingMode] = useState<HourRoundingMode>('ceil_half');
  const [issuingCustomHours, setIssuingCustomHours] = useState('');
  const [supervisorName, setSupervisorName] = useState(adminName || 'Sarah Jenkins');
  const [supervisorTitle, setSupervisorTitle] = useState('Director of Volunteer Operations');
  const [supervisorEmail, setSupervisorEmail] = useState(adminEmail || 'sjenkins@sowhatelse.org');
  const [supervisorPhone, setSupervisorPhone] = useState('(240) 668-4500');
  const [academicPrepChoice, setAcademicPrepChoice] = useState('');
  const [serviceActivityChoice, setServiceActivityChoice] = useState('');
  const [serviceTypeChoice, setServiceTypeChoice] = useState<'DIRECT' | 'INDIRECT' | 'ADVOCACY'>('DIRECT');
  const [distributionMode, setDistributionMode] = useState<'download_pdf' | 'unique_link' | 'email'>('download_pdf');

  // Local document viewer modal fallback if onViewSSLForm not provided
  const [viewingForm, setViewingForm] = useState<SSLForm | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  // 1. Pending Check-Ins (Only student SSL volunteers requiring supervisor verification)
  const pendingCheckIns = sessions.filter(
    (s) =>
      s.checkInStatus === 'pending' &&
      s.volunteerType !== 'adult' &&
      s.needsSSL !== false &&
      s.formRequirement !== 'none'
  );

  // 2. Currently Serving (Checked-in and approved, not yet requested checkout or pending checkout)
  const currentlyServing = sessions.filter(
    (s) => s.checkInStatus === 'approved' && s.checkOutStatus === 'not_requested'
  );

  // 3. Pending Checkouts (Requested checkout, waiting supervisor sign-off for SSL certificate)
  const pendingCheckOuts = sessions.filter(
    (s) =>
      s.checkInStatus === 'approved' &&
      s.checkOutStatus === 'pending' &&
      s.volunteerType !== 'adult' &&
      s.needsSSL !== false &&
      s.formRequirement !== 'none'
  );

  const getFilteredList = () => {
    let list: ServiceSession[] = [];
    if (filterTab === 'pending_checkin') list = pendingCheckIns;
    else if (filterTab === 'active_serving') list = currentlyServing;
    else if (filterTab === 'pending_checkout') list = pendingCheckOuts;

    if (volunteerProgramFilter === 'students') {
      list = list.filter((s) => s.volunteerType === 'student_ssl' || (s.needsSSL !== false && s.volunteerType !== 'adult'));
    } else if (volunteerProgramFilter === 'adults') {
      list = list.filter((s) => s.volunteerType === 'adult' || s.needsSSL === false);
    }

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

  const handleOpenSignOutAndIssueModal = (session: ServiceSession) => {
    const rawElapsed = calculateElapsedHours(session.checkInTime);
    const tmpl = storageService.getSection2Template();
    setIssuingModalState({
      session,
      actionType: 'sign_out_and_issue',
      rawHours: rawElapsed,
    });
    setIssuingRoundingMode('ceil_half');
    setIssuingCustomHours('');
    setAcademicPrepChoice(tmpl.academicPreparationText || '');
    setServiceActivityChoice(
      tmpl.activityDescriptionText ||
        session.activityType ||
        'Assisted with food pantry warehouse operations, community distribution, and packing.'
    );
    setServiceTypeChoice(tmpl.serviceType || 'DIRECT');
    setSupervisorName(adminName || 'Sarah Jenkins');
    setSupervisorTitle('Director of Volunteer Operations');
    setSupervisorEmail(adminEmail || 'sjenkins@sowhatelse.org');
    setSupervisorPhone('(240) 668-4500');
    setDistributionMode('download_pdf');
  };

  const handleOpenApproveAndIssueModal = (session: ServiceSession) => {
    const elapsed =
      session.totalHours && session.totalHours > 0
        ? session.totalHours
        : calculateElapsedHours(session.checkInTime, session.checkOutTime);
    const tmpl = storageService.getSection2Template();
    setIssuingModalState({
      session,
      actionType: 'approve_and_issue',
      rawHours: elapsed,
    });
    setIssuingRoundingMode('ceil_half');
    setIssuingCustomHours('');
    setAcademicPrepChoice(tmpl.academicPreparationText || '');
    setServiceActivityChoice(
      tmpl.activityDescriptionText ||
        session.activityType ||
        'Assisted with food pantry warehouse operations, community distribution, and packing.'
    );
    setServiceTypeChoice(tmpl.serviceType || 'DIRECT');
    setSupervisorName(adminName || 'Sarah Jenkins');
    setSupervisorTitle('Director of Volunteer Operations');
    setSupervisorEmail(adminEmail || 'sjenkins@sowhatelse.org');
    setSupervisorPhone('(240) 668-4500');
    setDistributionMode('download_pdf');
  };

  const handleConfirmIssuance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuingModalState) return;

    const { session, actionType, rawHours } = issuingModalState;

    const finalHours = issuingCustomHours.trim()
      ? parseFloat(issuingCustomHours)
      : roundHours(rawHours, issuingRoundingMode);

    const result = storageService.approveCheckOutAndIssueSSLForm({
      sessionId: session.id,
      adminName: supervisorName,
      supervisorTitle,
      supervisorEmail,
      supervisorPhone,
      activityDescription: serviceActivityChoice,
      academicPreparationText: academicPrepChoice,
      serviceType: serviceTypeChoice,
      customHours: finalHours,
    });

    setSessions(storageService.getSessions());
    setIssuingModalState(null);

    if (result.sslForm) {
      if (distributionMode === 'download_pdf') {
        const tmpl = storageService.getSection2Template();
        await populateOriginalMcpsFormPdf(result.sslForm, tmpl, true);
        showFeedback(
          actionType === 'sign_out_and_issue'
            ? `✓ Signed out & Official MCPS Form #${result.sslForm.id} (${finalHours} hrs) issued & downloaded!`
            : `✓ Approved & Official MCPS Form #${result.sslForm.id} (${finalHours} hrs) issued & downloaded!`
        );
      } else if (distributionMode === 'unique_link') {
        const link = result.shareUrl || `${window.location.origin}?ssl=${result.sslForm.shareToken}`;
        navigator.clipboard?.writeText(link);
        showFeedback(`✓ Official MCPS Form #${result.sslForm.id} (${finalHours} hrs) issued & link copied to clipboard!`);
      } else {
        storageService.updateSSLStatus(result.sslForm.id, 'emailed');
        showFeedback(`✓ Official MCPS Form #${result.sslForm.id} (${finalHours} hrs) issued & emailed to ${result.studentEmail}!`);
      }

      setIssuedSSLResult({
        form: result.sslForm,
        shareUrl: result.shareUrl || `${window.location.origin}?ssl=${result.sslForm.shareToken}`,
        studentEmail: result.studentEmail || session.sweId,
        volunteerName: session.volunteerName,
        sweId: session.sweId,
      });
    } else {
      showFeedback(`Check-out approved for ${session.volunteerName} (${finalHours} hrs credited).`);
    }
  };

  const handleDownloadPdf = async (form: SSLForm) => {
    setIsGeneratingPdf(true);
    try {
      const template = storageService.getSection2Template();
      await populateOriginalMcpsFormPdf(form, template, true);
    } catch (err) {
      console.error('Failed to generate MCPS PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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

      {/* Tip Banner explaining community vs student workflows */}
      <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-stone-600">
        <Info className="w-4 h-4 text-orange-600 shrink-0" />
        <span>
          <strong>Fast-Track Notice:</strong> Community volunteers without form requirements are auto-activated upon check-in and managed under the <strong>Community Service (No Forms)</strong> tab to reduce queue congestion for student SSL verification.
        </span>
      </div>

      {/* Program Filter Pills: All / Students (SSL) / Adults */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1">Program:</span>
        <button
          type="button"
          onClick={() => setVolunteerProgramFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[36px] transition-all ${
            volunteerProgramFilter === 'all'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
          }`}
        >
          All Volunteers
        </button>
        <button
          type="button"
          onClick={() => setVolunteerProgramFilter('students')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[36px] transition-all flex items-center gap-1.5 ${
            volunteerProgramFilter === 'students'
              ? 'bg-[#E05A47] text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:border-orange-200'
          }`}
        >
          🎓 Students (Needs SSL)
        </button>
        <button
          type="button"
          onClick={() => setVolunteerProgramFilter('adults')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[36px] transition-all flex items-center gap-1.5 ${
            volunteerProgramFilter === 'adults'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:border-blue-200'
          }`}
        >
          👤 Adult Volunteers
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
            const isPendingCheckout =
              filterTab === 'pending_checkout' || session.checkOutStatus === 'pending';
            const elapsed =
              isPendingCheckout && session.totalHours && session.totalHours > 0
                ? session.totalHours
                : calculateElapsedHours(session.checkInTime, session.checkOutTime);

            const isGpsFlagged = Boolean(
              session.checkInGps?.isOutsideGeofence ||
                session.checkOutGps?.isOutsideGeofence
            );
            const typeCfg = getVolunteerTypeConfig(session.volunteerType, session.needsSSL);

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
                  {/* Volunteer & Activity Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                        {session.volunteerName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {session.sweId}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${typeCfg.bgColor} ${typeCfg.textColor} ${typeCfg.borderColor}`}>
                        {typeCfg.badge}
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

                      {session.checkOutTime && (
                        <span className="flex items-center gap-1 text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          <span>Sign-Off Clicked: {formatTimeOnly(session.checkOutTime)}</span>
                        </span>
                      )}

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
                        {isPendingCheckout ? 'Final Sign-Off Time' : 'Elapsed Time'}
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 flex sm:inline items-baseline gap-1.5">
                        {formatHoursVerbose(elapsed)}
                        <span className="text-xs font-semibold text-slate-500">({elapsed}h)</span>
                      </p>
                      {isPendingCheckout && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5">
                          ✓ Timer Locked at Click
                        </span>
                      )}
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
                        session.needsSSL !== false && session.volunteerType !== 'adult' ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-end w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => handleApproveCheckOut(session)}
                              className="px-3.5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-bold transition-colors flex items-center justify-center min-h-[44px]"
                            >
                              Sign-Out Only
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenSignOutAndIssueModal(session)}
                              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[46px]"
                            >
                              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                              <span>Sign-Out & Issue SSL Form</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApproveCheckOut(session)}
                            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-[#1c1c1c] hover:bg-stone-800 active:bg-black text-white text-sm sm:text-base font-extrabold shadow-md shadow-black/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 min-h-[50px]"
                          >
                            <UserCheck className="w-5 h-5 text-orange-400" />
                            <span>Sign-Off & Checkout</span>
                          </button>
                        )
                      )}

                      {filterTab === 'pending_checkout' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-end w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenApproveAndIssueModal(session)}
                            title="Customize supervisor contact, description, or hours before issuing"
                            className="order-3 sm:order-1 px-3 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                          >
                            <FileEdit className="w-3.5 h-3.5 text-stone-500" />
                            <span>Customize</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApproveCheckOut(session)}
                            title="Approve checkout without generating an SSL form right away"
                            className="order-2 px-3 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-800 text-xs font-medium transition-colors flex items-center justify-center min-h-[44px]"
                          >
                            Approve Only
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenApproveAndIssueModal(session)}
                            className="order-1 sm:order-3 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
                          >
                            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                            <span>Approve & Issue SSL Form ({elapsed}h)</span>
                          </button>
                        </div>
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

      {/* SUCCESS MODAL: SSL Form Issued Upon Checkout Approval */}
      {issuedSSLResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                    Checkout Approved & Verified
                  </span>
                  <h3 className="font-black text-stone-900 text-lg sm:text-xl">
                    Official MCPS SSL Form Issued!
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIssuedSSLResult(null)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Details Card */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/90 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div>
                  <p className="font-extrabold text-stone-900 text-sm">{issuedSSLResult.volunteerName}</p>
                  <p className="text-stone-500 font-mono text-[11px]">{issuedSSLResult.sweId}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                    {issuedSSLResult.form.totalVerifiedHours} Hours Verified
                  </span>
                  <p className="text-[10px] text-stone-400 mt-0.5">MCPS Form 560-51</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                <div>
                  <span className="font-bold text-stone-500">Form Reference:</span>
                  <p className="font-mono text-stone-800 truncate">{issuedSSLResult.form.id}</p>
                </div>
                <div>
                  <span className="font-bold text-stone-500">Supervisor:</span>
                  <p className="text-stone-800 truncate">{issuedSSLResult.form.supervisorName}</p>
                </div>
              </div>

              {/* Delivery / Email notification note */}
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <div className="flex items-start gap-2.5 text-stone-700 bg-white p-3 rounded-xl border border-stone-200">
                  <Mail className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-stone-900">Email Dispatch Sent</p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Official verification link emailed to{' '}
                      <strong className="text-stone-900">{issuedSSLResult.studentEmail}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-stone-700 bg-white p-3 rounded-xl border border-stone-200">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-stone-900">Available in Student's Personal Account</p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      The student can log into their SWE account to view, print, or download their completed Form 560-51.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onViewSSLForm) {
                      onViewSSLForm(issuedSSLResult.form.id);
                      setIssuedSSLResult(null);
                    } else {
                      setViewingForm(issuedSSLResult.form);
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-black shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <FileText className="w-4 h-4" />
                  <span>View / Review Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(issuedSSLResult.form)}
                  disabled={isGeneratingPdf}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1c1c1c] hover:bg-stone-800 text-white text-xs font-black shadow-md shadow-black/10 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download MCPS PDF'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyLink(issuedSSLResult.shareUrl)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Student Download Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIssuedSSLResult(null)}
                  className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors min-h-[40px]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISSUANCE MODAL: Same Rounding & Adjustment as SSL Form Generator with Cancel & X Buttons */}
      {issuingModalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl my-8 border border-slate-100 max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Header with Title and "X" Cancel Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {issuingModalState.actionType === 'sign_out_and_issue'
                      ? 'Sign-Out & Issue Official MCPS Form 560-51'
                      : 'Approve & Issue Official MCPS Form 560-51'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {issuingModalState.actionType === 'sign_out_and_issue'
                      ? 'Finalize active shift and issue certified SSL hours'
                      : 'Review requested checkout and issue certified SSL hours'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIssuingModalState(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Cancel and close"
                title="Cancel"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmIssuance} className="space-y-4">
              {/* Volunteer & Shift Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Student: {issuingModalState.session.volunteerName}</span>
                  <span className="font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {issuingModalState.session.sweId}
                  </span>
                </div>
                <p className="text-slate-500">
                  {issuingModalState.session.school || 'MCPS High School'} • {issuingModalState.session.facilityName}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600">
                  <span>Arrived: {formatTimeOnly(issuingModalState.session.checkInTime)}</span>
                  {issuingModalState.session.checkOutTime && (
                    <span>• Clicked Sign-Off: {formatTimeOnly(issuingModalState.session.checkOutTime)}</span>
                  )}
                  <span>• Activity: {issuingModalState.session.activityType}</span>
                </div>
              </div>

              {/* HOUR ROUNDING & ADJUSTMENT (Exact match with SSL Form Generator) */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>SSL Hours Calculation & Rounding</span>
                  </span>
                  <span className="text-xs font-extrabold text-emerald-900 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Final: {issuingCustomHours || roundHours(issuingModalState.rawHours, issuingRoundingMode)} SSL Hours
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Option 1: Round UP to Half Hour */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      issuingRoundingMode === 'ceil_half' && !issuingCustomHours
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30'
                        : 'bg-white/70 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="issuingRoundingMode"
                      value="ceil_half"
                      checked={issuingRoundingMode === 'ceil_half' && !issuingCustomHours}
                      onChange={() => {
                        setIssuingRoundingMode('ceil_half');
                        setIssuingCustomHours('');
                      }}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-bold text-stone-900">Round UP to Half Hour</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        e.g. 2.1h → <strong>2.5h</strong>, 3.6h → <strong>4.0h</strong>
                      </p>
                      <span className="text-[10px] text-orange-600 font-bold block mt-1">
                        Result: {roundHours(issuingModalState.rawHours, 'ceil_half')} hrs
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Round to Nearest Half Hour */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      issuingRoundingMode === 'round_half' && !issuingCustomHours
                        ? 'bg-white border-orange-600 ring-2 ring-orange-500/30'
                        : 'bg-white/70 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="issuingRoundingMode"
                      value="round_half"
                      checked={issuingRoundingMode === 'round_half' && !issuingCustomHours}
                      onChange={() => {
                        setIssuingRoundingMode('round_half');
                        setIssuingCustomHours('');
                      }}
                      className="mt-0.5 text-orange-600"
                    />
                    <div>
                      <p className="font-bold text-stone-900">Round to Nearest Half</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        e.g. 2.1h → <strong>2.0h</strong>, 2.3h → <strong>2.5h</strong>
                      </p>
                      <span className="text-[10px] text-orange-600 font-bold block mt-1">
                        Result: {roundHours(issuingModalState.rawHours, 'round_half')} hrs
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-orange-200/60 text-stone-600">
                  <span>Raw hours logged: <strong>{issuingModalState.rawHours} hrs</strong></span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-stone-500">Override:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder={roundHours(issuingModalState.rawHours, issuingRoundingMode).toString()}
                      value={issuingCustomHours}
                      onChange={(e) => setIssuingCustomHours(e.target.value)}
                      className="w-16 px-2 py-1 min-h-[32px] rounded border border-stone-300 text-xs font-bold text-right bg-white"
                    />
                    <span className="text-xs">hrs</span>
                  </div>
                </div>
              </div>

              {/* Section II Descriptions & Service Action */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 uppercase tracking-wider block">
                    Section II Form Descriptions & Service Action
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auto-fills MCPS Form 560-51
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-0.5">
                    Academic Preparation (Field 29a):
                  </label>
                  <select
                    value={academicPrepChoice}
                    onChange={(e) => setAcademicPrepChoice(e.target.value)}
                    className="w-full px-2.5 py-2 min-h-[40px] rounded-lg border border-stone-300 bg-white text-xs"
                  >
                    {ACADEMIC_PREPARATION_PRESETS.map((p) => (
                      <option key={p.id} value={p.text}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Service Action Type (MCPS Checkbox):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'DIRECT', label: 'Direct', sub: 'Hands-on client aid' },
                      { id: 'INDIRECT', label: 'Indirect', sub: 'Logistics/packing' },
                      { id: 'ADVOCACY', label: 'Advocacy', sub: 'Awareness/campaign' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setServiceTypeChoice(type.id as 'DIRECT' | 'INDIRECT' | 'ADVOCACY')}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          serviceTypeChoice === type.id
                            ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500/50'
                            : 'bg-white border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${serviceTypeChoice === type.id ? 'text-orange-950' : 'text-stone-800'}`}>
                            {type.label}
                          </span>
                          {serviceTypeChoice === type.id && (
                            <span className="text-orange-600 font-bold text-[10px]">✓</span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                          {type.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-0.5">
                    Service Activity Description (Field 29b):
                  </label>
                  <select
                    value={serviceActivityChoice}
                    onChange={(e) => setServiceActivityChoice(e.target.value)}
                    className="w-full px-2.5 py-2 min-h-[40px] rounded-lg border border-stone-300 bg-white text-xs"
                  >
                    {SERVICE_ACTIVITY_PRESETS.map((p) => (
                      <option key={p.id} value={p.text}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supervisor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-0.5">Supervisor Name</label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full px-2.5 py-2 min-h-[40px] rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-0.5">Supervisor Title</label>
                  <input
                    type="text"
                    value={supervisorTitle}
                    onChange={(e) => setSupervisorTitle(e.target.value)}
                    className="w-full px-2.5 py-2 min-h-[40px] rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-0.5">Supervisor Email</label>
                  <input
                    type="email"
                    value={supervisorEmail}
                    onChange={(e) => setSupervisorEmail(e.target.value)}
                    className="w-full px-2.5 py-2 min-h-[40px] rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-0.5">Supervisor Phone</label>
                  <input
                    type="tel"
                    value={supervisorPhone}
                    onChange={(e) => setSupervisorPhone(e.target.value)}
                    className="w-full px-2.5 py-2 min-h-[40px] rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              {/* Distribution Option */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Form Distribution Option
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDistributionMode('download_pdf')}
                    className={`p-2.5 min-h-[50px] rounded-xl border text-center transition-all ${
                      distributionMode === 'download_pdf'
                        ? 'border-orange-600 bg-orange-50 text-orange-950 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Download className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                    <span className="text-[11px] block">Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistributionMode('unique_link')}
                    className={`p-2.5 min-h-[50px] rounded-xl border text-center transition-all ${
                      distributionMode === 'unique_link'
                        ? 'border-orange-600 bg-orange-50 text-orange-950 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Copy className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                    <span className="text-[11px] block">Copy Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistributionMode('email')}
                    className={`p-2.5 min-h-[50px] rounded-xl border text-center transition-all ${
                      distributionMode === 'email'
                        ? 'border-orange-600 bg-orange-50 text-orange-950 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Mail className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                    <span className="text-[11px] block">Send to Email</span>
                  </button>
                </div>
              </div>

              {/* Bottom Action Buttons: Explicit Cancel button in case clicked by mistake! */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIssuingModalState(null)}
                  className="flex-1 min-h-[44px] py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 active:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 min-h-[44px] py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-orange-200" />
                  <span>
                    {issuingModalState.actionType === 'sign_out_and_issue'
                      ? 'Sign-Out & Issue Official MCPS Form 560-51'
                      : 'Approve & Issue Official MCPS Form 560-51'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local SSL Document Viewer Fallback */}
      {viewingForm && (
        <SSLDocumentView
          form={viewingForm}
          onClose={() => setViewingForm(null)}
          onCopyLink={(token) => handleCopyLink(`${window.location.origin}?ssl=${token}`)}
        />
      )}
    </div>
  );
}
