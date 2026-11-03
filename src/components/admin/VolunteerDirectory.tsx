import { useState, useMemo } from 'react';
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Edit2,
  FileCheck,
  GraduationCap,
  Mail,
  Phone,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { FormRequirement, Volunteer, VolunteerType } from '../../types';
import { formatDateTime } from '../../utils/hours';
import {
  getVolunteerTypeConfig,
  isVolunteerNeedingSSL,
  VOLUNTEER_TYPE_OPTIONS,
} from '../../utils/volunteerType';

interface VolunteerDirectoryProps {
  onIssueSSLForVolunteer: (volunteerId: string) => void;
}

export function VolunteerDirectory({ onIssueSSLForVolunteer }: VolunteerDirectoryProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'students_ssl' | 'adults' | 'other'>('all');

  // Edit Volunteer Type Modal State
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [editType, setEditType] = useState<VolunteerType>('student_ssl');
  const [editNeedsSSL, setEditNeedsSSL] = useState<boolean>(true);
  const [editFormReq, setEditFormReq] = useState<FormRequirement>('ssl_mcps');
  const [notification, setNotification] = useState<string | null>(null);

  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => storageService.getVolunteers());
  const allSessions = storageService.getSessions();

  const handleOpenEditModal = (vol: Volunteer) => {
    setEditingVolunteer(vol);
    const resolvedType = vol.volunteerType || (vol.needsSSL === false ? 'adult' : 'student_ssl');
    setEditType(resolvedType);
    setEditNeedsSSL(vol.needsSSL !== undefined ? vol.needsSSL : resolvedType === 'student_ssl');
    setEditFormReq(vol.formRequirement || (resolvedType === 'student_ssl' ? 'ssl_mcps' : 'none'));
  };

  const handleSaveVolunteerType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVolunteer) return;

    const updated = storageService.updateVolunteer(editingVolunteer.id, {
      volunteerType: editType,
      needsSSL: editNeedsSSL,
      formRequirement: editFormReq,
    });

    if (updated) {
      setVolunteers(storageService.getVolunteers());
      setNotification(`Updated ${updated.name}'s program to ${editType}.`);
      setTimeout(() => setNotification(null), 4000);
    }
    setEditingVolunteer(null);
  };

  const filtered = useMemo(() => {
    return volunteers.filter((v) => {
      // Type filter
      const isStudent = isVolunteerNeedingSSL(v);
      const isAdult = v.volunteerType === 'adult' || (!isStudent && v.volunteerType !== 'court_mandated' && v.volunteerType !== 'corporate');
      const isOther = v.volunteerType === 'court_mandated' || v.volunteerType === 'corporate' || v.volunteerType === 'other';

      if (typeFilter === 'students_ssl' && !isStudent) return false;
      if (typeFilter === 'adults' && (!isAdult || isStudent)) return false;
      if (typeFilter === 'other' && !isOther) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.sweId.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        (v.school && v.school.toLowerCase().includes(q))
      );
    });
  }, [volunteers, search, typeFilter]);

  const studentCount = volunteers.filter((v) => isVolunteerNeedingSSL(v)).length;
  const adultCount = volunteers.filter((v) => v.volunteerType === 'adult' || v.needsSSL === false).length;
  const otherCount = volunteers.length - studentCount - (adultCount > 0 && !volunteers.some(v => isVolunteerNeedingSSL(v) && v.volunteerType === 'adult') ? adultCount : 0);

  const getSessionsForVol = (volId: string) => {
    return allSessions.filter((s) => s.volunteerId === volId);
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Registered Volunteer Directory ({volunteers.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student SSL profiles, adult community volunteers, and custom program requirements.
            </p>
          </div>

          <div className="relative sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, school, or email..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-orange-500 min-h-[44px]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>

        {/* Filter Pills for Volunteer Program Category */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Filter:
          </span>
          {[
            { id: 'all', label: `All Volunteers (${volunteers.length})` },
            { id: 'students_ssl', label: `🎓 Students (Needs SSL) (${studentCount})` },
            { id: 'adults', label: `👤 Adult Volunteers (${adultCount})` },
            { id: 'other', label: `⚖️ Other Forms / Programs` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id as any)}
              className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition-all ${
                typeFilter === tab.id
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Volunteer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">No Volunteers Found</h4>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or switching the category filter above.
            </p>
          </div>
        ) : (
          filtered.map((vol) => {
            const sessions = getSessionsForVol(vol.id);
            const approvedCount = sessions.filter((s) => s.checkOutStatus === 'approved').length;
            const cfg = getVolunteerTypeConfig(vol.volunteerType, vol.needsSSL);
            const needsSSL = isVolunteerNeedingSSL(vol);

            return (
              <div
                key={vol.id}
                className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs hover:border-orange-300 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-stone-900 text-base sm:text-lg">
                          {vol.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-orange-50 text-orange-900 border border-orange-200">
                          {vol.sweId}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.badgeClass}`}>
                          {cfg.badge}
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 flex-wrap">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span>{vol.email}</span>
                        {volunteers.filter((v) => v.email.toLowerCase() === vol.email.toLowerCase()).length > 1 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            <Users className="w-3 h-3 text-amber-600" />
                            <span>Family Account</span>
                          </span>
                        )}
                      </p>

                      {vol.school ? (
                        <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                          <span>{vol.school} {vol.grade && `• ${vol.grade}`}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>{needsSSL ? 'School not specified' : 'Adult Community Volunteer'}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black text-orange-600">
                        {vol.totalHours}
                      </span>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">
                        Verified Hours
                      </p>
                    </div>
                  </div>

                  {/* Program Indicator Banner */}
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-stone-500 font-medium">Program: </span>
                      <span className="font-bold text-stone-800">{cfg.shortLabel}</span>
                      <span className="text-stone-400 text-[11px] block mt-0.5">
                        {needsSSL ? 'Requires MCPS SSL Form 560-51' : 'General service hours (No SSL form needed)'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(vol)}
                      className="px-2.5 py-1 min-h-[32px] rounded-lg border border-stone-300 hover:bg-white text-stone-700 text-xs font-semibold flex items-center gap-1"
                      title="Change volunteer category or form requirement"
                    >
                      <Edit2 className="w-3 h-3 text-stone-500" />
                      <span>Edit Program</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-stone-500">
                    {approvedCount} completed shifts • Reg: {vol.createdAt.split('T')[0]}
                  </span>

                  <button
                    type="button"
                    onClick={() => onIssueSSLForVolunteer(vol.id)}
                    className={`min-h-[40px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors self-start sm:self-auto ${
                      needsSSL
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{needsSSL ? 'Issue SSL Form' : 'Issue SSL / Letter'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Volunteer Program / Form Modal */}
      {editingVolunteer && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg">
                  Edit Volunteer Program & Form
                </h3>
                <p className="text-xs text-stone-500">
                  {editingVolunteer.name} • {editingVolunteer.sweId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVolunteer(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVolunteerType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Volunteer Category
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {VOLUNTEER_TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                        editType === opt.id
                          ? 'border-orange-500 bg-orange-50/70 ring-1 ring-orange-500/30'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="editType"
                            checked={editType === opt.id}
                            onChange={() => {
                              setEditType(opt.id);
                              setEditNeedsSSL(opt.needsSSL);
                              setEditFormReq(opt.defaultFormRequirement);
                            }}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <span className="font-bold text-xs text-stone-900">{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 pl-5">{opt.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${opt.badgeClass}`}>
                        {opt.shortLabel}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Requirement Toggle */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800">Requires SSL Verification Form?</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editNeedsSSL}
                      onChange={(e) => setEditNeedsSSL(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <span className="font-bold text-stone-700">{editNeedsSSL ? 'Yes (SSL Required)' : 'No (Adult/General)'}</span>
                  </label>
                </div>
                <p className="text-[11px] text-stone-500">
                  {editNeedsSSL
                    ? 'Student will be included in MCPS SSL Form 560-51 issuance and checkout queues.'
                    : 'Volunteer will log general service hours without requiring MCPS SSL Form 560-51.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingVolunteer(null)}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
