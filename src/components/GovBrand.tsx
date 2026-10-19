import React from 'react';

/**
 * Official National Emblem of Bangladesh Vector SVG
 * Features the Water Lily (Shapla), Sheaves of Paddy, Jute Leaves and 4 Stars
 * with the Government of Bangladesh circular border.
 */
export const BangladeshGovEmblem: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-12 h-12',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Government of the People's Republic of Bangladesh Seal"
    >
      {/* Outer Green Ring */}
      <circle cx="60" cy="60" r="58" fill="#006A4E" stroke="#C59B27" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="52" fill="#00563F" stroke="#F4F6F8" strokeWidth="1" strokeDasharray="3 2" />

      {/* Red Center Disc (National Flag Emblem Motif) */}
      <circle cx="60" cy="60" r="38" fill="#D92534" stroke="#F59E0B" strokeWidth="1.5" />

      {/* Golden Sheaves of Paddy (Border Wreath) */}
      <path
        d="M26 62 C26 40 40 24 58 20 C46 28 38 42 36 60 Z"
        fill="#F59E0B"
        opacity="0.9"
      />
      <path
        d="M94 62 C94 40 80 24 62 20 C74 28 82 42 84 60 Z"
        fill="#F59E0B"
        opacity="0.9"
      />

      {/* Water Lily (Shapla) Central Flower */}
      {/* Center Petal */}
      <path
        d="M60 38 C56 48 57 60 60 68 C63 60 64 48 60 38 Z"
        fill="#FFFFFF"
      />
      {/* Left Petal */}
      <path
        d="M59 44 C49 50 48 62 56 68 C57 60 58 52 59 44 Z"
        fill="#FEF3C7"
      />
      {/* Right Petal */}
      <path
        d="M61 44 C71 50 72 62 64 68 C63 60 62 52 61 44 Z"
        fill="#FEF3C7"
      />
      {/* Outer Left Leaf */}
      <path
        d="M57 52 C43 56 42 66 53 70 C54 64 56 58 57 52 Z"
        fill="#FDE68A"
      />
      {/* Outer Right Leaf */}
      <path
        d="M63 52 C77 56 78 66 67 70 C66 64 64 58 63 52 Z"
        fill="#FDE68A"
      />

      {/* Ripple Waves Under Water Lily */}
      <path
        d="M40 73 C48 70 52 74 60 72 C68 74 72 70 80 73 C75 76 65 77 60 76 C55 77 45 76 40 73 Z"
        fill="#FFFFFF"
      />
      <path
        d="M45 78 C51 76 55 79 60 78 C65 79 69 76 75 78 C71 80 65 81 60 80 C55 81 49 80 45 78 Z"
        fill="#E2E8F0"
        opacity="0.8"
      />

      {/* Jute Leaves Above (Three Connected Tips) */}
      <path
        d="M60 14 L62 22 L60 20 L58 22 Z"
        fill="#F59E0B"
      />
      <path
        d="M55 17 L59 23 L56 22 L53 23 Z"
        fill="#F59E0B"
      />
      <path
        d="M65 17 L61 23 L64 22 L67 23 Z"
        fill="#F59E0B"
      />

      {/* Four Stars (Two Left, Two Right) representing the 4 Founding Constitutional Principles */}
      <polygon points="41,25 43,28 47,28 44,30 45,34 41,31 38,34 39,30 36,28 40,28" fill="#F59E0B" />
      <polygon points="32,35 34,38 37,38 34,40 35,43 32,41 29,43 30,40 27,38 31,38" fill="#F59E0B" />
      <polygon points="79,25 81,28 85,28 82,30 83,34 79,31 76,34 77,30 74,28 78,28" fill="#F59E0B" />
      <polygon points="88,35 90,38 93,38 90,40 91,43 88,41 85,43 86,40 83,38 87,38" fill="#F59E0B" />

      {/* Bottom Ribbon / Pedestal */}
      <path
        d="M44 87 C54 85 66 85 76 87 L73 91 C65 90 55 90 47 91 Z"
        fill="#F59E0B"
      />
    </svg>
  );
};

/**
 * Official Court Diary Logo Lockup
 */
export const CourtLogo: React.FC<{ className?: string; subtitle?: boolean }> = ({
  className = '',
  subtitle = true
}) => {
  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-[#006A4E] leading-none">
          Court<span className="text-[#D92534] font-black tracking-normal ml-0.5">Diary</span>
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 tracking-wide uppercase">
          JUDICIAL
        </span>
      </div>
      {subtitle && (
        <span className="text-[10px] font-medium text-slate-500 tracking-tight leading-snug mt-0.5">
          Court Case Diary & Management System
        </span>
      )}
    </div>
  );
};

/**
 * Official Government Header Banner styled identically to the government portal
 */
export const GovHeader: React.FC<{ rightContent?: React.ReactNode }> = ({ rightContent }) => {
  return (
    <header className="bg-white border-b border-slate-200 select-none shadow-xs">
      {/* Top Thin Green Strip */}
      <div className="h-1 bg-gradient-to-r from-[#006A4E] via-[#008763] to-[#006A4E]" />

      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 min-w-0">
          <BangladeshGovEmblem className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 drop-shadow-xs" />
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-bold text-[#006A4E] leading-tight flex items-center gap-2">
              <span className="font-extrabold tracking-tight">Court<span className="text-[#D92534]">Diary</span></span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 tracking-wide uppercase">
                JUDICIAL
              </span>
            </div>
            <div className="text-[11px] sm:text-[12px] font-medium text-slate-600 leading-tight mt-0.5">
              Court Case Diary & Judicial Ledger System
            </div>
          </div>
        </div>

        {/* Right Info / Actions */}
        {rightContent ? (
          <div className="shrink-0">{rightContent}</div>
        ) : (
          <div className="hidden lg:flex items-center gap-4 shrink-0 text-right">
            <div className="border-r border-slate-200 pr-4">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Help Desk Hotline</div>
              <div className="text-xs font-bold text-[#006A4E] font-mono">+01726427751</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">System Security</div>
              <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>ISO 27001 Certified</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
