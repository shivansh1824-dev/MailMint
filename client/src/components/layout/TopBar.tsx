import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Plus,
  Command,
  LogOut,
  User as UserIcon,
  CheckCheck,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, Theme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { NotificationItem } from '../../types';
import { Avatar } from '../common/Avatar';

interface TopBarProps {
  onOpenQuickDraft: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenQuickDraft }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<{ success: boolean; notifications: NotificationItem[]; unreadCount: number }>('/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const themeOptions: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'system', label: 'System', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-16 border-b border-[#DDE3DF] dark:border-[#2D3A4A] bg-white dark:bg-[#0D1117] flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 transition-colors">
      {/* Search / Command Trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenQuickDraft}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-[6px] bg-[#F1F4F2] dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] text-[13px] text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white hover:border-[#00A878]/40 dark:hover:border-[#00C896]/40 transition-colors group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#87918C] dark:text-[#6B7280] group-hover:text-[#00A878] dark:group-hover:text-[#00C896] transition-colors" />
            <span>Search or start quick outreach...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] bg-white dark:bg-[#1F2937] px-1.5 py-0.5 rounded text-[#5E6863] dark:text-[#9CA3AF] border border-[#DDE3DF] dark:border-[#2D3A4A] shadow-xs">
            <Command className="w-3 h-3" /> K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Compact Theme Segmented Control */}
        <div className="flex items-center p-0.5 bg-[#F1F4F2] dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px]">
          {themeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              title={`${opt.label} mode`}
              className={`p-1.5 rounded-[4px] text-[11px] font-medium flex items-center gap-1 transition-all ${
                theme === opt.id
                  ? 'bg-white dark:bg-[#1F2937] text-[#00A878] dark:text-[#00C896] shadow-xs font-semibold'
                  : 'text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white'
              }`}
            >
              {opt.icon}
            </button>
          ))}
        </div>

        {/* + New Outreach Button */}
        <button
          onClick={onOpenQuickDraft}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#00A878] dark:bg-[#00C896] text-white dark:text-[#0D1117] font-semibold text-[13px] hover:bg-[#008f66] dark:hover:bg-[#00b084] transition-all shadow-[0_2px_8px_rgba(0,168,120,0.2)] dark:shadow-[0_0_12px_rgba(0,200,150,0.25)]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">New Outreach</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-[6px] text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white hover:bg-[#F1F4F2] dark:hover:bg-[#161B22] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00A878] dark:bg-[#00C896] ring-2 ring-white dark:ring-[#0D1117]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[8px] bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] shadow-xl dark:shadow-2xl p-3 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE3DF] dark:border-[#2D3A4A] mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-semibold text-[13px] text-[#17201C] dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-[#00A878]/10 dark:bg-[#00C896]/20 text-[#00A878] dark:text-[#00C896]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-[#00A878] dark:text-[#00C896] hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-[12px] text-[#87918C] dark:text-[#6B7280] text-center py-6">
                    No new notifications
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-[6px] border text-[12px] transition-colors ${
                        n.read
                          ? 'bg-[#F7F8F6] dark:bg-[#111827]/60 border-transparent text-[#5E6863] dark:text-[#9CA3AF]'
                          : 'bg-[#F1F4F2] dark:bg-[#1F2937]/50 border-[#00A878]/30 dark:border-[#00C896]/30 text-[#17201C] dark:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[#87918C] dark:text-[#6B7280] text-[11px] mb-1">
                        <span className="font-medium text-[#17201C] dark:text-white">{n.title}</span>
                        <span className="font-mono">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="line-clamp-2">{n.message || n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#00A878]/40 dark:hover:ring-[#00C896]/40 transition-all"
          >
            <Avatar name={user?.name || 'Developer'} size="sm" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-[8px] bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] shadow-xl py-1.5 z-50 text-[13px] animate-fadeIn">
              <div className="px-3 py-2 border-b border-[#DDE3DF] dark:border-[#2D3A4A] mb-1">
                <p className="text-[#17201C] dark:text-white font-medium truncate">{user?.name || 'Developer'}</p>
                <p className="text-[11px] text-[#87918C] dark:text-[#6B7280] truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/profile');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#F1F4F2] dark:hover:bg-[#1F2937] text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Profile & Voice
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
