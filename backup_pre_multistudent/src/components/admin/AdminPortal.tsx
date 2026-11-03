import { useState, useEffect } from 'react';
import {
  BarChart3,
  FileCheck,
  History,
  Lock,
  LogOut,
  RotateCcw,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ApprovalQueue } from './ApprovalQueue';
import { AuditTrailView } from './AuditTrailView';
import { SSLFormGenerator } from './SSLFormGenerator';
import { VolunteerDirectory } from './VolunteerDirectory';

interface AdminPortalProps {
  onViewSSLForm?: (formId: string) => void;
}

export function AdminPortal({ onViewSSLForm }: AdminPortalProps) {
  // Current admin login session (default to Super Admin swewebapp@gmail.com)
  const [currentAdmin, setCurrentAdmin] = useState<{
    email: string;
    name: string;
    role: 'super_admin' | 'admin';
  }>({
    email: 'swewebapp@gmail.com',
    name: 'Super Admin (So What Else)',
    role: 'super_admin',
  });

  const [activeSubTab, setActiveSubTab] = useState<
    'approvals' | 'directory' | 'ssl' | 'analytics' | 'audit'
  >('approvals');

  const [sessions, setSessions] = useState(() => storageService.getSessions());

  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setSessions(storageService.getSessions());
    });
    return unsubscribe;
  }, []);

  const pendingCount = sessions.filter(
    (s) => s.checkInStatus === 'pending' || s.checkOutStatus === 'pending'
  ).length;

  const handleResetData = () => {
    if (confirm('Reset database back to initial seed data?')) {
      storageService.resetToDefault();
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Top Status Bar */}
      <div className="bg-[#1c1c1c] text-white rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-stone-800">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
            alt="So What Else"
            className="w-11 h-11 rounded-xl object-contain bg-black border border-stone-800 shrink-0 shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-white text-base">
                {currentAdmin.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-400/30">
                {currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Staff Admin'}
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono mt-0.5 truncate">
              {currentAdmin.email}
            </p>
          </div>
        </div>

        {/* Admin Account Switcher for Testing */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs flex-wrap">
          <span className="text-stone-400 text-[11px] hidden md:inline font-medium">Switch Admin:</span>
          <button
            type="button"
            onClick={() =>
              setCurrentAdmin({
                email: 'swewebapp@gmail.com',
                name: 'Super Admin (So What Else)',
                role: 'super_admin',
              })
            }
            className={`min-h-[36px] px-3 py-1.5 rounded-lg transition-colors font-bold ${
              currentAdmin.email === 'swewebapp@gmail.com'
                ? 'bg-orange-600 text-white'
                : 'bg-white/10 text-stone-300 hover:bg-white/20'
            }`}
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentAdmin({
                email: 'sjenkins@sowhatelse.org',
                name: 'Sarah Jenkins',
                role: 'admin',
              })
            }
            className={`min-h-[36px] px-3 py-1.5 rounded-lg transition-colors font-bold ${
              currentAdmin.email === 'sjenkins@sowhatelse.org'
                ? 'bg-orange-600 text-white'
                : 'bg-white/10 text-stone-300 hover:bg-white/20'
            }`}
          >
            Sarah (Pantry Coord)
          </button>
        </div>
      </div>

      {/* Subtab Navigation Pills - cell phone friendly scrollable bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeSubTab === 'approvals'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/90'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Live Onsite Approvals</span>
          {pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                activeSubTab === 'approvals'
                  ? 'bg-white text-orange-700'
                  : 'bg-orange-600 text-white animate-pulse'
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ssl')}
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeSubTab === 'ssl'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/90'
          }`}
        >
          <FileCheck className="w-4 h-4 shrink-0" />
          <span>SSL Form Generator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeSubTab === 'directory'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/90'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Volunteer Directory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeSubTab === 'analytics'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/90'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>Analytics & Reports</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeSubTab === 'audit'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/90'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>Audit Trail & Security</span>
        </button>
      </div>

      {/* Render Active Subtab Content */}
      {activeSubTab === 'approvals' && (
        <ApprovalQueue adminName={currentAdmin.name} />
      )}

      {activeSubTab === 'directory' && (
        <VolunteerDirectory
          onIssueSSLForVolunteer={(volId) => {
            setActiveSubTab('ssl');
          }}
        />
      )}

      {activeSubTab === 'ssl' && (
        <SSLFormGenerator
          adminName={currentAdmin.name}
          adminEmail={currentAdmin.email}
        />
      )}

      {activeSubTab === 'analytics' && <AnalyticsDashboard />}

      {activeSubTab === 'audit' && (
        <AuditTrailView
          currentAdminEmail={currentAdmin.email}
          isSuperAdmin={currentAdmin.role === 'super_admin'}
        />
      )}

      {/* Bottom Dev / Reset Control */}
      <div className="pt-8 text-center">
        <button
          type="button"
          onClick={handleResetData}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Volunteers & Approvals Database</span>
        </button>
      </div>
    </div>
  );
}
