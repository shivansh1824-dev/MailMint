import React from 'react';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'active' | 'sent' | 'replied' | 'idle';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'User',
  src,
  size = 'md',
  status,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[12px]',
    md: 'w-10 h-10 text-[14px]',
    lg: 'w-14 h-14 text-[18px]',
    xl: 'w-20 h-20 text-[24px]',
  }[size];

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5',
    xl: 'w-4 h-4 bottom-1 right-1',
  }[size];

  const statusColors = {
    active: 'bg-[#10B981]',
    sent: 'bg-[#6366F1]',
    replied: 'bg-[#00C896]',
    idle: 'bg-[#9CA3AF]',
  };

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  // Consistent hue generator for initials
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'from-[#00C896] to-[#008f66]',
    'from-[#6366F1] to-[#4F46E5]',
    'from-[#EC4899] to-[#BE185D]',
    'from-[#F59E0B] to-[#D97706]',
    'from-[#3B82F6] to-[#1D4ED8]',
    'from-[#8B5CF6] to-[#6D28D9]',
    'from-[#14B8A6] to-[#0F766E]',
  ];
  const gradient = gradients[Math.abs(hash) % gradients.length];

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover ring-2 ring-white dark:ring-[#161B22] shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-br ${gradient} text-white font-bold flex items-center justify-center tracking-tight shadow-sm ring-2 ring-white dark:ring-[#161B22]`}
        >
          <span>{initials || 'U'}</span>
        </div>
      )}

      {status && (
        <span
          className={`absolute rounded-full border-2 border-white dark:border-[#0D1117] ${statusColors[status]} ${statusDotSizes}`}
        />
      )}
    </div>
  );
};
