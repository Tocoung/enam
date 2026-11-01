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
          : 'Unable to evaluate ticker symbol. Please try again.';
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
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Filing Integrity Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Enter any NSE equity ticker to inspect pre-ingested corporate filings or launch official exchange lookup workflows.
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
                    <span className="hidden sm:inline">Evaluating...</span>
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

      {/* 2. Provenance Badge Taxonomy Banner */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-medium text-slate-300">Data Integrity Protocol:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            <strong className="font-semibold">CURATED FILING DATA</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            <strong className="font-semibold">LOCAL SYMBOL REGISTRY</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            <strong className="font-semibold">IDENTITY NOT VERIFIED</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <strong className="font-semibold">ANALYTICAL INTERPRETATION</strong>
          </span>
        </div>
      </section>

      {/* 3. Loading State */}
      {status === 'loading' && (
        <div className="py-16 text-center space-y-4 bg-slate-900/30 border border-slate-800/60 rounded-xl">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              Evaluating Ticker Format and Security Identity for {tickerInput}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Checking FINN local symbol registry and pre-ingested corporate filings...
            </p>
          </div>
        </div>
      )}

      {/* 4. Error State */}
      {status === 'error' && errorMessage && (
        <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-500/30 text-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-sm font-semibold">Ticker Evaluation Notice</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => executeSearch(tickerInput)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition"
            >
              Retry
            </button>
            <a
              href={`https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(
                tickerInput
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 font-medium transition flex items-center gap-1"
            >
              <span>Verify on NSE India Portal</span>
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
          <h3 className="text-sm font-semibold text-white">No Security Selected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Search any NSE equity ticker above or click an example company to inspect pre-ingested filing disclosures or launch external verification queries.
          </p>
        </div>
      )}

      {/* 6. Success State: Curated Coverage vs Unindexed Coverage */}
      {status === 'success' && report && (
        <div className="space-y-6">
          {/* Top Provenance Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-300 font-medium whitespace-nowrap">Status:</span>
              <span
                className={`font-mono text-[11px] px-2 py-0.5 rounded uppercase font-bold border ${
                  report.provenance === 'CURATED_FILING_DATA'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : report.provenance === 'SYMBOL_FOUND_IN_LOCAL_REGISTRY'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                {report.provenanceLabel}
              </span>
              <span className="text-slate-400 truncate text-[11px] hidden md:inline">
                {report.provenanceNote}
              </span>
            </div>

            {/* Accurate Filing / Dataset Period Semantics (Never show fake 'Retrieved: Today') */}
            {report.filingPeriod && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {report.filingPeriod}
                </span>
                {report.dataAsOf && (
                  <span className="hidden lg:inline text-slate-400">
                    Filing Date: {report.dataAsOf}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BRANCH A: CURATED DOSSIER (Verified company with pre-ingested filings) */}
          {/* ========================================================================= */}
          {report.hasCuratedCoverage && report.companyOverview && (
            <>
              {/* Company Overview Card */}
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
                    <span className="px-2 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-medium flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3 h-3" />
                      <span>CURATED FILING DATA</span>
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

              {/* Financial Snapshot */}
              <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Financial Snapshot & Core Metrics
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Pre-Ingested from Audited Reports
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {report.financialSnapshot.map((metric) => {
                    const sourceObj = report.sources?.find((s) => s.id === metric.sourceId);
                    return (
                      <div
                        key={metric.key}
                        className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-slate-400 font-medium">
                            {metric.name}
                          </span>
                          {metric.status === 'CURATED_FILING_DATA' ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0 font-semibold">
                              CURATED FILING DATA
                            </span>
                          ) : metric.status === 'EXEMPT_NOT_APPLICABLE' ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0 font-semibold">
                              EXEMPT / BANKING
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0 font-semibold">
                              NOT INGESTED
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
                          {sourceObj ? (
                            <a
                              href={sourceObj.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate max-w-[140px] text-indigo-400 hover:text-indigo-300 transition"
                              title={`${metric.source} (Source: ${sourceObj.title})`}
                            >
                              {metric.source}
                            </a>
                          ) : (
                            <span className="truncate max-w-[140px]" title={metric.source}>
                              {metric.source}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Bull and Bear Cases */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* Bull Case */}
                {report.bullCase && (
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
                      {report.bullCase.map((bull) => {
                        const linkedSource = report.sources?.find((s) => s.id === bull.sourceId);
                        return (
                          <div
                            key={bull.id}
                            className="p-3.5 rounded-lg bg-slate-950/60 border border-emerald-500/20 space-y-2"
                          >
                            <h5 className="text-xs sm:text-sm font-semibold text-emerald-300">
                              {bull.title}
                            </h5>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {bull.thesis}
                            </p>
                            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                              <div>
                                <strong className="text-slate-400">Filed Evidence: </strong>
                                <span className="text-slate-300">{bull.evidence}</span>
                              </div>
                              <div className="text-[10px] font-mono flex items-center justify-between pt-0.5">
                                {linkedSource ? (
                                  <a
                                    href={linkedSource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-400 hover:text-indigo-300 transition truncate max-w-[280px] inline-flex items-center gap-1"
                                    title={linkedSource.title}
                                  >
                                    <span>Source: {linkedSource.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  </a>
                                ) : (
                                  <span className="text-slate-400">Source ID: {bull.sourceId}</span>
                                )}
                                {bull.sourceDetail && (
                                  <span className="text-slate-400 italic shrink-0">
                                    {bull.sourceDetail}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Bear Case */}
                {report.bearCase && (
                  <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          Bear Case: Key Risks & Uncertainties
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-medium">
                        ANALYTICAL INTERPRETATION
                      </span>
                    </div>

                    <div className="space-y-3">
                      {report.bearCase.map((bear) => {
                        const linkedSource = report.sources?.find((s) => s.id === bear.sourceId);
                        return (
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
                              <div className="text-[10px] font-mono flex items-center justify-between pt-0.5">
                                {linkedSource ? (
                                  <a
                                    href={linkedSource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-400 hover:text-indigo-300 transition truncate max-w-[280px] inline-flex items-center gap-1"
                                    title={linkedSource.title}
                                  >
                                    <span>Source: {linkedSource.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  </a>
                                ) : (
                                  <span className="text-slate-400">Source ID: {bear.sourceId}</span>
                                )}
                                {bear.sourceDetail && (
                                  <span className="text-slate-400 italic shrink-0">
                                    {bear.sourceDetail}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              {/* Sources */}
              {report.sources && (
                <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Primary Filings & Cited Corporate Disclosures
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Direct Verified URLs
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
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
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
                            <span>Open Repository</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* BRANCH B: UNINDEXED OR UNVERIFIED TICKER (Transparent Honest State) */}
          {/* ========================================================================= */}
          {!report.hasCuratedCoverage && (
            <div className="space-y-6">
              {/* Honest Research Unavailable State */}
              <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Research coverage unavailable
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                      FINN accepts this ticker format, but the company identity and financial disclosures are not currently indexed in the research dataset.
                    </p>
                  </div>

                  {/* Identity Verification Badge */}
                  <div className="shrink-0">
                    {report.identityStatus === 'SYMBOL_FOUND_IN_LOCAL_REGISTRY' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                        <span>FOUND IN FINN LOCAL SYMBOL REGISTRY</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                        <span>IDENTITY NOT VERIFIED</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Audit Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                      Submitted Ticker
                    </span>
                    <div className="font-mono text-base font-bold text-white flex items-center gap-2">
                      <span>{report.ticker}</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Format Valid
                      </span>
                    </div>
                    {report.localRegistrySecurityName && (
                      <p className="text-[11px] text-amber-300 truncate font-sans">
                        Local List: {report.localRegistrySecurityName}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                      Identity Verification Status
                    </span>
                    <div className="text-xs text-slate-200 font-medium">
                      {report.identityStatus === 'SYMBOL_FOUND_IN_LOCAL_REGISTRY'
                        ? 'Found in FINN Local Symbol List'
                        : 'No Match in Local Registry'}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {report.identityMessage}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                      Financial Filing Status
                    </span>
                    <div className="font-mono text-xs font-semibold text-slate-300">
                      METRIC NOT INGESTED
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      FINN has not retrieved, audited, or analysed this company’s statutory filings.
                    </p>
                  </div>
                </div>
              </section>

              {/* Financial Snapshot (All marked strictly NOT INGESTED) */}
              <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Financial Snapshot
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    METRIC NOT INGESTED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {report.financialSnapshot.map((metric) => (
                    <div
                      key={metric.key}
                      className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2 opacity-80"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">{metric.name}</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          NOT INGESTED
                        </span>
                      </div>
                      <div className="text-base font-mono font-bold text-slate-400">
                        {metric.formattedValue}
                      </div>
                      <p className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1 font-mono">
                        {metric.source}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Official Exchange Lookup Links (Explicitly labeled as External Options) */}
              <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      External Exchange Verification & Lookup Options
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Official Exchange Portals
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  The links below query external exchange registers. They are provided as verification options and do not represent data already ingested or parsed by FINN:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {report.externalLookupLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold tracking-wider">
                          {link.title}
                        </span>
                        <h5 className="text-xs font-semibold text-white">{link.label}</h5>
                        <p className="text-[11px] text-slate-400 leading-snug">{link.purpose}</p>
                      </div>

                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between w-full px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-700/80 text-xs font-medium transition"
                      >
                        <span>Launch Query</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
