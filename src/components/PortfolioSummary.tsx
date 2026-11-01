import React from 'react';
import { TrendingUp, TrendingDown, BellRing, Activity } from './icons';
import { StockWithMetrics, PortfolioAlert } from '../types/portfolio';

interface PortfolioSummaryProps {
  stocks: StockWithMetrics[];
  alerts: PortfolioAlert[];
  volumeThreshold: number;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  stocks,
  alerts,
  volumeThreshold,
}) => {
  // Unique sectors count
  const uniqueSectorsCount = new Set(stocks.map((s) => s.sector)).size;
  const advancers = stocks.filter((s) => s.priceChangePercent !== null && s.priceChangePercent > 0).length;
  const decliners = stocks.filter((s) => s.priceChangePercent !== null && s.priceChangePercent < 0).length;
  const unchanged = stocks.filter((s) => s.priceChangePercent !== null && s.priceChangePercent === 0).length;

  // Alerts breakdown
  const highPriorityCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const unusualVolumeCount = stocks.filter(
    (s) => (s.volumeRatio ?? 0) >= volumeThreshold && !s.isInsufficientVolumeHistory
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Tracked Coverage */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Coverage</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">NSE Bluechip</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold font-mono text-white">{stocks.length}</span>
          <span className="text-xs text-slate-400">Equities</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Across {uniqueSectorsCount} core NSE sectors</p>
      </div>

      {/* 2. Market Breadth */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Market Breadth</span>
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="flex items-baseline gap-3 mt-1">
          <span className="flex items-center gap-1 text-sm font-mono font-semibold text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            {advancers} Up
          </span>
          <span className="flex items-center gap-1 text-sm font-mono font-semibold text-rose-400">
            <TrendingDown className="w-3.5 h-3.5" />
            {decliners} Down
          </span>
          {unchanged > 0 && (
            <span className="text-xs font-mono text-slate-400">
              {unchanged} Flat
            </span>
          )}
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${(advancers / stocks.length) * 100}%` }}
          />
          <div
            className="bg-rose-500 h-full"
            style={{ width: `${(decliners / stocks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. Priority Alerts */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Priority Alerts</span>
          <BellRing className={`w-3.5 h-3.5 ${highPriorityCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold font-mono text-white">{alerts.length}</span>
          <span className="text-xs font-mono text-amber-400">({highPriorityCount} High)</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Threshold-derived signals</p>
      </div>

      {/* 4. Volume Outliers */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Volume Outliers</span>
          <span className="text-[10px] font-mono text-indigo-400">≥ {volumeThreshold}x 20D</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold font-mono text-white">{unusualVolumeCount}</span>
          <span className="text-xs text-slate-400">Surge Equities</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Exceeding 20-session baseline</p>
      </div>
    </div>
  );
};
