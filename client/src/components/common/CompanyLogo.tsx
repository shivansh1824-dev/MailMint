import React, { useState } from 'react';

interface CompanyLogoProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  stripe: { bg: '#635BFF', text: '#FFFFFF' },
  linear: { bg: '#5E6AD2', text: '#FFFFFF' },
  figma: { bg: '#F24E1E', text: '#FFFFFF' },
  google: { bg: '#4285F4', text: '#FFFFFF' },
  microsoft: { bg: '#00A4EF', text: '#FFFFFF' },
  datadog: { bg: '#632CA6', text: '#FFFFFF' },
  apple: { bg: '#000000', text: '#FFFFFF' },
  meta: { bg: '#0668E1', text: '#FFFFFF' },
  amazon: { bg: '#FF9900', text: '#111827' },
  netflix: { bg: '#E50914', text: '#FFFFFF' },
  airbnb: { bg: '#FF5A5F', text: '#FFFFFF' },
  uber: { bg: '#000000', text: '#FFFFFF' },
  openai: { bg: '#10A37F', text: '#FFFFFF' },
  spotify: { bg: '#1DB954', text: '#FFFFFF' },
  github: { bg: '#24292E', text: '#FFFFFF' },
};

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ name, size = 'md', className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  const cleanName = (name || 'Company').trim();
  const lower = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px] rounded-[4px]',
    sm: 'w-7 h-7 text-[11px] rounded-[6px]',
    md: 'w-9 h-9 text-[13px] rounded-[8px]',
    lg: 'w-12 h-12 text-[16px] rounded-[10px]',
    xl: 'w-16 h-16 text-[20px] rounded-[12px]',
  }[size];

  // Try fetching official clearbit / google favicon where applicable
  const domainGuess = cleanName.includes('.') ? cleanName : `${lower}.com`;
  const logoUrl = `https://logo.clearbit.com/${domainGuess}`;

  // Deterministic fallback color based on name hash
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const fallbackHues = [160, 210, 260, 330, 25, 190, 280];
  const hue = fallbackHues[Math.abs(hash) % fallbackHues.length];

  const brand = BRAND_COLORS[lower];

  // SVGs for key tech brands
  if (lower === 'stripe') {
    return (
      <div
        className={`${sizeClasses} bg-[#635BFF] flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${className}`}
      >
        <span className="font-serif italic text-[1.1em] lowercase leading-none">S</span>
      </div>
    );
  }

  if (lower === 'linear') {
    return (
      <div
        className={`${sizeClasses} bg-[#5E6AD2] flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${className}`}
      >
        <span className="text-[0.9em] font-mono leading-none">◈</span>
      </div>
    );
  }

  if (lower === 'figma') {
    return (
      <div
        className={`${sizeClasses} bg-[#1E1E1E] flex items-center justify-center font-bold text-[#F24E1E] shadow-sm flex-shrink-0 ${className}`}
      >
        <span className="text-[0.9em] font-sans leading-none">❖</span>
      </div>
    );
  }

  if (lower === 'google') {
    return (
      <div
        className={`${sizeClasses} bg-white border border-[#E5EAE7] dark:border-[#2D3A4A] flex items-center justify-center font-bold shadow-sm flex-shrink-0 ${className}`}
      >
        <span className="text-[#4285F4] text-[1.05em] font-bold">G</span>
      </div>
    );
  }

  if (lower === 'datadog') {
    return (
      <div
        className={`${sizeClasses} bg-[#632CA6] flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${className}`}
      >
        <span className="text-[0.8em] font-mono tracking-tighter">DD</span>
      </div>
    );
  }

  if (!imgFailed && cleanName.length > 2) {
    return (
      <div
        className={`${sizeClasses} bg-white dark:bg-[#1F2937] border border-[#DDE3DF] dark:border-[#2D3A4A] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm ${className}`}
      >
        <img
          src={logoUrl}
          alt={`${cleanName} logo`}
          className="w-full h-full object-contain p-1"
          onError={() => setImgFailed(true)}
          loading="lazy"
        />
      </div>
    );
  }

  const initials = cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const bgStyle = brand
    ? { backgroundColor: brand.bg, color: brand.text }
    : { backgroundColor: `hsl(${hue}, 65%, 42%)`, color: '#FFFFFF' };

  return (
    <div
      style={bgStyle}
      className={`${sizeClasses} flex items-center justify-center font-bold tracking-tight shadow-sm flex-shrink-0 ${className}`}
    >
      <span>{initials || 'C'}</span>
    </div>
  );
};
