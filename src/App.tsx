import { useState, useMemo } from 'react';
import { LayoutDashboard, Bell, SlidersHorizontal, ArrowLeft } from './components/icons';
import { PORTFOLIO_RAW_DATA, DEFAULT_THRESHOLDS } from './data/portfolioData';
import {
  computeStockMetrics,
  deriveAlerts,
} from './services/portfolioMetrics';
import {
  ThresholdConfig,
  AlertFilterCategory,
} from './types/portfolio';
import { Header } from './components/Header';
import { PortfolioSummary } from './components/PortfolioSummary';
import { AlertFeed } from './components/AlertFeed';
import { Watchlist } from './components/Watchlist';
import { ThresholdSettingsModal } from './components/ThresholdSettingsModal';

export default function App() {
  // Configurable alert thresholds
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active view for mobile navigation
  const [mobileTab, setMobileTab] = useState<'watchlist' | 'alerts' | 'overview'>('watchlist');

  // Interactive selection state
  const [selectedTicker, setSelectedTicker] = useState<string | undefined>(undefined);
  const [selectedAlertCategory, setSelectedAlertCategory] = useState<AlertFilterCategory>('ALL');

  // Compute stock metrics (isolated calculation)
  const stocksWithMetrics = useMemo(() => {
    return PORTFOLIO_RAW_DATA.map(computeStockMetrics);
  }, []);

  // Derive alerts dynamically based on user-configured thresholds
  const alerts = useMemo(() => {
    return deriveAlerts(stocksWithMetrics, thresholds);
  }, [stocksWithMetrics, thresholds]);

  const highPriorityCount = useMemo(() => {
    return alerts.filter((a) => a.severity === 'HIGH').length;
  }, [alerts]);

  const handleSelectTicker = (ticker: string) => {
    setSelectedTicker(ticker);
    // On mobile, switch to watchlist to view the selected company
    setMobileTab('watchlist');
  };

  const activeThresholdsLabel = `±${thresholds.priceChangePercentThreshold}% / ${thresholds.volumeRatioThreshold}x`;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16 lg:pb-6 overflow-x-hidden w-full max-w-full">
      {/* 1. Header with Unmistakable DEMO DATA warning */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeThresholdsLabel={activeThresholdsLabel}
        stocksCount={stocksWithMetrics.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5 overflow-x-hidden">
        {/* 2. Portfolio Summary Cards */}
        <PortfolioSummary
          stocks={stocksWithMetrics}
          alerts={alerts}
          volumeThreshold={thresholds.volumeRatioThreshold}
        />

        {/* Selected Ticker Quick Filter Pill (if user clicked from alert) */}
        {selectedTicker && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Inspecting highlighted company:</span>
              <span className="font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/20">
                {selectedTicker}
              </span>
            </div>
            <button
              onClick={() => setSelectedTicker(undefined)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Clear selection</span>
            </button>
          </div>
        )}

        {/* 3. Main Workspace: Dual-Pane on Desktop / Tabbed on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left/Main Column: Watchlist (Desktop: 7 or 8 cols, Mobile: when 'watchlist' or 'overview' tab active) */}
          <section
            className={`lg:col-span-8 space-y-4 ${
              mobileTab === 'alerts' ? 'hidden lg:block' : 'block'
            }`}
          >
            <Watchlist
              stocks={stocksWithMetrics}
              selectedTicker={selectedTicker}
              onSelectTicker={handleSelectTicker}
              volumeRatioThreshold={thresholds.volumeRatioThreshold}
            />
          </section>

          {/* Right Column: Priority Alert Feed (Desktop: 4 cols, Mobile: when 'alerts' or 'overview' tab active) */}
          <section
            className={`lg:col-span-4 ${
              mobileTab === 'watchlist' ? 'hidden lg:block' : 'block'
            }`}
          >
            <AlertFeed
              alerts={alerts}
              selectedCategory={selectedAlertCategory}
              onSelectCategory={setSelectedAlertCategory}
              onSelectTicker={handleSelectTicker}
            />
          </section>
        </div>
      </main>

      {/* 4. Settings Modal for Configurable Price & Volume Thresholds */}
      <ThresholdSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        thresholds={thresholds}
        onUpdateThresholds={setThresholds}
        activeAlertCount={alerts.length}
        highPriorityCount={highPriorityCount}
      />

      {/* 5. Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => setMobileTab('watchlist')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            mobileTab === 'watchlist' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Watchlist</span>
        </button>

        <button
          onClick={() => setMobileTab('alerts')}
          className={`relative flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            mobileTab === 'alerts' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alerts</span>
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold">
              {alerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Thresholds</span>
        </button>
      </nav>
    </div>
  );
}
