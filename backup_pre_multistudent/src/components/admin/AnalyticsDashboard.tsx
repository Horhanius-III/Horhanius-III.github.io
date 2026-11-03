import { useState } from 'react';
import {
  Award,
  BarChart3,
  Building2,
  Calendar,
  Clock,
  Download,
  Filter,
  GraduationCap,
  TrendingUp,
  Users,
} from 'lucide-react';
import { SWE_FACILITIES } from '../../data/facilities';
import { storageService } from '../../services/storage';
import { filterSessionsByPeriod, formatHoursVerbose } from '../../utils/hours';

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'past90' | 'all' | 'custom'>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const volunteers = storageService.getVolunteers();
  const allSessions = storageService.getSessions();

  // Filter approved or completed sessions
  const approvedSessions = allSessions.filter((s) => s.checkOutStatus === 'approved');

  const filteredSessions = filterSessionsByPeriod(
    approvedSessions,
    period,
    customStart,
    customEnd,
    facilityFilter
  );

  const totalFilteredHours = Math.round(
    filteredSessions.reduce((acc, s) => acc + s.totalHours, 0) * 100
  ) / 100;

  // Active volunteers in this filtered period
  const uniqueVolunteerIds = new Set(filteredSessions.map((s) => s.volunteerId));
  const activeVolunteerCount = uniqueVolunteerIds.size;

  // Breakdown by facility
  const facilityBreakdown: Record<string, number> = {};
  filteredSessions.forEach((s) => {
    facilityBreakdown[s.facilityName] =
      Math.round(((facilityBreakdown[s.facilityName] || 0) + s.totalHours) * 100) / 100;
  });

  // Breakdown by activity
  const activityBreakdown: Record<string, number> = {};
  filteredSessions.forEach((s) => {
    activityBreakdown[s.activityType] =
      Math.round(((activityBreakdown[s.activityType] || 0) + s.totalHours) * 100) / 100;
  });

  // Compute volunteer hours in this filtered period
  const volunteerStats = volunteers.map((vol) => {
    const volSessions = filteredSessions.filter((s) => s.volunteerId === vol.id);
    const periodHours = Math.round(
      volSessions.reduce((acc, s) => acc + s.totalHours, 0) * 100
    ) / 100;
    return {
      volunteer: vol,
      periodHours,
      periodShifts: volSessions.length,
      lifetimeHours: vol.totalHours,
      lifetimeShifts: vol.sessionCount,
    };
  }).sort((a, b) => b.periodHours - a.periodHours);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Volunteer Name',
      'SWE ID',
      'Email',
      'School',
      'Grade',
      'Facility',
      'Activity',
      'Date',
      'Check-In Time',
      'Check-Out Time',
      'Hours',
      'GPS Flagged',
    ];

    const rows = filteredSessions.map((s) => [
      `"${s.volunteerName}"`,
      `"${s.sweId}"`,
      `"${s.volunteerEmail}"`,
      `"${s.school || ''}"`,
      `"${s.grade || ''}"`,
      `"${s.facilityName}"`,
      `"${s.activityType}"`,
      `"${s.checkInTime.split('T')[0]}"`,
      `"${s.checkInTime}"`,
      `"${s.checkOutTime || ''}"`,
      s.totalHours,
      Boolean(s.checkInGps?.isOutsideGeofence || s.checkOutGps?.isOutsideGeofence),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `so_what_else_volunteer_report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Controls Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-orange-600" />
            <h3 className="font-extrabold text-stone-900 text-lg">
              Volunteer Hours & Service Analytics
            </h3>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 min-h-[40px] rounded-xl bg-[#1c1c1c] hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (CSV)</span>
          </button>
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-stone-100 text-xs">
          <div>
            <label className="block text-stone-500 font-bold uppercase mb-1">
              Time Period Filter
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold bg-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week (Past 7 Days)</option>
              <option value="month">This Month (Past 30 Days)</option>
              <option value="past90">Past 90 Days</option>
              <option value="all">All Time Records</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          <div>
            <label className="block text-stone-500 font-bold uppercase mb-1">
              Pantry / Facility Location
            </label>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold bg-white"
            >
              <option value="all">All Facilities Combined</option>
              {SWE_FACILITIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {period === 'custom' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-stone-500 font-bold uppercase mb-1">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-2.5 py-2 min-h-[44px] rounded-xl border border-stone-300"
                />
              </div>
              <div className="flex-1">
                <label className="block text-stone-500 font-bold uppercase mb-1">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-2.5 py-2 min-h-[44px] rounded-xl border border-stone-300"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            <span>Total Hours</span>
          </span>
          <p className="text-3xl sm:text-4xl font-black text-stone-900 mt-2">
            {totalFilteredHours}
          </p>
          <p className="text-xs text-orange-600 font-medium mt-1">
            Verified in selected filter
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-600" />
            <span>Active Volunteers</span>
          </span>
          <p className="text-3xl sm:text-4xl font-black text-stone-900 mt-2">
            {activeVolunteerCount}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {volunteers.length} total registered
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-600" />
            <span>Completed Shifts</span>
          </span>
          <p className="text-3xl sm:text-4xl font-black text-stone-900 mt-2">
            {filteredSessions.length}
          </p>
          <p className="text-xs text-stone-500 mt-1">Service shifts logged</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
            <span>Avg Hours / Shift</span>
          </span>
          <p className="text-3xl sm:text-4xl font-black text-stone-900 mt-2">
            {filteredSessions.length > 0
              ? (totalFilteredHours / filteredSessions.length).toFixed(1)
              : '0.0'}
          </p>
          <p className="text-xs text-stone-500 mt-1">Average shift length</p>
        </div>
      </div>

      {/* Facility & Activity Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hours by Facility */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
          <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Hours by Facility / Hub</span>
          </h4>

          {Object.keys(facilityBreakdown).length === 0 ? (
            <p className="text-xs text-stone-400 py-4 text-center">No hours recorded for this period.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(facilityBreakdown).map(([facName, hours]) => {
                const pct =
                  totalFilteredHours > 0
                    ? Math.round((hours / totalFilteredHours) * 100)
                    : 0;
                return (
                  <div key={facName} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-stone-800 truncate pr-2">
                        {facName}
                      </span>
                      <span className="font-bold text-stone-900 shrink-0">
                        {hours} hrs ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hours by Activity */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
          <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-orange-600" />
            <span>Hours by Volunteer Activity</span>
          </h4>

          {Object.keys(activityBreakdown).length === 0 ? (
            <p className="text-xs text-stone-400 py-4 text-center">No activities recorded for this period.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(activityBreakdown).map(([actName, hours]) => {
                const pct =
                  totalFilteredHours > 0
                    ? Math.round((hours / totalFilteredHours) * 100)
                    : 0;
                return (
                  <div key={actName} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-stone-800 truncate pr-2">
                        {actName}
                      </span>
                      <span className="font-bold text-stone-900 shrink-0">
                        {hours} hrs ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Volunteer Service Hours & Frequency Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h4 className="font-bold text-stone-900 text-sm">
            Volunteer Service Leaderboard & Frequency ({volunteerStats.length})
          </h4>
          <span className="text-xs text-stone-400">
            Sorted by period hours
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold border-b border-stone-100">
              <tr>
                <th className="py-3 px-4">Volunteer Student</th>
                <th className="py-3 px-4">SWE ID</th>
                <th className="py-3 px-4">School & Grade</th>
                <th className="py-3 px-4 text-right">Period Hours</th>
                <th className="py-3 px-4 text-right">Period Shifts</th>
                <th className="py-3 px-4 text-right">Lifetime Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {volunteerStats.map(({ volunteer, periodHours, periodShifts, lifetimeHours, lifetimeShifts }) => (
                <tr key={volunteer.id} className="hover:bg-stone-50/70">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-stone-900">{volunteer.name}</p>
                    <p className="text-[11px] text-stone-400">{volunteer.email}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-orange-600">
                    {volunteer.sweId}
                  </td>
                  <td className="py-3.5 px-4 text-stone-600">
                    {volunteer.school || 'High School'}
                    {volunteer.grade && <span className="block text-[10px] text-stone-400">{volunteer.grade}</span>}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-stone-900 text-sm">
                    {periodHours} hrs
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-stone-700">
                    {periodShifts} shifts
                  </td>
                  <td className="py-3.5 px-4 text-right text-orange-600 font-extrabold">
                    {lifetimeHours} hrs <span className="text-stone-400 font-normal">({lifetimeShifts}d)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
