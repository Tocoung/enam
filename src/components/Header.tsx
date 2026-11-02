import React from 'react';
import { Sliders, ShieldCheck, LayoutDashboard, Sparkles, Newspaper } from './icons';
import { PortfolioDataMode } from '../types/portfolio';

interface HeaderProps {
  onOpenSettings: () => void;
  activeThresholdsLabel: string;
  stocksCount: number;
  realStocksCount: number;
  portfolioMode: PortfolioDataMode;
  onSelectPortfolioMode: (mode: PortfolioDataMode) => void;
  snapshotAsOfDate?: string | null;
  snapshotRetrievedAt?: string;
  activePage: 'dashboard' | 'research' | 'announcements';
  onSelectPage: (page: 'dashboard' | 'research' | 'announcements') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  activeThresholdsLabel,
  stocksCount,
  realStocksCount,
  portfolioMode,
  onSelectPortfolioMode,
  snapshotAsOfDate,
  snapshotRetrievedAt: _snapshotRetrievedAt,
  activePage,
  onSelectPage,
}) => {
  const isReal = portfolioMode === 'REAL_EOD';

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Banner: Dynamic Provenance & Market Attribution */}
      {isReal ? (
        <div className="bg-indigo-950/60 border-b border-indigo-500/30 px-4 py-1.5 text-center flex items-center justify-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-indigo-200">
            YAHOO FINANCE HISTORICAL EOD DATA — {realStocksCount} of {stocksCount} positions use historical market observations as of {snapshotAsOfDate || 'settled session'}. Remaining positions use clearly labelled demo fallback data. Not live prices.
          </p>
        </div>
      ) : (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center flex items-center justify-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-amber-300">
            DEMO DATA — Simulated portfolio observations. Not live trading data.
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Market Status */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            onClick={() => onSelectPage('dashboard')}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-extrabold text-sm sm:text-base tracking-tighter shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 shrink-0 cursor-pointer"
          >
            F
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectPage('dashboard')}
                className="text-base font-bold tracking-tight text-white font-sans hover:text-indigo-300 transition text-left"
              >
                FINN
              </button>
              <span className="text-slate-500 text-xs hidden sm:inline">|</span>
              <span className="text-xs font-medium text-slate-300 hidden sm:inline truncate">
                Institutional Investor Intelligence
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              {isReal ? (
                <>
                  <span className="inline-flex items-center gap-1 text-emerald-400 whitespace-nowrap font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Yahoo Finance EOD
                  </span>
                  <span>•</span>
                  <span className="font-mono text-indigo-300 whitespace-nowrap">
                    {realStocksCount}/{stocksCount} Real EOD
                  </span>
                  {snapshotAsOfDate && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-400 whitespace-nowrap">
                        As-of {snapshotAsOfDate}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 text-amber-400 whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                    Simulated Portfolio
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-400 whitespace-nowrap">
                    {stocksCount} Monitored
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Primary Page Navigation Tabs (Desktop / Tablet) */}
        <nav className="hidden sm:flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => onSelectPage('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activePage === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectPage('research')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activePage === 'research'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Research</span>
            <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              NSE
            </span>
          </button>

          <button
            onClick={() => onSelectPage('announcements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activePage === 'announcements'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Announcements</span>
            <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              LODR
            </span>
          </button>
        </nav>

        {/* Mode Selector & Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dual-Mode Selector: DEMO / REAL EOD */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => onSelectPortfolioMode('DEMO')}
              className={`px-2.5 py-1 rounded-md transition-all text-xs font-semibold ${
                !isReal
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Simulated Demo Data Mode"
            >
              DEMO
            </button>
            <button
              onClick={() => onSelectPortfolioMode('REAL_EOD')}
              className={`px-2.5 py-1 rounded-md transition-all text-xs font-semibold ${
                isReal
                  ? 'bg-indigo-600 text-white border border-indigo-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Yahoo Finance Historical EOD Data Mode"
            >
              REAL EOD
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
            <ShieldCheck className={`w-3.5 h-3.5 ${isReal ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>
              {isReal
                ? `Yahoo Finance EOD (${snapshotAsOfDate || 'settled'})`
                : 'Strict Provenance: DEMO'}
            </span>
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
