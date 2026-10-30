import { useState } from 'react';
import { TrendingUp, Bell, Search, Activity, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'alerts' | 'research'>('portfolio');

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-950 text-slate-100 border-x border-slate-800 shadow-2xl">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
            F
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight tracking-tight">FINN</h1>
            <p className="text-[10px] text-slate-400 font-medium">Investor Intelligence • NSE</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Demo Mode
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-20 space-y-4 overflow-y-auto">
        <div className="rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Environment Ready</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-white">FINN Intelligence Core</h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Development workflow established. Mobile-first investor intelligence engine initialized for 15–20 NSE portfolio tracking, real-time volume alerts, exchange announcements, and deep ticker research.
          </p>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] text-slate-400">Portfolio</p>
            <p className="text-sm font-bold text-slate-200 mt-0.5">18 Stocks</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] text-slate-400">Volume Alert</p>
            <p className="text-sm font-bold text-amber-400 mt-0.5">3 Active</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] text-slate-400">Filings Feed</p>
            <p className="text-sm font-bold text-indigo-400 mt-0.5">Updated</p>
          </div>
        </div>

        {/* Tab Preview */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-200 font-semibold mb-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Workflow Status</span>
          </div>
          <p>
            Vite + React + TypeScript + Tailwind CSS dev server ready. Next step: Implement P0 portfolio data feed and announcement prioritization.
          </p>
        </div>
      </main>

      {/* Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-2 flex items-center justify-around z-20">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activeTab === 'portfolio' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Portfolio</span>
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activeTab === 'alerts' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Alerts</span>
        </button>
        <button
          onClick={() => setActiveTab('research')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activeTab === 'research' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Research</span>
        </button>
      </nav>
    </div>
  );
}
