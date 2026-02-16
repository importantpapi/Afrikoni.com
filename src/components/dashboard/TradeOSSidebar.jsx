import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/shared/ui/Logo';
import { getRoleNavigation } from '@/config/roleNavigationConfig';
import { cn as utilsCn } from '@/lib/utils';

// Bulletproof helper to prevent ReferenceError: cn is not defined
const cn = (...args) => {
  try {
    return utilsCn(...args);
  } catch (e) {
    return args.filter(Boolean).join(' ');
  }
};

export default function TradeOSSidebar({
  capabilities,
  isAdmin = false,
  notificationCounts = {},
  onClose,
  sidebarOpen = true,
  workspaceMode = 'simple',
}) {
  const location = useLocation();
  const isActive = (path, matchFn) => {
    if (matchFn) return matchFn(location.pathname);
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const { sections, systemApps } = getRoleNavigation({ capabilities, workspaceMode, notificationCounts });


  return (
    <aside
      className={`
        relative h-full bg-os-surface-solid border-r border-os-stroke
        flex flex-col items-center pt-6 pb-5 transition-all duration-300 shadow-sm
        ${sidebarOpen ? 'w-[240px] px-4 items-start' : 'w-[88px] px-2 items-center'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:translate-x-0 overflow-hidden
      `}
    >
      {/* OS Logo - Official Afrikoni Mark */}
      <Link to="/dashboard" className={cn("mb-8 relative group z-50 flex items-center gap-3", sidebarOpen ? "w-full px-2" : "")}>
        <div className="shrink-0 group-hover:scale-105 transition-all duration-300 relative">
          <Logo type="icon" size={sidebarOpen ? "md" : "sm"} className="shadow-premium" />
        </div>

        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-xs font-bold tracking-widest text-[#D4A937]">AFRIKONI OS</span>
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Trade Intelligence</span>
          </motion.div>
        )}

        {!sidebarOpen && (
          <div className="absolute left-14 px-3 py-1.5 bg-white dark:bg-gray-900 border border-[#D4A937]/30 rounded-lg text-[11px] font-semibold text-[#D4A937] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] shadow-xl">
            AFRIKONI OS
            <div className="text-[9px] text-gray-500 dark:text-gray-400 font-normal mt-0.5">Trade. Trust. Thrive.</div>
          </div>
        )}
      </Link>

      {/* Navigation Dock */}
      <nav className="flex-1 flex flex-col gap-1 w-full items-center overflow-y-auto scrollbar-hide py-2">
        {(sections || []).map((section, idx) => (
          <div key={section.id} className="w-full flex flex-col gap-1 mb-4">
            {sidebarOpen && section.label && (
              <div className="px-4 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">{section.label}</span>
              </div>
            )}

            <div className={`flex flex-col gap-1.5 ${sidebarOpen ? 'w-full' : 'items-center w-full'}`}>
              {(section.items || []).map(item => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    "relative group flex items-center transition-all duration-300 h-10 rounded-xl",
                    sidebarOpen ? "w-full px-4 gap-3 mx-auto" : "w-10 justify-center",
                    isActive(item.path, item.activeMatch)
                      ? "bg-os-accent text-black shadow-[0_8px_20px_rgba(212,169,55,0.25)]"
                      : "text-muted-foreground hover:text-os-accent hover:bg-os-accent/10"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive(item.path, item.activeMatch) ? "stroke-[2.5px]" : "stroke-2")} />

                  {sidebarOpen && (
                    <span className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip (Collapsed ONLY) */}
                  {!sidebarOpen && (
                    <div className="absolute left-14 px-3 py-1.5 bg-white dark:bg-gray-900 border border-os-accent/20 rounded-lg text-[11px] font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 flex items-center gap-2 shadow-xl">
                      {item.label}
                      {item.badge && (
                        <span className="flex items-center justify-center min-w-[16px] h-4 text-[9px] font-bold rounded-full px-1 bg-os-accent text-black">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator */}
                  {isActive(item.path, item.activeMatch) && (
                    <div className={cn(
                      "absolute bg-os-accent rounded-full",
                      sidebarOpen ? "right-2 w-1 h-1" : "-left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                    )} />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* System Apps */}
      <div className={`flex flex-col gap-3 w-full mt-auto pb-4 ${sidebarOpen ? 'px-4' : 'px-2 items-center'}`}>
        <div className="w-full h-px bg-os-stroke mb-2" />
        {(systemApps || []).map(item => (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              "relative group flex items-center transition-all duration-300 h-10 rounded-xl",
              sidebarOpen ? "w-full px-4 gap-3" : "w-10 justify-center",
              isActive(item.path, item.activeMatch)
                ? "bg-os-accent text-black shadow-lg"
                : "text-muted-foreground hover:text-os-accent hover:bg-os-accent/10"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
          </Link>
        ))}

        <button onClick={onClose} className="md:hidden mt-2 p-3 rounded-xl bg-muted/50 text-muted-foreground hover:text-os-accent transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
