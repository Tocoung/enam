import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Bell, SlidersHorizontal, ArrowLeft, Sparkles, Newspaper, Users } from './components/icons';
import { DEFAULT_THRESHOLDS } from './data/portfolioData';
import {
  computeStockMetrics,
  deriveAlerts,
} from './services/portfolioMetrics';
import {
  getPortfolioStocks,
  getSnapshotMetadata,
  getPortfolioCoverage,
} from './services/portfolioService';
import {
  ThresholdConfig,
  AlertFilterCategory,
  PortfolioDataMode,
} from './types/portfolio';
import {
  AppPage,
  NavigationState,
  parseNavigationFromUrl,
  buildUrlForNavigation,
  isRedundantNavigation,
} from './services/navigationService';
import { Header } from './components/Header';
import { PortfolioSummary } from './components/PortfolioSummary';
import { AlertFeed } from './components/AlertFeed';
import { Watchlist } from './components/Watchlist';
import { ThresholdSettingsModal } from './components/ThresholdSettingsModal';
import { ResearchCopilot } from './components/ResearchCopilot';
import { AnnouncementFeed } from './components/AnnouncementFeed';
import { NetworkView } from './components/NetworkView';

export default function App() {
  // Initial navigation state parsed from window.location.search
  const initialNav = useMemo(() => {
    if (typeof window !== 'undefined') {
      return parseNavigationFromUrl(window.location.search);
    }
    return { page: 'dashboard' as AppPage };
  }, []);

  // Navigation state between Dashboard, Research Copilot, Announcements, and Network
  const [activePage, setActivePage] = useState<AppPage>(initialNav.page);

  const [researchTicker, setResearchTicker] = useState<string | undefined>(
    initialNav.page === 'research' ? initialNav.ticker : undefined
  );

  const [announcementFilterTicker, setAnnouncementFilterTicker] = useState<string | undefined>(
    initialNav.page === 'announcements' ? initialNav.ticker : undefined
  );

  // Synchronize URL and React state on user navigation
  const navigateTo = (
    targetPage: AppPage,
    targetTicker?: string,
    replace = false
  ) => {
    const currentTicker =
      activePage === 'research'
        ? researchTicker
        : activePage === 'announcements'
        ? announcementFilterTicker
        : undefined;

    const targetState: NavigationState = {
      page: targetPage,
      ticker: targetTicker ? targetTicker.trim().toUpperCase() : undefined,
    };

    // Avoid updating history unnecessarily when the requested page and ticker are already active
    if (isRedundantNavigation({ page: activePage, ticker: currentTicker }, targetState)) {
      return;
    }

    if (typeof window !== 'undefined') {
      const targetUrl = buildUrlForNavigation(targetState, window.location.pathname);
      if (replace) {
        window.history.replaceState(targetState, '', targetUrl);
      } else {
        window.history.pushState(targetState, '', targetUrl);
      }
    }

    setActivePage(targetState.page);
    if (targetState.page === 'research') {
      setResearchTicker(targetState.ticker);
      setAnnouncementFilterTicker(undefined);
    } else if (targetState.page === 'announcements') {
      setAnnouncementFilterTicker(targetState.ticker);
      setResearchTicker(undefined);
    } else {
      setResearchTicker(undefined);
      setAnnouncementFilterTicker(undefined);
    }
  };

  // Support browser Back/Forward navigation by listening to popstate
  useEffect(() => {
    const handlePopState = () => {
      const nav = parseNavigationFromUrl(window.location.search);
      setActivePage(nav.page);
      if (nav.page === 'research') {
        setResearchTicker(nav.ticker);
        setAnnouncementFilterTicker(undefined);
      } else if (nav.page === 'announcements') {
        setAnnouncementFilterTicker(nav.ticker);
        setResearchTicker(undefined);
      } else {
        setResearchTicker(undefined);
        setAnnouncementFilterTicker(undefined);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // User-selectable portfolio data mode: default is DEMO
  const [portfolioMode, setPortfolioMode] = useState<PortfolioDataMode>('DEMO');

  // Metadata from bundled historical EOD snapshot
  const snapshotMeta = useMemo(() => getSnapshotMetadata(), []);

  // Configurable alert thresholds
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active view for mobile navigation within dashboard
  const [mobileTab, setMobileTab] = useState<'watchlist' | 'alerts' | 'overview'>('watchlist');

  // Interactive selection state
  const [selectedTicker, setSelectedTicker] = useState<string | undefined>(undefined);
  const [selectedAlertCategory, setSelectedAlertCategory] = useState<AlertFilterCategory>('ALL');

  // Derive portfolio raw stocks based on selected mode (DEMO vs REAL_EOD)
  const portfolioRawStocks = useMemo(() => {
    return getPortfolioStocks(portfolioMode);
  }, [portfolioMode]);

  // Compute stock metrics (isolated calculation)
  const stocksWithMetrics = useMemo(() => {
    return portfolioRawStocks.map(computeStockMetrics);
  }, [portfolioRawStocks]);

  // Coverage counts across the portfolio
  const coverage = useMemo(() => {
    return getPortfolioCoverage(portfolioRawStocks);
  }, [portfolioRawStocks]);

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
    navigateTo('research', ticker);
  };

  const handleOpenAnnouncements = (ticker?: string) => {
    navigateTo('announcements', ticker);
  };

  const activeThresholdsLabel = `±${thresholds.priceChangePercentThreshold}% / ${thresholds.volumeRatioThreshold}x`;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16 lg:pb-6 overflow-x-hidden w-full max-w-full">
      {/* 1. Header with Mode Selector, Dynamic Provenance Warning & Page Navigation */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeThresholdsLabel={activeThresholdsLabel}
        stocksCount={stocksWithMetrics.length}
        realStocksCount={coverage.realCount}
        portfolioMode={portfolioMode}
        onSelectPortfolioMode={setPortfolioMode}
        snapshotAsOfDate={snapshotMeta.asOfDate}
        snapshotRetrievedAt={snapshotMeta.retrievedAt}
        activePage={activePage}
        onSelectPage={(page) => {
          navigateTo(page);
        }}
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
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenResearch(selectedTicker)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 px-2.5 py-1 rounded border border-indigo-500/30 transition shadow-sm"
                    title={`Inspect comprehensive research dossier for ${selectedTicker}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Deep Research in Copilot →</span>
                  </button>
                  <button
                    onClick={() => handleOpenAnnouncements(selectedTicker)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-300 hover:text-white bg-sky-500/20 hover:bg-sky-500/30 px-2.5 py-1 rounded border border-sky-500/30 transition shadow-sm"
                    title={`View statutory filings and corporate announcements for ${selectedTicker}`}
                  >
                    <Newspaper className="w-3.5 h-3.5 text-sky-400" />
                    <span>View Filings →</span>
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
        ) : activePage === 'research' ? (
          /* Research Copilot Page */
          <ResearchCopilot
            initialTicker={researchTicker}
            onClearInitialTicker={() => {
              setResearchTicker(undefined);
              if (typeof window !== 'undefined') {
                window.history.replaceState(
                  { page: 'research' },
                  '',
                  buildUrlForNavigation({ page: 'research' }, window.location.pathname)
                );
              }
            }}
            onOpenAnnouncements={handleOpenAnnouncements}
            onBackToDashboard={() => navigateTo('dashboard')}
          />
        ) : activePage === 'announcements' ? (
          /* Corporate Announcement Intelligence Feed */
          <AnnouncementFeed
            initialTicker={announcementFilterTicker}
            onClearFilter={() => {
              setAnnouncementFilterTicker(undefined);
              if (typeof window !== 'undefined') {
                window.history.replaceState(
                  { page: 'announcements' },
                  '',
                  buildUrlForNavigation({ page: 'announcements' }, window.location.pathname)
                );
              }
            }}
            onOpenResearch={handleOpenResearch}
          />
        ) : (
          /* Network Intelligence Interface */
          <NetworkView />
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-1 py-2 grid grid-cols-6 items-center justify-items-center">
        <button
          onClick={() => {
            navigateTo('dashboard');
            setMobileTab('watchlist');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors w-full ${
            activePage === 'dashboard' && mobileTab === 'watchlist'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="truncate">Dashboard</span>
        </button>

        <button
          onClick={() => {
            navigateTo('dashboard');
            setMobileTab('alerts');
          }}
          className={`relative flex flex-col items-center gap-1 text-[10px] font-medium transition-colors w-full ${
            activePage === 'dashboard' && mobileTab === 'alerts'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span className="truncate">Alerts</span>
          {alerts.length > 0 && (
            <span className="absolute -top-1 right-2 sm:right-4 px-1 py-0.2 rounded-full bg-rose-500 text-white text-[8px] font-mono font-bold leading-none">
              {alerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => navigateTo('research')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors w-full ${
            activePage === 'research'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="truncate">Research</span>
        </button>

        <button
          onClick={() => navigateTo('announcements')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors w-full ${
            activePage === 'announcements'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span className="truncate">Filings</span>
        </button>

        <button
          onClick={() => navigateTo('network')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors w-full ${
            activePage === 'network'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="truncate">Network</span>
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-colors w-full"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="truncate">Rules</span>
        </button>
      </nav>
    </div>
  );
}
