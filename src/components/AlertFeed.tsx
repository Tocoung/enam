import React from 'react';
import { TrendingUp, Zap, CheckCircle2 } from './icons';
import { PortfolioAlert, AlertFilterCategory } from '../types/portfolio';
import { filterAlerts } from '../services/portfolioMetrics';

interface AlertFeedProps {
  alerts: PortfolioAlert[];
  selectedCategory: AlertFilterCategory;
  onSelectCategory: (category: AlertFilterCategory) => void;
  onSelectTicker?: (ticker: string) => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  alerts,
  selectedCategory,
  onSelectCategory,
  onSelectTicker,
}) => {
  const filteredAlerts = filterAlerts(alerts, selectedCategory);

  const categories: { id: AlertFilterCategory; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: alerts.length },
    {
      id: 'HIGH_PRIORITY',
      label: 'High Priority',
      count: alerts.filter((a) => a.severity === 'HIGH').length,
    },
    {
      id: 'PRICE_MOVEMENT',
      label: 'Price Movement',
      count: alerts.filter((a) => a.type === 'PRICE_MOVEMENT').length,
    },
    {
      id: 'UNUSUAL_VOLUME',
      label: 'Unusual Volume',
      count: alerts.filter((a) => a.type === 'UNUSUAL_VOLUME').length,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800/90 overflow-hidden shadow-sm">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Priority Alert Feed
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredAlerts.length} Active
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-indigo-700/80 text-white'
                      : 'bg-slate-700/60 text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No active alerts in this category</p>
            <p className="text-xs text-slate-400 max-w-xs">
              All monitored portfolio equities are trading within standard price and volume thresholds.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isHigh = alert.severity === 'HIGH';
            const isPrice = alert.type === 'PRICE_MOVEMENT';

            return (
              <div
                key={alert.id}
                onClick={() => onSelectTicker?.(alert.ticker)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isHigh
                    ? 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
                }`}
              >
                {/* Alert Top Meta */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                        isHigh
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono flex items-center gap-1">
                      {isPrice ? (
                        <TrendingUp className="w-2.5 h-2.5 text-indigo-400" />
                      ) : (
                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                      )}
                      {isPrice ? 'Price Move' : 'Volume Surge'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400">
                      {alert.timestamp}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                      DEMO
                    </span>
                  </div>
                </div>

                {/* Title & Ticker */}
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono font-bold text-sm text-slate-100 hover:text-indigo-400 transition-colors">
                      {alert.ticker}
                    </span>
                    <span className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                      {alert.companyName}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                      isPrice
                        ? alert.metricValue.startsWith('+')
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {alert.metricValue}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mt-1 leading-snug">
                  {alert.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
