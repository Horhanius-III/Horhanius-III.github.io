import { ShieldCheck, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'volunteer' | 'admin';
  onTabChange: (tab: 'volunteer' | 'admin') => void;
  pendingApprovalsCount: number;
}

export function Header({
  activeTab,
  onTabChange,
  pendingApprovalsCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <img
              src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
              alt="So What Else Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain bg-[#1c1c1c] ring-1 ring-black/10 shrink-0 shadow-sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-black tracking-tight text-neutral-900 font-sans truncate">
                  SO WHAT ELSE
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 rounded-md shrink-0">
                  Food Bank & Youth
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 font-medium truncate">
                Volunteer & SSL Portal
              </p>
            </div>
          </div>

          {/* Navigation Mode Switcher with Cell Phone Friendly Touch Targets */}
          <nav className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/90 shrink-0">
            <button
              type="button"
              onClick={() => onTabChange('volunteer')}
              aria-label="Volunteer Portal"
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold min-h-[44px] transition-all ${
                activeTab === 'volunteer'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 active:bg-stone-200'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Volunteer</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('admin')}
              aria-label="Admin Portal"
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold min-h-[44px] transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#1c1c1c] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 active:bg-stone-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Admin</span>
              {pendingApprovalsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] sm:text-xs font-bold leading-none text-white bg-orange-600 rounded-full animate-bounce">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
