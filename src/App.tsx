import { useState, useMemo } from 'react';
import { LayoutDashboard, Bell, SlidersHorizontal, ArrowLeft, Sparkles } from './components/icons';
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
import { ResearchCopilot } from './components/ResearchCopilot';

export default function App() {
  // Navigation state between Dashboard and Research Copilot (supports URL parameters for deep-linking)
  const [activePage, setActivePage] = useState<'dashboard' | 'research'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ticker') || params.get('page') === 'research') {
        return 'research';
      }
    }
    return 'dashboard';
  });

  const [researchTicker, setResearchTicker] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('ticker');
      if (t) return t.toUpperCase();
    }
    return undefined;
  });

  // Configurable alert thresholds
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active view for mobile navigation within dashboard
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

  const handleOpenResearch = (ticker: string) => {
    setResearchTicker(ticker);
    setActivePage('research');
  };

  const activeThresholdsLabel = `±${thresholds.priceChangePercentThreshold}% / ${thresholds.volumeRatioThreshold}x`;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16 lg:pb-6 overflow-x-hidden w-full max-w-full">
      {/* 1. Header with Unmistakable DEMO DATA warning & Page Navigation */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeThresholdsLabel={activeThresholdsLabel}
        stocksCount={stocksWithMetrics.length}
        activePage={activePage}
        onSelectPage={setActivePage}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5 overflow-x-hidden">
        {activePage === 'dashboard' ? (
          <>
            {/* 2. Portfolio Summary Cards */}
            <PortfolioSummary
              stocks={stocksWithMetrics}
              alerts={alerts}
              volumeThreshold={thresholds.volumeRatioThreshold}
            />

            {/* Selected Ticker Quick Filter Pill (if user clicked from alert) */}
            {selectedTicker && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Inspecting highlighted company:</span>
                  <span className="font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/20">
                    {selectedTicker}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenResearch(selectedTicker)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 px-2.5 py-1 rounded border border-indigo-500/30 transition shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Deep Research in Copilot →</span>
                  </button>
                  <button
                    onClick={() => setSelectedTicker(undefined)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Clear selection</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Main Workspace: Dual-Pane on Desktop / Tabbed on Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left/Main Column: Watchlist */}
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

              {/* Right Column: Priority Alert Feed */}
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
          </>
        ) : (
          /* Research Copilot Page */
          <ResearchCopilot
            initialTicker={researchTicker}
            onClearInitialTicker={() => setResearchTicker(undefined)}
            onBackToDashboard={() => setActivePage('dashboard')}
          />
        )}
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
          onClick={() => {
            setActivePage('dashboard');
            setMobileTab('watchlist');
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activePage === 'dashboard' && mobileTab === 'watchlist'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => {
            setActivePage('dashboard');
            setMobileTab('alerts');
          }}
          className={`relative flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activePage === 'dashboard' && mobileTab === 'alerts'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
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
          onClick={() => setActivePage('research')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activePage === 'research'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Research</span>
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
