import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Building2,
  Briefcase,
  Layers,
  FileText,
  Send,
  BarChart3,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Globe,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navItems = [
    { to: '/', label: 'Landing Page', icon: Globe },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/email-generator', label: 'Email Generator', icon: Sparkles, badge: 'AI' },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/applications', label: 'Applications', icon: Layers },
    { to: '/templates', label: 'Templates', icon: FileText },
    { to: '/campaigns', label: 'Campaigns', icon: Send },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[#DDE3DF] dark:border-[#2D3A4A] bg-white dark:bg-[#0D1117] transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-[64px]' : 'w-[240px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-[#DDE3DF] dark:border-[#2D3A4A] justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-[7px] bg-[#00A878] dark:bg-[#161B22] border border-[#00A878]/30 dark:border-[#2D3A4A] flex items-center justify-center relative flex-shrink-0 shadow-sm">
            <span className="w-3 h-3 rounded-full bg-white dark:bg-[#00C896] shadow-[0_0_8px_rgba(0,200,150,0.8)]"></span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-sans font-bold text-[17px] text-[#17201C] dark:text-white tracking-tight flex items-center gap-1.5">
                MailMint
                <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded-[4px] bg-[#00A878]/10 dark:bg-[#00C896]/15 text-[#00A878] dark:text-[#00C896] border border-[#00A878]/20 dark:border-[#00C896]/20 font-semibold">
                  SaaS
                </span>
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all group relative ${
                  isActive
                    ? 'bg-[#F1F4F2] dark:bg-[#1F2937] text-[#00A878] dark:text-white font-semibold border-l-2 border-[#00A878] dark:border-[#00C896]'
                    : 'text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white hover:bg-[#F7F8F6] dark:hover:bg-[#161B22]'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[4px] bg-[#00A878]/15 dark:bg-[#00C896]/20 text-[#00A878] dark:text-[#00C896]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Responsible Outreach Banner */}
      {!collapsed && (
        <div className="p-3 mx-2.5 mb-2 rounded-[6px] bg-[#F7F8F6] dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A]">
          <div className="flex items-center gap-2 text-[11px] text-[#00A878] dark:text-[#00C896] font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Human-in-the-Loop
          </div>
          <p className="text-[11px] text-[#87918C] dark:text-[#6B7280] leading-snug">
            Every email requires your review before inbox delivery.
          </p>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-2.5 border-t border-[#DDE3DF] dark:border-[#2D3A4A] flex justify-end">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-[6px] text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white hover:bg-[#F1F4F2] dark:hover:bg-[#161B22] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="w-full flex items-center justify-between text-[12px]">
              <span>Collapse</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
