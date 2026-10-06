import React from 'react';
import { CalendarDays, Clock, Wallet } from 'lucide-react';

export type MobileTab = 'home' | 'monthLog' | 'salary';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  loggedDaysCount?: number;
  totalDaysCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  loggedDaysCount = 0,
}) => {
  const tabs = [
    {
      id: 'home' as MobileTab,
      label: 'Attendance',
      icon: Clock,
      badge: null,
    },
    {
      id: 'monthLog' as MobileTab,
      label: 'Month Log',
      icon: CalendarDays,
      badge: loggedDaysCount > 0 ? `${loggedDaysCount}d` : null,
    },
    {
      id: 'salary' as MobileTab,
      label: 'Salary',
      icon: Wallet,
      badge: null,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-1.5 xl:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onChangeTab(tab.id);
                // Smooth scroll to top when changing tab
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative py-1.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none active:scale-95 ${
                isActive
                  ? 'text-neutral-950 font-bold bg-neutral-100/90 shadow-2xs'
                  : 'text-neutral-500 font-medium hover:text-neutral-900 hover:bg-neutral-50/80'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-neutral-950 stroke-[2.3]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3 text-[9px] font-bold px-1 py-0.2 rounded-full leading-tight font-mono ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] tracking-tight leading-none ${
                  isActive ? 'font-bold text-neutral-950' : 'font-medium text-neutral-500'
                }`}
              >
                {tab.label}
              </span>

              {/* Active bottom indicator line */}
              {isActive && (
                <span className="absolute -bottom-1 w-8 h-0.5 rounded-full bg-neutral-950" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

