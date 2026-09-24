import React, { useState, useEffect } from 'react';
import { Scale, Minus, Square, X, WifiOff, Clock } from 'lucide-react';
import courtEmblem from '../assets/images/court_emblem_insignia_1790276040697.jpg';

interface Props {
  appName: string;
  courtName?: string;
}

export const DesktopTitleBar: React.FC<Props> = ({ appName, courtName }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      setDateStr(`${day}-${month}-${year}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 bg-neutral-950 text-neutral-300 border-b border-neutral-800 flex items-center justify-between px-3 text-xs select-none shrink-0 z-50">
      {/* App Branding */}
      <div className="flex items-center gap-2">
        <img
          src={courtEmblem}
          alt="Court Seal"
          className="w-4 h-4 rounded-sm object-cover"
          referrerPolicy="no-referrer"
        />
        <span className="font-semibold text-neutral-200 tracking-wide">{appName}</span>
        <span className="text-neutral-500">|</span>
        <span className="text-neutral-400 truncate max-w-sm hidden sm:inline">{courtName || 'Court Case Diary & Management System'}</span>
      </div>

      {/* Offline Status & Live Clock */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Offline SQLite Active</span>
        </div>

        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-neutral-400 tabular-nums">
          <Clock className="w-3 h-3 text-amber-500/80" />
          <span>{dateStr}</span>
          <span className="text-neutral-300 font-medium">{timeStr}</span>
        </div>

        {/* Windows Control Buttons */}
        <div className="flex items-center -mr-2">
          <button
            title="Minimize"
            className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            title="Maximize"
            className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            title="Close application"
            onClick={() => window.close()}
            className="w-8 h-8 flex items-center justify-center hover:bg-red-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
