import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const norm = (status || 'new').toLowerCase();

  let style = 'bg-[#1F2937]/80 text-[#9CA3AF] border-transparent';

  switch (norm) {
    case 'sent':
      style = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      break;
    case 'replied':
      style = 'bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30';
      break;
    case 'scheduled':
      style = 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20';
      break;
    case 'draft':
    case 'drafted':
      style = 'bg-gray-500/15 text-gray-300 border border-gray-500/20';
      break;
    case 'snoozed':
      style = 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      break;
    case 'follow-up':
    case 'followup':
      style = 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20';
      break;
    case 'applied':
      style = 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
      break;
    case 'interview':
    case 'phone-screen':
      style = 'bg-purple-500/15 text-purple-400 border border-purple-500/20';
      break;
    case 'offer':
      style = 'bg-green-500/15 text-green-400 border border-green-500/30 font-medium';
      break;
    case 'rejected':
      style = 'bg-red-500/15 text-red-400 border border-red-500/20';
      break;
    default:
      style = 'bg-slate-700/30 text-slate-300 border border-slate-700/40';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium tracking-wide lowercase ${style} ${className}`}
    >
      {norm}
    </span>
  );
};
