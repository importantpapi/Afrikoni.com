import React from 'react';
import { Link } from 'react-router-dom';

export default function NavLinks({ navLinks, isActive }) {
  return (
    <div className="hidden lg:block flex-1 min-w-0">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar justify-center">
        {navLinks.map((link, idx) => {
          const Icon = link.icon;
          const active = isActive(link.path);

          return (
            <Link
              key={idx}
              to={link.path}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-md text-os-sm font-medium transition-all
                ${active 
                  ? 'text-os-accent bg-os-accent/10' 
                  : 'text-afrikoni-cream hover:text-os-accent hover:bg-os-accent/5'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden 2xl:inline">{link.label}</span>
              <span className="2xl:hidden">{link.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


