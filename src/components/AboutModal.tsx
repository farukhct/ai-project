import React from 'react';
import { X, Database, ShieldCheck, HardDrive, Cpu, ExternalLink } from 'lucide-react';
import courtEmblem from '../assets/images/court_emblem_insignia_1790276040697.jpg';
import benchBanner from '../assets/images/courtroom_bench_banner_1790276054267.jpg';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  appSubtitle: string;
  courtName: string;
}

export const AboutModal: React.FC<Props> = ({
  isOpen,
  onClose,
  appName,
  appSubtitle,
  courtName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Banner image */}
        <div className="relative h-32 w-full overflow-hidden">
          <img
            src={benchBanner}
            alt="Judicial Bench"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent"></div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full bg-black/60 text-neutral-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center gap-3 -mt-8 relative z-10">
            <img
              src={courtEmblem}
              alt="Judicial Insignia"
              className="w-14 h-14 rounded-lg border-2 border-neutral-700 object-cover shadow-lg"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base font-bold text-neutral-100 font-serif tracking-tight">
                {appName}
              </h2>
              <div className="text-[11px] text-amber-400 font-medium">
                {appSubtitle}
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-2">
            <div className="text-neutral-300">
              <strong>Institution:</strong> {courtName}
            </div>
            <div className="text-neutral-400 leading-relaxed">
              Professional offline court case diary & proceeding management system engineered for bench officers, readers, and judicial administrative registries.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                <span>Primary Database</span>
              </span>
              <span className="font-mono text-neutral-200 font-semibold">SQLite (CourtDairy.db)</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Operating Mode</span>
              </span>
              <span className="text-emerald-400 font-semibold">100% Offline-First</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block">Date Representation</span>
              <span className="font-mono text-neutral-200 font-semibold">DD-MM-YYYY Display</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block">Version & Edition</span>
              <span className="font-mono text-neutral-200 font-semibold">v1.0.0 Desktop Standalone</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <span className="text-neutral-500 text-[10px]">
            © 2026 Judicial Registry. All rights reserved.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
