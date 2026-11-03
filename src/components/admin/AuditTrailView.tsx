import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  History,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { formatDateTime } from '../../utils/hours';

interface AuditTrailViewProps {
  currentAdminEmail: string;
  isSuperAdmin: boolean;
}

export function AuditTrailView({ currentAdminEmail, isSuperAdmin }: AuditTrailViewProps) {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  const auditLogs = storageService.getAuditLogs();
  const adminUsers = storageService.getAdminUsers();

  const filteredLogs = auditLogs.filter((log) => {
    if (onlyFlagged && !log.flaggedGps) return false;
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (!search.trim()) return true;

    const q = search.toLowerCase();
    return (
      log.details.toLowerCase().includes(q) ||
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const handlePromote = (email: string) => {
    storageService.promoteAdminUser(email, currentAdminEmail);
  };

  return (
    <div className="space-y-6">
      {/* Admin Role Control Section (Super Admin feature) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">
              Authorized Pantry Staff & Admin Roles
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {isSuperAdmin ? 'Super Admin Mode Active' : 'Staff Admin'}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Admin logins are strictly controlled. New staff accounts must be approved by the Super Admin before they can verify check-ins or issue official SSL forms.
        </p>

        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
          {adminUsers.map((user) => (
            <div
              key={user.email}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      user.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'admin'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Active Admin' : 'Pending Approval'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {user.email} • {user.siteAssigned || 'Pantry Coordinator'}
                  {user.approvedBy && ` • Approved by ${user.approvedBy}`}
                </p>
              </div>

              {/* Super Admin Approval Action */}
              {user.role === 'pending' && isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => handlePromote(user.email)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Approve Admin Access</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">
              Immutable System Audit Trail ({auditLogs.length} events)
            </h3>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={onlyFlagged}
              onChange={(e) => setOnlyFlagged(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span>Show Only Flagged GPS (&gt;300m)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by actor, action, or details..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">All Audit Actions</option>
              <option value="checkin_request">Check-In Requests</option>
              <option value="checkin_approved">Check-In Approved</option>
              <option value="checkout_request">Check-Out Requests</option>
              <option value="checkout_approved">Check-Out Approved</option>
              <option value="time_adjusted">Manual Time Adjustments</option>
              <option value="ssl_generated">SSL Forms Generated</option>
              <option value="admin_promoted">Admin Promotions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Chronological Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No audit log entries matching your current filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors ${
                  log.flaggedGps ? 'bg-rose-50/20' : 'hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    log.flaggedGps
                      ? 'bg-rose-100 text-rose-700'
                      : log.action.includes('approved')
                      ? 'bg-emerald-100 text-emerald-700'
                      : log.action.includes('adjusted')
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {log.flaggedGps ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : log.action.includes('approved') ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {log.actor}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>

                  <p
                    className={`text-xs ${
                      log.flaggedGps
                        ? 'text-rose-900 font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    {log.details}
                  </p>

                  <div className="pt-0.5 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 text-slate-600">
                      action: {log.action}
                    </span>
                    {log.flaggedGps && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                        GPS &gt; 300m Flagged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
