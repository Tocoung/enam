import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  HelpCircle,
  ChevronDown,
} from './icons';
import { StockWithMetrics } from '../types/portfolio';
import {
  filterStocks,
  formatRupees,
  formatVolumeCompact,
} from '../services/portfolioMetrics';
import { PORTFOLIO_SECTORS } from '../data/portfolioData';

interface WatchlistProps {
  stocks: StockWithMetrics[];
  onSelectTicker?: (ticker: string) => void;
  selectedTicker?: string;
  volumeRatioThreshold: number;
}

type SortField = 'ticker' | 'price' | 'change' | 'volumeRatio';
type SortOrder = 'asc' | 'desc';

export const Watchlist: React.FC<WatchlistProps> = ({
  stocks,
  onSelectTicker,
  selectedTicker,
  volumeRatioThreshold,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('volumeRatio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter stocks
  const filtered = useMemo(() => {
    return filterStocks(stocks, searchQuery, selectedSector);
  }, [stocks, searchQuery, selectedSector]);

  // Sort stocks
  const sortedStocks = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'ticker':
          comparison = a.ticker.localeCompare(b.ticker);
          break;
        case 'price':
          comparison = (a.currentPrice ?? 0) - (b.currentPrice ?? 0);
          break;
        case 'change':
          comparison = (a.priceChangePercent ?? -999) - (b.priceChangePercent ?? -999);
          break;
        case 'volumeRatio':
          comparison = (a.volumeRatio ?? -1) - (b.volumeRatio ?? -1);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800/90 overflow-hidden shadow-sm flex flex-col w-full">
      {/* Controls Bar: Search, Sector Filter, Sort */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, company or sector..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sector Select */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="relative flex-1 sm:flex-initial min-w-0">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-slate-950/80 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                {PORTFOLIO_SECTORS.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector === 'ALL' ? 'All Sectors' : sector}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
              {sortedStocks.length} of {stocks.length}
            </span>
          </div>
        </div>

        {/* Mobile Fast Sort Bar (Visible on mobile only) */}
        <div className="flex sm:hidden items-center justify-between gap-1 pt-1.5 border-t border-slate-800/60 text-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Sort</span>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'volumeRatio', label: 'Vol Ratio' },
              { id: 'change', label: '1D Move' },
              { id: 'price', label: 'Price' },
              { id: 'ticker', label: 'Ticker' },
            ].map((item) => {
              const isActive = sortField === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => toggleSort(item.id as SortField)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition flex items-center gap-1 whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1. Mobile-First List View (Active on < sm screens: ZERO horizontal overflow) */}
      <div className="block sm:hidden divide-y divide-slate-800/60 w-full">
        {sortedStocks.length === 0 ? (
          <div className="py-10 text-center text-slate-400 p-4">
            <p className="text-sm">No companies match your search or filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSector('ALL');
              }}
              className="mt-2 text-xs text-indigo-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          sortedStocks.map((stock) => {
            const isSelected = selectedTicker === stock.ticker;
            const isUp = (stock.priceChangePercent ?? 0) > 0;
            const isDown = (stock.priceChangePercent ?? 0) < 0;
            const isHighVolume =
              (stock.volumeRatio ?? 0) >= volumeRatioThreshold &&
              !stock.isInsufficientVolumeHistory;

            return (
              <div
                key={stock.ticker}
                onClick={() => onSelectTicker?.(stock.ticker)}
                className={`p-3.5 transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                    : 'hover:bg-slate-850/60 active:bg-slate-800/50'
                }`}
              >
                {/* Left: Ticker, DEMO Tag, Name, Sector */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono font-bold text-sm text-slate-100 tracking-tight">
                      {stock.ticker}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                      DEMO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {stock.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {stock.sector}
                  </p>
                </div>

                {/* Right: Price on top, 1D Move & Volume Ratio on bottom */}
                <div className="flex flex-col items-end shrink-0 text-right">
                  {/* Price */}
                  <div className="font-mono font-bold text-sm text-slate-100">
                    {stock.isMissingPriceData ? (
                      <span className="text-slate-400 text-xs italic">N/A</span>
                    ) : (
                      formatRupees(stock.currentPrice)
                    )}
                  </div>

                  {/* 1D Move & Volume Badge */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {/* 1D Change */}
                    {stock.isMissingPriceData ? (
                      <span className="text-slate-400 text-xs italic">N/A</span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold ${
                          isUp
                            ? 'text-emerald-400'
                            : isDown
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isUp && <TrendingUp className="w-3 h-3" />}
                        {isDown && <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}
                        {stock.priceChangePercent?.toFixed(2)}%
                      </span>
                    )}

                    {/* Volume Ratio Pill */}
                    {stock.isInsufficientVolumeHistory ? (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-mono"
                        title="Insufficient trading history (<20 sessions)"
                      >
                        <AlertCircle className="w-2.5 h-2.5" />
                        &lt;20D
                      </span>
                    ) : stock.volumeRatio !== null ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isHighVolume
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {stock.volumeRatio.toFixed(2)}x
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop & Tablet Table View (Active on sm: and larger screens) */}
      <div className="hidden sm:block overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              <th className="py-2.5 px-3.5">
                <button
                  onClick={() => toggleSort('ticker')}
                  className="flex items-center gap-1 hover:text-slate-200"
                >
                  <span>Company / Ticker</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 hidden md:table-cell">Sector</th>
              <th className="py-2.5 px-3 text-right">
                <button
                  onClick={() => toggleSort('price')}
                  className="inline-flex items-center gap-1 hover:text-slate-200 ml-auto"
                >
                  <span>Price (INR)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button
                  onClick={() => toggleSort('change')}
                  className="inline-flex items-center gap-1 hover:text-slate-200 ml-auto"
                >
                  <span>1D Change</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right hidden md:table-cell">20D Avg Vol</th>
              <th className="py-2.5 px-3 text-right">
                <button
                  onClick={() => toggleSort('volumeRatio')}
                  className="inline-flex items-center gap-1 hover:text-slate-200 ml-auto"
                  title="Session Volume divided by 20-day historical average (excluding current session)"
                >
                  <span>Vol Ratio (20D)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedStocks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <p className="text-sm">No companies match your search or filter.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSector('ALL');
                    }}
                    className="mt-2 text-xs text-indigo-400 hover:underline"
                  >
                    Reset filters
                  </button>
                </td>
              </tr>
            ) : (
              sortedStocks.map((stock) => {
                const isSelected = selectedTicker === stock.ticker;
                const isUp = (stock.priceChangePercent ?? 0) > 0;
                const isDown = (stock.priceChangePercent ?? 0) < 0;
                const isHighVolume =
                  (stock.volumeRatio ?? 0) >= volumeRatioThreshold &&
                  !stock.isInsufficientVolumeHistory;

                return (
                  <tr
                    key={stock.ticker}
                    onClick={() => onSelectTicker?.(stock.ticker)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-850/60'
                    }`}
                  >
                    {/* Ticker & Name */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                              {stock.ticker}
                            </span>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                              DEMO
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
                            {stock.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-2.5 px-3 hidden md:table-cell text-slate-400 text-[11px]">
                      {stock.sector}
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-100">
                      {stock.isMissingPriceData ? (
                        <span className="text-slate-400 text-xs italic">N/A</span>
                      ) : (
                        formatRupees(stock.currentPrice)
                      )}
                    </td>

                    {/* 1D Change */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      {stock.isMissingPriceData ? (
                        <span className="text-slate-400 text-xs italic">N/A</span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span
                            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                              isUp
                                ? 'text-emerald-400'
                                : isDown
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {isUp && <TrendingUp className="w-3 h-3" />}
                            {isDown && <TrendingDown className="w-3 h-3" />}
                            {isUp ? '+' : ''}
                            {stock.priceChangePercent?.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isUp ? '+' : ''}
                            {stock.priceChange?.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 20D Avg Vol */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 hidden md:table-cell">
                      {stock.isInsufficientVolumeHistory ? (
                        <span className="text-amber-400 text-[10px]" title="<20 sessions available">
                          {formatVolumeCompact(stock.avg20dVolume)}*
                        </span>
                      ) : (
                        formatVolumeCompact(stock.avg20dVolume)
                      )}
                    </td>

                    {/* Volume Ratio */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      {stock.isInsufficientVolumeHistory ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
                          title="Insufficient trading history (<20 sessions). Baseline partial."
                        >
                          <AlertCircle className="w-2.5 h-2.5" />
                          &lt;20D Hist
                        </span>
                      ) : stock.volumeRatio !== null ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                              isHighVolume
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'text-slate-300'
                            }`}
                          >
                            {stock.volumeRatio.toFixed(2)}x
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footnote on methodology */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2 break-words">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
          <span>
            Volume ratio = today&apos;s session volume ÷ strictly prior 20 sessions average (excluding today).
          </span>
        </div>
        <div className="text-slate-400 font-mono">
          * Marked rows indicate sample stocks with &lt;20 historical sessions.
        </div>
      </div>
    </div>
  );
};
