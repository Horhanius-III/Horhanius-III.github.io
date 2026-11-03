import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Archive,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileCheck,
  FileEdit,
  FileText,
  Filter,
  History,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import {
  ACADEMIC_PREPARATION_PRESETS,
  SERVICE_ACTIVITY_PRESETS,
} from '../../data/sslPresets';
import { storageService } from '../../services/storage';
import { FormSection2Template, ServiceSession, SSLForm, Volunteer } from '../../types';
import {
  formatDateTime,
  formatHoursVerbose,
  HourRoundingMode,
  roundHours,
} from '../../utils/hours';
import { populateOriginalMcpsFormPdf } from '../../utils/pdfGenerator';
import { SSLDocumentView } from './SSLDocumentView';
import { SSLTemplateCustomizer } from './SSLTemplateCustomizer';
import { getVolunteerTypeConfig, isVolunteerNeedingSSL } from '../../utils/volunteerType';

interface SSLFormGeneratorProps {
  adminName: string;
  adminEmail: string;
}

export function SSLFormGenerator({ adminName, adminEmail }: SSLFormGeneratorProps) {
  // Main view switcher
  const [activeView, setActiveView] = useState<'checkout_list' | 'customize_section2'>('checkout_list');

  // Checkout list filters
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_issued' | 'issued'>('all');
  const [programFilter, setProgramFilter] = useState<'ssl_only' | 'all'>('ssl_only');

  // Certified Forms Table filters (default to today only for high-volume scale)
  const [formsViewMode, setFormsViewMode] = useState<'today' | 'all'>('today');
  const [formsSearchQuery, setFormsSearchQuery] = useState('');

  // Issuance Wizard State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [roundingMode, setRoundingMode] = useState<HourRoundingMode>('ceil_half');
  const [customAdjustedHours, setCustomAdjustedHours] = useState<string>('');

  const [supervisorName, setSupervisorName] = useState(adminName || 'Sarah Jenkins');
  const [supervisorTitle, setSupervisorTitle] = useState('Director of Volunteer Operations');
  const [supervisorEmail, setSupervisorEmail] = useState(adminEmail || 'sjenkins@sowhatelse.org');
  const [supervisorPhone, setSupervisorPhone] = useState('(240) 668-4500');

  // Section II Preset selections
  const activeTemplate = storageService.getSection2Template();
  const [academicPrepChoice, setAcademicPrepChoice] = useState<string>(
    activeTemplate.academicPreparationText || ''
  );
  const [serviceActivityChoice, setServiceActivityChoice] = useState<string>(
    activeTemplate.activityDescriptionText || ''
  );
  const [serviceTypeChoice, setServiceTypeChoice] = useState<'DIRECT' | 'INDIRECT' | 'ADVOCACY'>(
    activeTemplate.serviceType || 'DIRECT'
  );

  // Distribution method
  const [distributionMode, setDistributionMode] = useState<'download_pdf' | 'unique_link' | 'email'>('download_pdf');

  // Replacement / Resend Drawer State
  const [replacementForm, setReplacementForm] = useState<SSLForm | null>(null);
  const [isEditingReplacementHours, setIsEditingReplacementHours] = useState(false);
  const [replacementHoursOverride, setReplacementHoursOverride] = useState('');

  const handleOpenReplacementModal = (form: SSLForm) => {
    setReplacementForm(form);
    setIsEditingReplacementHours(false);
    setReplacementHoursOverride(form.totalVerifiedHours.toString());
  };

  // Active viewing/downloading state
  const [viewingForm, setViewingForm] = useState<SSLForm | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const volunteers = storageService.getVolunteers();
  const allSessions = storageService.getSessions();
  const allSslForms = storageService.getSSLForms();

  // All approved/checked-out sessions
  const checkedOutSessions = useMemo(() => {
    return allSessions.filter((s) => s.checkOutStatus === 'approved');
  }, [allSessions]);

  // Filter checked-out sessions by time & search
  const filteredCheckoutSessions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return checkedOutSessions.filter((s) => {
      const sessionDateStr = (s.checkOutTime || s.checkInTime).split('T')[0];
      const sessionDate = new Date(s.checkOutTime || s.checkInTime);

      // Time filter
      if (timeFilter === 'today' && sessionDateStr !== todayStr) {
        return false;
      }
      if (timeFilter === 'week' && sessionDate < oneWeekAgo) {
        return false;
      }
      if (timeFilter === 'month' && sessionDate < oneMonthAgo) {
        return false;
      }

      // Status filter
      if (statusFilter === 'not_issued' && s.sslFormId) {
        return false;
      }
      if (statusFilter === 'issued' && !s.sslFormId) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.volunteerName.toLowerCase().includes(q);
        const matchSwe = s.sweId.toLowerCase().includes(q);
        const matchEmail = s.volunteerEmail.toLowerCase().includes(q);
        const matchSchool = (s.school || '').toLowerCase().includes(q);
        const matchDate = sessionDateStr.includes(q);
        if (!matchName && !matchSwe && !matchEmail && !matchSchool && !matchDate) {
          return false;
        }
      }

      return true;
    });
  }, [checkedOutSessions, timeFilter, statusFilter, searchQuery]);

  // Group filtered sessions by Volunteer for clean multi-day view
  const volunteerCheckoutGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        volunteer: Volunteer;
        sessions: ServiceSession[];
      }
    > = {};

    filteredCheckoutSessions.forEach((sess) => {
      const vol =
        volunteers.find((v) => v.id === sess.volunteerId) || {
          id: sess.volunteerId,
          sweId: sess.sweId,
          name: sess.volunteerName,
          email: sess.volunteerEmail,
          school: sess.school,
          grade: sess.grade,
          totalHours: sess.totalHours,
          sessionCount: 1,
          createdAt: sess.createdAt,
          authMethod: 'kiosk' as const,
        };

      if (!groups[sess.volunteerId]) {
        groups[sess.volunteerId] = {
          volunteer: vol,
          sessions: [],
        };
      }
      groups[sess.volunteerId].sessions.push(sess);
    });

    let result = Object.values(groups);
    if (programFilter === 'ssl_only') {
      result = result.filter((g) => isVolunteerNeedingSSL(g.volunteer));
    }
    return result;
  }, [filteredCheckoutSessions, volunteers, programFilter]);

  // Certified Forms filtered (Today only by default, or all historical)
  const displaySslForms = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return allSslForms.filter((form) => {
      // If today mode and not searching, filter by today
      if (formsViewMode === 'today' && !formsSearchQuery.trim()) {
        const formDateStr = form.createdAt.split('T')[0];
        if (formDateStr !== todayStr) return false;
      }

      // Search filter
      if (formsSearchQuery.trim()) {
        const q = formsSearchQuery.toLowerCase();
        const matchName = form.studentName.toLowerCase().includes(q);
        const matchSwe = form.sweId.toLowerCase().includes(q);
        const matchId = form.id.toLowerCase().includes(q);
        const matchEmail = form.studentEmail.toLowerCase().includes(q);
        if (!matchName && !matchSwe && !matchId && !matchEmail) return false;
      }

      return true;
    });
  }, [allSslForms, formsViewMode, formsSearchQuery]);

  // Today forms count
  const todayFormsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return allSslForms.filter((f) => f.createdAt.split('T')[0] === todayStr).length;
  }, [allSslForms]);

  // Calculate raw vs rounded hours for issuance
  const selectedSessionsData = useMemo(() => {
    if (!selectedVolunteer) return { rawHours: 0, rounded: 0, daysCount: 0 };
    const sessions = allSessions.filter((s) => selectedSessionIds.includes(s.id));
    const rawHours = Math.round(sessions.reduce((acc, s) => acc + s.totalHours, 0) * 100) / 100;
    const rounded = roundHours(rawHours, roundingMode);
    return {
      rawHours,
      rounded,
      daysCount: Math.max(1, sessions.length),
    };
  }, [allSessions, selectedVolunteer, selectedSessionIds, roundingMode]);

  // Open Issue Wizard for specific volunteer & pre-selected sessions
  const handleOpenIssueForVolunteer = (vol: Volunteer, initialSessionIds: string[]) => {
    setSelectedVolunteer(vol);
    setSelectedSessionIds(initialSessionIds);
    setRoundingMode('ceil_half');
    setCustomAdjustedHours('');
    const tmpl = storageService.getSection2Template();
    setAcademicPrepChoice(tmpl.academicPreparationText || '');
    setServiceActivityChoice(tmpl.activityDescriptionText || '');
    setServiceTypeChoice(tmpl.serviceType || 'DIRECT');
    setShowIssueModal(true);
  };

  const handleToggleSessionCheckbox = (sessionId: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolunteer || selectedSessionIds.length === 0) return;

    // Use custom hours if manually edited, otherwise use selected rounded hours
    const finalHours = customAdjustedHours.trim()
      ? parseFloat(customAdjustedHours)
      : selectedSessionsData.rounded;

    const newForm = storageService.createSSLForm({
      volunteerId: selectedVolunteer.id,
      sessionIds: selectedSessionIds,
      supervisorName,
      supervisorTitle,
      supervisorEmail,
      supervisorPhone,
      activityDescription: serviceActivityChoice,
      customHours: finalHours,
      academicPreparationText: academicPrepChoice,
      serviceType: serviceTypeChoice,
    });

    if (distributionMode === 'email') {
      storageService.updateSSLStatus(newForm.id, 'emailed');
      setNotification(`Official MCPS SSL form emailed to ${newForm.studentEmail}!`);
    } else if (distributionMode === 'unique_link') {
      const shareUrl = `${window.location.origin}?ssl=${newForm.shareToken}`;
      navigator.clipboard?.writeText(shareUrl);
      setNotification(`Shareable download link copied to clipboard!`);
    } else {
      const templateToUse: FormSection2Template = {
        ...activeTemplate,
        academicPreparationText: academicPrepChoice,
        activityDescriptionText: serviceActivityChoice,
        serviceType: serviceTypeChoice,
      };
      await populateOriginalMcpsFormPdf(newForm, templateToUse, true);
      setViewingForm(newForm);
      setNotification(`Official MCPS Form 560-51 PDF generated and downloaded!`);
    }

    setShowIssueModal(false);
    setSelectedVolunteer(null);
    setSelectedSessionIds([]);
    setTimeout(() => setNotification(null), 6000);
  };

  const handleDirectDownloadMcpsPdf = async (form: SSLForm) => {
    setDownloadingId(form.id);
    try {
      const template = storageService.getSection2Template();
      await populateOriginalMcpsFormPdf(form, template, true);
      setNotification(`MCPS Form 560-51 downloaded for ${form.studentName}`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to download MCPS PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}?ssl=${token}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedToken(token);
    setNotification(`Shareable student link copied to clipboard!`);
    setTimeout(() => {
      setCopiedToken(null);
      setNotification(null);
    }, 4000);
  };

  const handleResendEmail = (form: SSLForm) => {
    storageService.updateSSLStatus(form.id, 'emailed');
    setNotification(`Verification link & PDF resent to ${form.studentEmail}!`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Student Service Learning (SSL) Management
            </h3>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800">
              MCPS Form 560-51
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse volunteer check-outs, issue new/replacement SSL forms with hour rounding, and generate official MCPS Form 560-51 PDFs.
          </p>
        </div>

        {/* Top View Switchers */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView(activeView === 'checkout_list' ? 'customize_section2' : 'checkout_list')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all border ${
              activeView === 'customize_section2'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>
              {activeView === 'customize_section2'
                ? 'Back to SSL Dashboard'
                : 'Customize Section II Descriptions'}
            </span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-800 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* RENDER SECTION II CUSTOMIZER VIEW */}
      {activeView === 'customize_section2' ? (
        <SSLTemplateCustomizer
          adminName={adminName}
          onClose={() => setActiveView('checkout_list')}
        />
      ) : (
        <>
          {/* =========================================================================
              SECTION 1: VOLUNTEER CHECK-OUTS LIST (Day, Week, Month, Search, Day Select)
              ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Volunteer Check-Outs Ready for SSL Issuance</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filter by date, select specific days, and issue new or replacement SSL forms.
                </p>
              </div>

              {/* Time Period Tabs: Day, Week, Month, All */}
              <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200 self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setTimeFilter('today')}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg font-bold transition-all ${
                    timeFilter === 'today'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('week')}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg font-bold transition-all ${
                    timeFilter === 'week'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('month')}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg font-bold transition-all ${
                    timeFilter === 'month'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('all')}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg font-bold transition-all ${
                    timeFilter === 'all'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All Dates
                </button>
              </div>
            </div>

            {/* Program & Status Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1">Volunteers:</span>
                <button
                  type="button"
                  onClick={() => setProgramFilter('ssl_only')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[36px] transition-all flex items-center gap-1.5 ${
                    programFilter === 'ssl_only'
                      ? 'bg-[#E05A47] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-orange-200'
                  }`}
                >
                  🎓 Students Needing SSL
                </button>
                <button
                  type="button"
                  onClick={() => setProgramFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[36px] transition-all flex items-center gap-1.5 ${
                    programFilter === 'all'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
                  }`}
                >
                  All Volunteers (Inc. Adults)
                </button>
              </div>
            </div>

            {/* Search & Status Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search volunteer name, SWE ID, school, or service date..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="all">All Check-Outs (Issued & Unissued)</option>
                  <option value="not_issued">Only Not Issued Yet (Pending SSL)</option>
                  <option value="issued">Only Previously Issued (Replacement)</option>
                </select>
              </div>
            </div>

            {/* Volunteers & Check-out Days Feed */}
            {volunteerCheckoutGroups.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-1">
                <p className="font-semibold text-slate-600">No checked-out sessions found for this filter.</p>
                <p>Try switching to "This Week" or "All Dates", or toggle "All Volunteers (Inc. Adults)".</p>
              </div>
            ) : (
              <div className="space-y-4">
                {volunteerCheckoutGroups.map(({ volunteer, sessions }) => {
                  const unissuedSessions = sessions.filter((s) => !s.sslFormId);
                  const issuedSessions = sessions.filter((s) => Boolean(s.sslFormId));
                  const typeCfg = getVolunteerTypeConfig(volunteer.volunteerType, volunteer.needsSSL);

                  return (
                    <div
                      key={volunteer.id}
                      className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-emerald-300 transition-colors bg-white space-y-3"
                    >
                      {/* Volunteer Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-base">
                              {volunteer.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {volunteer.sweId}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${typeCfg.bgColor} ${typeCfg.textColor} ${typeCfg.borderColor}`}>
                              {typeCfg.badge}
                            </span>
                            {volunteer.school && (
                              <span className="text-xs text-slate-500 hidden sm:inline">
                                • {volunteer.school} {volunteer.grade && `(${volunteer.grade})`}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {volunteer.email} • {sessions.length} shift{sessions.length > 1 ? 's' : ''} in timeframe
                          </p>
                        </div>

                        {/* Quick Action Button for Volunteer */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {unissuedSessions.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenIssueForVolunteer(
                                  volunteer,
                                  unissuedSessions.map((s) => s.id)
                                )
                              }
                              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Issue SSL ({unissuedSessions.length} day{unissuedSessions.length > 1 ? 's' : ''})</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Individual Days / Sessions Table */}
                      <div className="divide-y divide-stone-100 text-xs">
                        {sessions.map((session) => {
                          const dateOnly = (session.checkOutTime || session.checkInTime).split('T')[0];
                          const isIssued = Boolean(session.sslFormId);
                          const linkedForm = isIssued
                            ? allSslForms.find((f) => f.id === session.sslFormId)
                            : undefined;

                          return (
                            <div
                              key={session.id}
                              className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-bold text-stone-800 w-24">
                                  {dateOnly}
                                </span>
                                <span className="text-stone-500">
                                  {session.facilityName.replace('Community Food Pantry', 'Pantry').replace('Warehouse & Main Food Hub', 'Warehouse')}
                                </span>
                                <span className="font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                                  {session.certifiedHours !== undefined
                                    ? `${session.certifiedHours} SSL hrs certified`
                                    : `${session.totalHours} hrs logged`}
                                </span>
                                {session.certifiedHours !== undefined && session.certifiedHours !== session.totalHours && (
                                  <span className="text-[10px] text-orange-600 font-medium hidden sm:inline">
                                    (rounded from {session.totalHours}h)
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                {isIssued ? (
                                  <>
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                      ✓ SSL Issued
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (linkedForm) {
                                          handleOpenReplacementModal(linkedForm);
                                        } else {
                                          // Open replacement issuance
                                          handleOpenIssueForVolunteer(volunteer, [session.id]);
                                        }
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-[11px]"
                                      title="Student lost or not received form? Resend or generate replacement."
                                    >
                                      <RefreshCw className="w-3 h-3 text-stone-500" />
                                      <span>Replacement / Resend</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                                      Needs SSL Form
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenIssueForVolunteer(volunteer, [session.id])
                                      }
                                      className="flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-950 font-bold text-[11px] border border-orange-200 transition-colors"
                                    >
                                      <span>Issue for this Day</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* =========================================================================
              SECTION 2: CERTIFIED MCPS SSL FORMS (Optimized for Thousands of Forms)
              Default: ONLY show today's generated forms. Search allows historical lookup.
              ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Certified MCPS SSL Forms
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {formsViewMode === 'today' ? `Today's (${todayFormsCount})` : `All (${allSslForms.length})`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {formsViewMode === 'today'
                    ? "Displaying forms issued today. High-volume mode keeps loading fast."
                    : "Displaying historical database archive of generated SSL forms."}
                </p>
              </div>

              {/* View Mode Toggle: Today (Default) vs Search All */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setFormsViewMode(formsViewMode === 'today' ? 'all' : 'today');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    formsViewMode === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{formsViewMode === 'all' ? 'Switch to Today Only' : 'Show All Historical'}</span>
                </button>
              </div>
            </div>

            {/* Instant Search Bar for Certified Forms */}
            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  value={formsSearchQuery}
                  onChange={(e) => setFormsSearchQuery(e.target.value)}
                  placeholder="Search forms by student name, SWE ID, or Form Ref..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Forms Table */}
            {displaySslForms.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">
                  {formsViewMode === 'today'
                    ? "No SSL forms have been issued today yet."
                    : "No forms found matching your search."}
                </p>
                <p>
                  To issue a form for a student today, select them from the check-outs list above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displaySslForms.map((form) => {
                  const isCopied = copiedToken === form.shareToken;
                  const isDownloading = downloadingId === form.id;

                  return (
                    <div
                      key={form.id}
                      className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">
                            {form.studentName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {form.sweId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white">
                            {form.totalVerifiedHours} SSL Hours
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Issued: {form.createdAt.split('T')[0]}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500">
                          {form.school || 'MCPS High School'} • Service: {form.dateRange.start} to {form.dateRange.end}
                        </p>

                        <p className="text-xs text-slate-400">
                          Supervisor: <span className="text-slate-700 font-medium">{form.supervisorName}</span> • Email: {form.studentEmail}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(form.shareToken)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold shadow-xs"
                          title="Copy student self-download link"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Link Copied' : 'Share Link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDirectDownloadMcpsPdf(form)}
                          disabled={isDownloading}
                          className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold shadow-xs transition-all"
                          title="Download official MCPS Form 560-51 PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isDownloading ? 'Generating...' : 'Download MCPS 560-51 PDF'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewingForm(form)}
                          className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#1c1c1c] hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Document</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================================================
          ISSUE NEW / REPLACEMENT SSL FORM MODAL (with Hour Rounding Options)
          ========================================================================= */}
      {showIssueModal && selectedVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl my-8 border border-slate-100 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  Issue Official MCPS Form 560-51
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              {/* Volunteer Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Student: {selectedVolunteer.name}</span>
                  <span className="font-mono text-emerald-700">{selectedVolunteer.sweId}</span>
                </div>
                <p className="text-slate-500">
                  {selectedVolunteer.school || 'MCPS High School'} • {selectedVolunteer.email}
                </p>
              </div>

              {/* Service Days Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Select Service Days to Certify ({selectedSessionIds.length} selected)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
                  {allSessions
                    .filter((s) => s.volunteerId === selectedVolunteer.id && s.checkOutStatus === 'approved')
                    .map((s) => {
                      const dateOnly = (s.checkOutTime || s.checkInTime).split('T')[0];
                      const isChecked = selectedSessionIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-2.5 text-xs p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-emerald-300"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSessionCheckbox(s.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <div className="flex-1 flex justify-between">
                            <span className="font-semibold text-slate-800">{dateOnly}</span>
                            <span className="text-slate-500">{s.totalHours} hrs • {s.activityType}</span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* HOUR ROUNDING OPTIONS (Requested by user) */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>2. SSL Hours Calculation & Rounding</span>
                  </span>
                  <span className="text-xs font-extrabold text-emerald-900 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Final: {customAdjustedHours || selectedSessionsData.rounded} SSL Hours
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Option 1: Round UP to Half Hour */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      roundingMode === 'ceil_half' && !customAdjustedHours
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30'
                        : 'bg-white/70 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roundingMode"
                      value="ceil_half"
                      checked={roundingMode === 'ceil_half' && !customAdjustedHours}
                      onChange={() => {
                        setRoundingMode('ceil_half');
                        setCustomAdjustedHours('');
                      }}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-bold text-stone-900">Round UP to Half Hour</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        e.g. 2.1h → <strong>2.5h</strong>, 3.6h → <strong>4.0h</strong>
                      </p>
                      <span className="text-[10px] text-orange-600 font-bold block mt-1">
                        Result: {roundHours(selectedSessionsData.rawHours, 'ceil_half')} hrs
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Round to Nearest Half Hour */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      roundingMode === 'round_half' && !customAdjustedHours
                        ? 'bg-white border-orange-600 ring-2 ring-orange-500/30'
                        : 'bg-white/70 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roundingMode"
                      value="round_half"
                      checked={roundingMode === 'round_half' && !customAdjustedHours}
                      onChange={() => {
                        setRoundingMode('round_half');
                        setCustomAdjustedHours('');
                      }}
                      className="mt-0.5 text-orange-600"
                    />
                    <div>
                      <p className="font-bold text-stone-900">Round to Nearest Half</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        e.g. 2.1h → <strong>2.0h</strong>, 2.3h → <strong>2.5h</strong>
                      </p>
                      <span className="text-[10px] text-orange-600 font-bold block mt-1">
                        Result: {roundHours(selectedSessionsData.rawHours, 'round_half')} hrs
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-orange-200/60 text-stone-600">
                  <span>Raw hours logged: <strong>{selectedSessionsData.rawHours} hrs</strong></span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-stone-500">Override:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder={selectedSessionsData.rounded.toString()}
                      value={customAdjustedHours}
                      onChange={(e) => setCustomAdjustedHours(e.target.value)}
                      className="w-16 px-2 py-1 min-h-[32px] rounded border border-stone-300 text-xs font-bold text-right bg-white"
                    />
                    <span className="text-xs">hrs</span>
                  </div>
                </div>
              </div>

              {/* Section II Description dropdowns */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 uppercase tracking-wider block">
                    3. Section II Form Descriptions & Service Action
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
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-0.5">Supervisor Name</label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full px-2.5 py-2 min-h-[40px] rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-0.5">Supervisor Title</label>
                  <input
                    type="text"
                    value={supervisorTitle}
                    onChange={(e) => setSupervisorTitle(e.target.value)}
                    className="w-full px-2.5 py-2 min-h-[40px] rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              {/* Distribution Toggle */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  4. Form Distribution Option
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
                    <Share2 className="w-4 h-4 mx-auto mb-1 text-orange-600" />
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

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 min-h-[44px] py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedSessionIds.length === 0}
                  className="flex-2 min-h-[44px] py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition-all"
                >
                  Generate Official MCPS Form 560-51
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPLACEMENT / RESEND MODAL (For lost or unreceived forms)
          ========================================================================= */}
      {replacementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Re-issue / Replacement SSL Form
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReplacementForm(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50/80 rounded-2xl text-xs space-y-1.5 border border-emerald-200">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Student: {replacementForm.studentName}</span>
                <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {replacementForm.sweId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">
                  Certified Hours: <strong className="text-emerald-900 text-sm font-extrabold">{replacementForm.totalVerifiedHours} hrs</strong>
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-emerald-800 border border-emerald-200">
                  ✓ Saved in Database
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Dates: {replacementForm.dateRange.start} to {replacementForm.dateRange.end} • Ref: {replacementForm.id}
              </p>
            </div>

            {/* Adjust Hours for Re-issuance (Optional) */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved SSL Hours</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingReplacementHours(!isEditingReplacementHours)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  {isEditingReplacementHours ? 'Cancel Edit' : 'Adjust Hours'}
                </button>
              </div>

              {isEditingReplacementHours ? (
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <p className="text-[11px] text-slate-600">
                    Update the official hours for this student's certificate:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={replacementHoursOverride}
                      onChange={(e) => setReplacementHoursOverride(e.target.value)}
                      placeholder={replacementForm.totalVerifiedHours.toString()}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs text-right"
                    />
                    <span className="text-xs text-slate-600">SSL Hours</span>

                    <button
                      type="button"
                      onClick={() => {
                        const newH = parseFloat(replacementHoursOverride);
                        if (!isNaN(newH) && newH > 0) {
                          const updated = storageService.updateSSLFormHours(
                            replacementForm.id,
                            newH,
                            adminName
                          );
                          if (updated) {
                            setReplacementForm(updated);
                            setIsEditingReplacementHours(false);
                            setNotification(`Updated saved SSL hours to ${newH} hrs!`);
                            setTimeout(() => setNotification(null), 4000);
                          }
                        }
                      }}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      Save & Apply
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const raw = replacementForm.totalVerifiedHours;
                        const rounded = Math.ceil(raw * 2) / 2;
                        setReplacementHoursOverride(rounded.toString());
                      }}
                      className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 font-medium"
                    >
                      Round UP to 0.5h
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const raw = replacementForm.totalVerifiedHours;
                        const rounded = Math.round(raw * 2) / 2;
                        setReplacementHoursOverride(rounded.toString());
                      }}
                      className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 font-medium"
                    >
                      Round to Nearest 0.5h
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Re-issued forms automatically use the <strong>{replacementForm.totalVerifiedHours} hours</strong> certified on initial issuance. Click "Adjust Hours" if you need to modify it.
                </p>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Deliver replacement to student:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleCopyLink(replacementForm.shareToken);
                  setReplacementForm(null);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>Copy Direct Download Link for Student</span>
                </div>
                <span className="text-emerald-700 text-[11px]">Copy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleResendEmail(replacementForm);
                  setReplacementForm(null);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>Resend Link & Form to {replacementForm.studentEmail}</span>
                </div>
                <span className="text-emerald-700 text-[11px]">Send</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDirectDownloadMcpsPdf(replacementForm);
                  setReplacementForm(null);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Download Replacement MCPS Form 560-51 PDF</span>
                </div>
                <span className="text-[11px]">PDF</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setReplacementForm(null)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* SSL Printable Document Viewer Modal */}
      {viewingForm && (
        <SSLDocumentView
          form={viewingForm}
          onClose={() => setViewingForm(null)}
          onCopyLink={handleCopyLink}
        />
      )}
    </div>
  );
}
