import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Users, Briefcase, Settings } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const items = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/email-generator', label: 'Generator', icon: Sparkles },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#0D1117] border-t border-[#DDE3DF] dark:border-[#2D3A4A] flex items-center justify-around z-40 px-2 transition-colors">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-[#00A878] dark:text-[#00C896]' : 'text-[#5E6863] dark:text-[#9CA3AF]'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
