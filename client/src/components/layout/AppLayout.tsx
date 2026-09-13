import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { QuickDraftModal } from '../common/QuickDraftModal';
import { useAuth } from '../../context/AuthContext';
import { Sparkles } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickDraftOpen, setQuickDraftOpen] = useState(false);

  // Global Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickDraftOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] dark:bg-[#0D1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00A878] dark:bg-[#00C896] animate-ping opacity-75"></div>
          <span className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF] font-mono">Loading MailMint...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-[#F7F8F6] dark:bg-[#0D1117] text-[#17201C] dark:text-[#F0F0F0] transition-colors">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopBar onOpenQuickDraft={() => setQuickDraftOpen(true)} />

        {/* Max 1280px Centered Content Area */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>

        <MobileNav />
      </div>

      {/* Floating Action Button for Quick Draft (Bottom Right) */}
      <button
        onClick={() => setQuickDraftOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 w-12 h-12 rounded-full bg-[#00C896] text-[#0D1117] flex items-center justify-center shadow-[0_4px_20px_rgba(0,200,150,0.35)] hover:scale-105 active:scale-95 transition-transform z-40"
        title="Quick Outreach (Cmd+K)"
      >
        <Sparkles className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Quick Draft Modal */}
      <QuickDraftModal
        isOpen={quickDraftOpen}
        onClose={() => setQuickDraftOpen(false)}
      />
    </div>
  );
};
