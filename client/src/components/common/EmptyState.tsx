import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'contacts' | 'emails' | 'jobs' | 'campaigns';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  type = 'contacts',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] shadow-sm max-w-md mx-auto my-6 animate-fadeIn">
      {/* Visual minimal illustration */}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-full bg-[#F1F4F2] dark:bg-[#1F2937] flex items-center justify-center border border-[#DDE3DF] dark:border-[#2D3A4A]">
          {type === 'contacts' && (
            <svg
              className="w-10 h-10 text-[#00A878] dark:text-[#00C896]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              <circle cx="19" cy="8" r="2" strokeDasharray="2 2" />
            </svg>
          )}

          {type === 'emails' && (
            <svg
              className="w-10 h-10 text-[#00A878] dark:text-[#00C896]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" />
              <path d="m22 7-10 7L2 7" />
              <path d="M18 13l4 3" strokeDasharray="2 2" />
            </svg>
          )}

          {type === 'jobs' && (
            <svg
              className="w-10 h-10 text-[#00A878] dark:text-[#00C896]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              <line x1="9" y1="11" x2="15" y2="11" />
            </svg>
          )}

          {type === 'campaigns' && (
            <svg
              className="w-10 h-10 text-[#00A878] dark:text-[#00C896]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          )}
        </div>

        {/* Small floating badge */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A878] dark:bg-[#00C896] opacity-40"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00A878] dark:bg-[#00C896]"></span>
        </span>
      </div>

      <h3 className="text-[17px] font-bold text-[#17201C] dark:text-white mb-2 tracking-tight font-sans">
        {title}
      </h3>
      <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF] mb-5 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#00A878] dark:bg-[#00C896] hover:bg-[#008f66] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] text-[13px] font-bold rounded-[6px] transition-all shadow-sm flex items-center gap-2"
        >
          {Icon && <Icon className="w-4 h-4" />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
