import { useState } from 'react';
import { LogIn, LogOut, Smartphone, Tablet } from 'lucide-react';
import { ServiceSession, Volunteer } from '../../types';
import { KioskCheckIn } from './KioskCheckIn';
import { KioskCheckOut } from './KioskCheckOut';
import { PersonalPortal } from './PersonalPortal';

interface VolunteerPortalProps {
  onViewSSLForm?: (formId: string) => void;
}

export function VolunteerPortal({ onViewSSLForm }: VolunteerPortalProps) {
  const [mode, setMode] = useState<'kiosk' | 'personal'>('kiosk');
  const [kioskSubTab, setKioskSubTab] = useState<'checkin' | 'checkout'>('checkin');

  return (
    <div className="space-y-6">
      {/* Mode Switcher Banner - touch-friendly for cell phones */}
      <div className="bg-white rounded-2xl p-1.5 shadow-xs border border-stone-200/90 max-w-xl mx-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setMode('kiosk')}
          className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            mode === 'kiosk'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Tablet className="w-4 h-4 shrink-0" />
          <span>Kiosk Mode</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('personal')}
          className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            mode === 'personal'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Personal Account</span>
        </button>
      </div>

      {mode === 'kiosk' && (
        <div className="space-y-6">
          {/* Sub-navigation for Kiosk: Check-In vs Check-Out */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-stone-200/80 rounded-xl w-full max-w-md sm:w-auto">
              <button
                type="button"
                onClick={() => setKioskSubTab('checkin')}
                className={`flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  kioskSubTab === 'checkin'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LogIn className="w-4 h-4 text-orange-600" />
                <span>On-Site Check-In</span>
              </button>

              <button
                type="button"
                onClick={() => setKioskSubTab('checkout')}
                className={`flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  kioskSubTab === 'checkout'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LogOut className="w-4 h-4 text-amber-600" />
                <span>Fast Check-Out</span>
              </button>
            </div>
          </div>

          {kioskSubTab === 'checkin' ? (
            <KioskCheckIn
              onGoToCheckout={() => setKioskSubTab('checkout')}
              onSuccessCheckIn={() => {}}
            />
          ) : (
            <KioskCheckOut
              onGoToCheckIn={() => setKioskSubTab('checkin')}
              onSuccessCheckOut={() => {}}
            />
          )}
        </div>
      )}

      {mode === 'personal' && <PersonalPortal onViewSSLForm={onViewSSLForm} />}
    </div>
  );
}
