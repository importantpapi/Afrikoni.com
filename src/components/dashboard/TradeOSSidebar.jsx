import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { getRoleNavigation } from '@/config/roleNavigationConfig';

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

  // OS-style Nav Item
  const OSNavItem = ({ icon: Icon, label, path, badge, active, onClick }) => (
    <Link
      to={path}
      onClick={onClick}
      className={`
        relative group flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
        ${active
          ? 'bg-[#D4A937] text-black shadow-[0_0_15px_rgba(212,169,55,0.4)] scale-105'
          : 'text-gray-600 hover:text-[#D4A937] hover:bg-afrikoni-cream/30 dark:text-gray-400 dark:hover:text-[#D4A937] dark:hover:bg-white/10'
        }
      `}
    >
      <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />

      {/* Tooltip Label (Hover) */}
      <div className="absolute left-14 px-3 py-1.5 bg-white dark:bg-gray-900 border border-afrikoni-gold/20 rounded-lg text-[11px] font-medium text-afrikoni-deep dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 flex items-center gap-2 shadow-xl">
        {label}
        {badge && (
          <span className={`flex items-center justify-center min-w-[16px] h-4 text-[9px] font-bold rounded-full px-1 ${badge === 'NEW' || badge === 'LIVE' || badge === 'BETA' ? 'bg-[#D4A937] text-black' : 'bg-red-500 text-white'
            }`}>
            {badge}
          </span>
        )}
      </div>

      {/* Active Dot */}
      {active && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#D4A937] rounded-r-full" />
      )}
    </Link>
  );

  return (
    <aside 
      className={`
        relative h-full bg-white dark:bg-black border-r border-afrikoni-gold/10
        flex flex-col items-center py-5 transition-transform duration-200 shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
      style={{ width: 'var(--os-sidebar-width, 72px)' }}
    >
      {/* OS Logo */}
      <Link to="/dashboard" className="mb-8 relative group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A937] to-[#8B4513] flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
          <span className="text-black font-black text-sm">A</span>
        </div>
      </Link>

      {/* Navigation Dock */}
      <nav className="flex-1 flex flex-col gap-3 w-full px-2 items-center overflow-y-auto scrollbar-hide py-2">
        {sections.map((section, idx) => (
          <React.Fragment key={section.id}>
            {section.items.map(item => (
              <OSNavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                path={item.path}
                badge={item.badge}
                active={isActive(item.path, item.activeMatch)}
              />
            ))}
            {/* Divider if required and not the last section */}
            {section.divider && idx < sections.length - 1 && (
              <div className="w-8 h-px bg-afrikoni-gold/20 dark:bg-white/10 my-1" />
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* System Apps */}
      <div className="flex flex-col gap-4 w-full px-2 items-center mt-auto pb-4">
        <div className="w-6 h-px bg-afrikoni-gold/20 dark:bg-white/10" />
        {systemApps.map(item => (
          <OSNavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={isActive(item.path, item.activeMatch)}
          />
        ))}

        <button onClick={onClose} className="md:hidden mt-2 p-2 text-gray-600 hover:text-[#D4A937] dark:text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
