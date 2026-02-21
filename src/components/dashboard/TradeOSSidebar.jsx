import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
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

import { useViewPermissions } from '@/hooks/useViewPermissions';

export default function TradeOSSidebar({
  capabilities,
  isAdmin = false,
  notificationCounts = {},
  onClose,
  sidebarOpen = true,
  workspaceMode: propsWorkspaceMode = 'simple',
}) {
  const { isSourcing, isDistribution } = useViewPermissions();
  const workspaceMode = propsWorkspaceMode;
  const location = useLocation();
  const { language: lang = 'en' } = useLanguage();

  const isActive = (path, matchFn) => {
    const pathParts = location.pathname.split('/');
    const isDashboard = pathParts.includes('dashboard');

    if (matchFn) return matchFn(location.pathname);

    // Exact match for dashboard home
    if (path === '/dashboard') {
      return location.pathname === `/${lang}/dashboard` || location.pathname === `/${lang}/dashboard/`;
    }

    // Sub-route match
    const localizedPath = `/${lang}${path}`;
    return location.pathname.startsWith(localizedPath);
  };

  const getLocalizedPath = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    // Already has lang?
    if (path.startsWith(`/${lang}/`)) return path;
    // Strip leading slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${lang}${cleanPath}`;
  };

  const { sections, systemApps } = getRoleNavigation({
    capabilities,
    workspaceMode,
    notificationCounts,
    isAdmin,
    isSourcing,
    isDistribution
  });


  return (
    <aside
      className={`
        relative h-full bg-os-bg border-r border-os-accent/20
        flex flex-col overflow-y-auto overflow-x-visible
        shadow-[8px_0_40px_rgba(0,0,0,0.12)]
        ${sidebarOpen ? 'w-[240px]' : 'w-[88px]'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:translate-x-0
      `}
    >
      {/* OS Logo - Official Afrikoni Mark */}
      <Link
        to={getLocalizedPath("/")}
        onClick={onClose}
        className={cn("my-6 relative group z-50 flex items-center gap-3", sidebarOpen ? "w-full px-6" : "px-2 justify-center")}
      >
        <div className="shrink-0 group-hover:scale-105 transition-all duration-300 relative">
          <Logo type="icon" size={sidebarOpen ? "md" : "sm"} link={false} className="shadow-os-md" />
        </div>

        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-os-xs font-bold tracking-widest text-os-accent">AFRIKONI</span>
            <span className="text-os-xs text-muted-foreground font-medium uppercase tracking-tighter">Trade. Trust. Thrive.</span>
          </motion.div>
        )}

        {!sidebarOpen && (
          <div className="absolute left-14 px-3 py-1.5 bg-white dark:bg-gray-900 border border-os-accent/30 rounded-lg text-os-xs font-semibold text-os-accent opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] shadow-os-lg">
            AFRIKONI
            <div className="text-os-xs text-os-text-secondary dark:text-gray-400 font-normal mt-0.5">Trade. Trust. Thrive.</div>
          </div>
        )}
      </Link>

      {/* Navigation Dock */}
      <nav className="flex-1 flex flex-col gap-1 w-full overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(26, 26, 26, 0.2) transparent' }}>
        {(sections || []).map((section, idx) => (
          <div key={section.id} className="w-full flex flex-col gap-1 mb-4">
            {sidebarOpen && section.label && (
              <div className="px-6 mb-1">
                <span className="text-os-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">{section.label}</span>
              </div>
            )}

            <div className={`flex flex-col gap-1.5 ${sidebarOpen ? 'w-full px-2' : 'items-center w-full'}`}>
              {(section.items || []).map(item => (
                <Link
                  key={item.id}
                  to={getLocalizedPath(item.path)}
                  className={cn(
                    "relative group flex items-center transition-all duration-200 h-10 rounded-lg",
                    sidebarOpen ? "w-full px-4 gap-3 mx-auto" : "w-11 justify-center",
                    isActive(item.path, item.activeMatch)
                      ? "bg-afrikoni-deep/10 text-afrikoni-deep font-semibold shadow-sm"
                      : "text-afrikoni-deep/60 hover:text-afrikoni-deep hover:bg-afrikoni-deep/5 active:scale-[0.98]"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive(item.path, item.activeMatch) ? "stroke-[2.5px]" : "stroke-2")} />

                  {sidebarOpen && (
                    <span className="text-os-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}

                  {/* 🏷️ Apple-Grade Hover Label (Collapsed ONLY) */}
                  {!sidebarOpen && (
                    <div className="absolute left-16 px-4 py-2 bg-os-surface-solid border border-os-accent/30 rounded-os-sm text-os-xs font-bold text-os-text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 whitespace-nowrap pointer-events-none z-[1200] flex items-center gap-3 shadow-os-lg translate-x-[-8px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-os-accent" />
                      {item.label}
                      {item.badge && (
                        <span className="flex items-center justify-center min-w-[18px] h-4.5 text-[10px] font-black rounded-full px-1 bg-os-accent text-black ring-2 ring-os-surface-solid">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator */}
                  {isActive(item.path, item.activeMatch) && (
                    <div className={cn(
                      "absolute bg-afrikoni-deep rounded-full",
                      sidebarOpen ? "right-2 w-1.5 h-1.5" : "-left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
                    )} />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* System Apps */}
      <div className={`flex flex-col gap-3 w-full pb-6 ${sidebarOpen ? 'px-6' : 'px-2 items-center'}`}>
        <div className="w-full h-px bg-afrikoni-deep/10 mb-2" />
        {(systemApps || []).map(item => (
          <Link
            key={item.id}
            to={getLocalizedPath(item.path)}
            className={cn(
              "relative group flex items-center transition-all duration-200 h-10 rounded-lg",
              sidebarOpen ? "w-full px-4 gap-3" : "w-10 justify-center",
              isActive(item.path, item.activeMatch)
                ? "bg-afrikoni-deep/10 text-afrikoni-deep font-semibold shadow-sm"
                : "text-afrikoni-deep/60 hover:text-afrikoni-deep hover:bg-afrikoni-deep/5 active:scale-[0.98]"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-os-sm font-semibold">{item.label}</span>}
          </Link>
        ))}

        <button onClick={onClose} className="md:hidden mt-3 w-full py-3 rounded-lg bg-afrikoni-deep/8 text-afrikoni-deep font-medium hover:bg-afrikoni-deep/12 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <X className="w-5 h-5" />
          <span className="text-sm">Close</span>
        </button>
      </div>
    </aside>
  );
}
