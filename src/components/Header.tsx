import React from 'react';
import { Sliders, ShieldCheck } from './icons';

interface HeaderProps {
  onOpenSettings: () => void;
  activeThresholdsLabel: string;
  stocksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  activeThresholdsLabel,
  stocksCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Banner: Unmistakable DEMO DATA Warning */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <p className="text-[11px] font-semibold tracking-wide uppercase text-amber-300">
          DEMO DATA PROTOTYPE — Simulated NSE observations for evaluation. Not live trading data.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand & Market Status */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-extrabold text-sm sm:text-base tracking-tighter shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 shrink-0">
            F
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-sans">
                FINN
              </span>
              <span className="text-slate-500 text-xs hidden sm:inline">|</span>
              <span className="text-xs font-medium text-slate-300 hidden sm:inline truncate">
                Institutional Investor Intelligence
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400 whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                NSE Simulated
              </span>
              <span>•</span>
              <span className="font-mono text-slate-400 whitespace-nowrap">{stocksCount} Monitored</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Strict Provenance: DEMO</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/80 transition shadow-sm active:scale-95"
            title="Configure Alert Thresholds"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Thresholds</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {activeThresholdsLabel}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
