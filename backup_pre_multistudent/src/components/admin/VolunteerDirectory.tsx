import { useState } from 'react';
import {
  Award,
  Calendar,
  FileCheck,
  GraduationCap,
  Mail,
  Phone,
  Search,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { Volunteer } from '../../types';
import { formatDateTime } from '../../utils/hours';

interface VolunteerDirectoryProps {
  onIssueSSLForVolunteer: (volunteerId: string) => void;
}

export function VolunteerDirectory({ onIssueSSLForVolunteer }: VolunteerDirectoryProps) {
  const [search, setSearch] = useState('');
  const [selectedVol, setSelectedVol] = useState<Volunteer | null>(null);

  const volunteers = storageService.getVolunteers();
  const allSessions = storageService.getSessions();

  const filtered = volunteers.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.sweId.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      (v.school && v.school.toLowerCase().includes(q))
    );
  });

  const getSessionsForVol = (volId: string) => {
    return allSessions.filter((s) => s.volunteerId === volId);
  };

  return (
    <div className="space-y-6">
      {/* Top Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">
            Registered Volunteer Directory ({volunteers.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Search student profiles, unique SWE IDs, and lifetime service hours.
          </p>
        </div>

        <div className="relative sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, school, or email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Volunteer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((vol) => {
          const sessions = getSessionsForVol(vol.id);
          const approvedCount = sessions.filter((s) => s.checkOutStatus === 'approved').length;

          return (
            <div
              key={vol.id}
              className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs hover:border-orange-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-stone-900 text-base sm:text-lg">
                      {vol.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-orange-50 text-orange-900 border border-orange-200">
                      {vol.sweId}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{vol.email}</span>
                  </p>

                  {vol.school && (
                    <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                      <span>{vol.school} {vol.grade && `• ${vol.grade}`}</span>
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-orange-600">
                    {vol.totalHours}
                  </span>
                  <p className="text-[10px] text-stone-400 uppercase font-bold">
                    Verified Hours
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-stone-500">
                  {approvedCount} completed shifts • Reg: {vol.createdAt.split('T')[0]}
                </span>

                <button
                  type="button"
                  onClick={() => onIssueSSLForVolunteer(vol.id)}
                  className="min-h-[40px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
                >
                  <FileCheck className="w-3.5 h-3.5 text-orange-200" />
                  <span>Issue SSL</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
