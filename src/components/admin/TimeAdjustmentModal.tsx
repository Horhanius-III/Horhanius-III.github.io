import { useState } from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import { ServiceSession } from '../../types';
import { calculateElapsedHours, formatDateTime } from '../../utils/hours';

interface TimeAdjustmentModalProps {
  session: ServiceSession;
  adminName: string;
  onClose: () => void;
  onSave: (adjustedHours: number, reason: string) => void;
}

export function TimeAdjustmentModal({
  session,
  adminName,
  onClose,
  onSave,
}: TimeAdjustmentModalProps) {
  const currentHours =
    session.totalHours > 0
      ? session.totalHours
      : calculateElapsedHours(session.checkInTime, session.checkOutTime);

  const [hours, setHours] = useState(currentHours.toString());
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(hours);
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid positive number of hours.');
      return;
    }
    if (!reason.trim()) {
      setError('Audit trail requires an explanation note for manual time adjustments.');
      return;
    }

    onSave(Math.round(parsed * 100) / 100, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-stone-900">
              Adjust Service Hours
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg font-bold p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-2xl text-xs space-y-1.5 border border-stone-200">
          <p className="font-semibold text-stone-800">
            Volunteer: {session.volunteerName} ({session.sweId})
          </p>
          <p className="text-stone-500">
            Check-In: {formatDateTime(session.checkInTime)}
          </p>
          {session.checkOutTime && (
            <p className="text-stone-500">
              Check-Out: {formatDateTime(session.checkOutTime)}
            </p>
          )}
          <p className="text-orange-700 font-bold">
            System Logged: {currentHours} hours
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Correct Verified Hours
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              max="24"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-stone-300 font-bold text-lg text-stone-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none min-h-[48px]"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Supports decimal hours, e.g. 2.5 for 2 hours 30 mins.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Reason for Adjustment <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Volunteer forgot to tap checkout at 1:00 PM; departure verified by onsite supervisor."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 min-h-[44px] transition-all"
            >
              Save Adjustment & Audit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
