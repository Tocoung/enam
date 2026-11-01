import React, { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  FileText,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertCircle,
  X,
  Info,
} from './icons';
import { ResearchReport, ResearchStatus } from '../types/research';
import {
  fetchCompanyResearch,
  validateTicker,
  EXAMPLE_TICKERS,
} from '../services/researchService';

interface ResearchCopilotProps {
  initialTicker?: string;
  onClearInitialTicker?: () => void;
  onBackToDashboard?: () => void;
}

export const ResearchCopilot: React.FC<ResearchCopilotProps> = ({
  initialTicker,
  onClearInitialTicker,
  onBackToDashboard,
}) => {
  const [tickerInput, setTickerInput] = useState<string>(initialTicker || '');
  const [inputError, setInputError] = useState<string | null>(null);
  const [status, setStatus] = useState<ResearchStatus>('idle');
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trigger search whenever a valid initialTicker is passed in from Dashboard
  useEffect(() => {
    if (initialTicker) {
      setTickerInput(initialTicker);
      executeSearch(initialTicker);
    }
  }, [initialTicker]);

  const executeSearch = async (symbolToSearch: string) => {
    setInputError(null);
    setErrorMessage(null);

    const validation = validateTicker(symbolToSearch);
    if (!validation.isValid) {
      setInputError(validation.error || 'Please enter a valid ticker symbol.');
      setStatus('error');
      return;
    }

    setStatus('loading');

    try {
      const result = await fetchCompanyResearch(validation.normalizedTicker);
      setReport(result);
      setStatus('success');
      setTickerInput(validation.normalizedTicker);
    } catch (err: unknown) {
      setStatus('error');
      const errText =
        err instanceof Error
          ? err.message
          : 'Unable to retrieve company intelligence. Please verify the ticker symbol.';
      setErrorMessage(errText);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return; // Prevent duplicate submissions
    executeSearch(tickerInput);
  };

  const handleSelectExample = (ticker: string) => {
    if (status === 'loading') return;
    setTickerInput(ticker);
    executeSearch(ticker);
  };

  const handleClear = () => {
    setTickerInput('');
    setInputError(null);
    setReport(null);
    setStatus('idle');
    setErrorMessage(null);
    if (onClearInitialTicker) {
      onClearInitialTicker();
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full overflow-x-hidden">
      {/* 1. Research Header & Ticker Search Input */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
                Research Copilot
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                NSE Coverage
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Enter any NSE equity ticker for verified corporate filings, financial disclosures, and evidence-grounded thesis.
            </p>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="self-start md:self-auto text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
            >
              <span>← Back to Dashboard</span>
            </button>
          )}
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={tickerInput}
              onChange={(e) => {
                setTickerInput(e.target.value.toUpperCase());
                if (inputError) setInputError(null);
              }}
              placeholder="Enter NSE ticker (e.g. ZOMATO, BHARTIARTL, RELIANCE, TCS)..."
              disabled={status === 'loading'}
              className={`w-full pl-10 pr-24 py-2.5 sm:py-3 bg-slate-950/90 border rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-60 ${
                inputError
                  ? 'border-rose-500/80 focus:ring-rose-500'
                  : 'border-slate-700/80 hover:border-slate-600'
              }`}
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              {tickerInput && status !== 'loading' && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded text-slate-400 hover:text-slate-200"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !tickerInput.trim()}
                className="px-3.5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-md text-xs font-semibold tracking-wide transition shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Searching...</span>
                  </>
                ) : (
                  <span>Research</span>
                )}
              </button>
            </div>
          </div>

          {/* Inline Validation Error */}
          {inputError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 px-1 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{inputError}</span>
            </div>
          )}

          {/* Clickable Example Tickers */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-slate-400 text-[11px]">Popular examples:</span>
            {EXAMPLE_TICKERS.map((ex) => (
              <button
                key={ex.ticker}
                type="button"
                onClick={() => handleSelectExample(ex.ticker)}
                disabled={status === 'loading'}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition flex items-center gap-1 disabled:opacity-50"
              >
                <span>{ex.ticker}</span>
                {!ex.isPortfolio && (
                  <span className="text-[9px] text-indigo-300 bg-indigo-500/20 px-1 rounded">
                    Non-Portfolio
                  </span>
                )}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* 2. Fact vs Interpretation Legend Banner */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-medium text-slate-300">FINN Research Integrity Protocol:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            <strong className="font-medium">RETRIEVED FACT:</strong> Audited filing or exchange statement
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Sparkles className="w-3 h-3" />
            <strong className="font-medium">ANALYTICAL INTERPRETATION:</strong> Investment hypothesis (not fact)
          </span>
        </div>
      </section>

      {/* 3. Loading State */}
      {status === 'loading' && (
        <div className="py-16 text-center space-y-4 bg-slate-900/30 border border-slate-800/60 rounded-xl">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              Retrieving Corporate Intelligence for {tickerInput}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Scanning audited annual accounts, exchange regulatory disclosures, and segment data...
            </p>
          </div>
        </div>
      )}

      {/* 4. Error State */}
      {status === 'error' && errorMessage && (
        <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-500/30 text-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-sm font-semibold">Research Retrieval Notice</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => executeSearch(tickerInput)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition"
            >
              Retry Query
            </button>
            <a
              href={`https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(
                tickerInput
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 font-medium transition flex items-center gap-1"
            >
              <span>Query on NSE India</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* 5. Empty Initial State */}
      {status === 'idle' && !report && (
        <div className="py-14 px-4 text-center space-y-3 bg-slate-900/20 border border-slate-800/50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Company Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Search any NSE equity ticker above or select one of the suggested companies to view verified filings and structured thesis.
          </p>
        </div>
      )}

      {/* 6. Research Report Sections (Success State) */}
      {status === 'success' && report && (
        <div className="space-y-6">
          {/* Provenance Notice */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">Data Provenance:</span>
              <span className="font-mono text-slate-400">{report.provenanceNote}</span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Retrieved: {report.lastRetrieved}
            </span>
          </div>

          {/* A. Company Overview */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {report.companyOverview.companyName}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                    {report.companyOverview.ticker}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-400">
                  <span>
                    Sector:{' '}
                    <strong className="text-slate-200 font-medium">
                      {report.companyOverview.sector}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Industry:{' '}
                    <strong className="text-slate-200 font-medium">
                      {report.companyOverview.industry}
                    </strong>
                  </span>
                  {report.companyOverview.isin && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-400">
                        ISIN: {report.companyOverview.isin}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>RETRIEVED FACT</span>
                </span>
              </div>
            </div>

            {/* Business Description */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Business Description & Operating Profile
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {report.companyOverview.businessDescription}
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                <span>Source:</span>
                <span className="italic text-slate-400">
                  {report.companyOverview.descriptionSource}
                </span>
              </p>
            </div>
          </section>

          {/* B. Financial Snapshot */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Financial Snapshot & Core Metrics
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Audited & Verified Only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.financialSnapshot.map((metric) => (
                <div
                  key={metric.key}
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-400 font-medium">
                      {metric.name}
                    </span>
                    {metric.isReported ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                        NOT REPORTED
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-base sm:text-lg font-bold font-mono text-white">
                      {metric.formattedValue}
                    </div>
                    {metric.reportingNote && (
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {metric.reportingNote}
                      </p>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{metric.period}</span>
                    <span className="truncate max-w-[140px]" title={metric.source}>
                      {metric.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* C & D: Bull Case and Bear Case (Side-by-side on desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Bull Case */}
            <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Bull Case: Strategic Catalysts
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-medium">
                  ANALYTICAL INTERPRETATION
                </span>
              </div>

              <div className="space-y-3">
                {report.bullCase.map((bull) => (
                  <div
                    key={bull.id}
                    className="p-3.5 rounded-lg bg-slate-950/60 border border-emerald-500/20 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs sm:text-sm font-semibold text-emerald-300">
                        {bull.title}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {bull.thesis}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                      <div>
                        <strong className="text-slate-400">Filed Evidence: </strong>
                        <span className="text-slate-300">{bull.evidence}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Ref: {bull.sourceRef}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bear Case & Risks */}
            <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Bear Case: Key Risks & Vulnerabilities
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-medium">
                  ANALYTICAL INTERPRETATION
                </span>
              </div>

              <div className="space-y-3">
                {report.bearCase.map((bear) => (
                  <div
                    key={bear.id}
                    className="p-3.5 rounded-lg bg-slate-950/60 border border-rose-500/20 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs sm:text-sm font-semibold text-rose-300">
                        {bear.title}
                      </h5>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          bear.severity === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : bear.severity === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {bear.severity} RISK
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {bear.thesis}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                      <div>
                        <strong className="text-slate-400">Documented Evidence: </strong>
                        <span className="text-slate-300">{bear.evidence}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Ref: {bear.sourceRef}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* E. Sources & Regulatory Citations */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Primary Sources & Corporate Disclosures
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Clickable Verified Links
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                          src.type === 'PRIMARY_FILING' || src.type === 'ANNUAL_REPORT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        }`}
                      >
                        {src.type.replace('_', ' ')}
                      </span>
                      {src.publishDate && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {src.publishDate}
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs font-semibold text-white line-clamp-2">
                      {src.title}
                    </h5>

                    {src.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {src.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                      {src.publisher}
                    </span>

                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium text-[11px] transition"
                    >
                      <span>Open Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
