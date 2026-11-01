import {
  ResearchReport,
  TickerValidationResult,
  FinancialMetric,
  ExternalLookupLink,
} from '../types/research';
import {
  VERIFIED_RESEARCH_REGISTRY,
  LOCAL_VERIFIED_SYMBOL_REGISTRY,
} from '../data/researchData';

/**
 * Validates arbitrary NSE ticker input:
 * - Trims whitespace
 * - Converts to uppercase
 * - Checks for non-empty string
 * - Validates against standard NSE equity symbol format (1-20 alphanumeric characters, with hyphens or ampersands)
 *
 * NOTE: Format validation ONLY establishes acceptable syntactic structure.
 * It strictly does NOT imply that the security exists on the exchange.
 */
export function validateTicker(rawInput: string): TickerValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      normalizedTicker: '',
      error: 'Ticker symbol cannot be empty. Please enter an NSE equity symbol (e.g. RELIANCE, TCS, ZOMATO).',
    };
  }

  const trimmed = rawInput.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      normalizedTicker: '',
      error: 'Ticker symbol cannot be empty. Please enter an NSE equity symbol (e.g. RELIANCE, TCS, ZOMATO).',
    };
  }

  const normalized = trimmed.toUpperCase();

  // Standard NSE equity symbol format: 1-20 alphanumeric characters, with hyphens or ampersands
  // Examples: RELIANCE, TCS, M&M, BAJAJ-AUTO, L&TFH
  const NSE_SYMBOL_REGEX = /^[A-Z0-9&-]{1,20}$/;

  if (!NSE_SYMBOL_REGEX.test(normalized)) {
    return {
      isValid: false,
      normalizedTicker: normalized,
      error:
        'Invalid ticker format. NSE symbols contain only uppercase letters, numbers, hyphens, or ampersands (e.g. M&M, BAJAJ-AUTO). Spaces and special characters ($ @ # , .) are not permitted.',
    };
  }

  return {
    isValid: true,
    normalizedTicker: normalized,
  };
}

/**
 * Example tickers to help investors explore both portfolio and non-portfolio companies.
 */
export const EXAMPLE_TICKERS = [
  { ticker: 'ZOMATO', label: 'Zomato Ltd.', sector: 'Quick Commerce / Food Delivery', isPortfolio: false },
  { ticker: 'BHARTIARTL', label: 'Bharti Airtel', sector: 'Telecommunications', isPortfolio: false },
  { ticker: 'RELIANCE', label: 'Reliance Industries', sector: 'Energy & Retail', isPortfolio: true },
  { ticker: 'HDFCBANK', label: 'HDFC Bank', sector: 'Banking & Financials', isPortfolio: true },
  { ticker: 'TCS', label: 'Tata Consultancy Services', sector: 'IT Services', isPortfolio: true },
  { ticker: 'SWIGGY', label: 'Swiggy Ltd.', sector: 'Consumer Internet IPO', isPortfolio: true },
] as const;

/**
 * Executes a research workflow for an arbitrary NSE ticker with strict data integrity:
 *
 * Stage 1: Ticker format validation (syntax only; does not imply exchange listing).
 * Stage 2: Check for Curated Research Dossier (pre-ingested audited filings & thesis).
 * Stage 3: Check Local Verified Symbol Registry (symbol exists in FINN's local list, no live exchange lookup).
 * Stage 4: Unverified fallback (format valid, but identity NOT verified; no fabricated data).
 */
export async function fetchCompanyResearch(tickerInput: string): Promise<ResearchReport> {
  const validation = validateTicker(tickerInput);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid ticker symbol provided.');
  }

  const ticker = validation.normalizedTicker;

  // Add realistic network latency to simulate asynchronous resolution
  await new Promise((resolve) => setTimeout(resolve, 380));

  // Case 1: Curated research dossier with pre-ingested audited filings (static snapshot; do NOT assign today's date)
  if (VERIFIED_RESEARCH_REGISTRY[ticker]) {
    return {
      ...VERIFIED_RESEARCH_REGISTRY[ticker],
    };
  }

  // Case 2: Symbol confirmed in FINN's Local Verified Symbol Registry, but full filings unindexed
  if (LOCAL_VERIFIED_SYMBOL_REGISTRY[ticker]) {
    const entry = LOCAL_VERIFIED_SYMBOL_REGISTRY[ticker];
    return createLocalRegistryReport(ticker, entry.companyName, entry.isin);
  }

  // Case 3: Arbitrary format-valid ticker NOT found in local list or curated registry (e.g. CGFSDYMGUJHVGF)
  return createUnverifiedIdentityReport(ticker);
}

/**
 * Builds an unindexed report for a symbol found in FINN's locally maintained list.
 * Explains that no live exchange query occurred and avoids fabricating filings or thesis.
 */
function createLocalRegistryReport(
  ticker: string,
  companyName: string,
  isin: string
): ResearchReport {
  return {
    ticker,
    hasCuratedCoverage: false,
    identityStatus: 'SYMBOL_FOUND_IN_LOCAL_REGISTRY',
    identityMessage: `This symbol exists in FINN's locally maintained symbol list (${companyName} • ISIN: ${isin}). FINN has not performed a live exchange lookup.`,
    provenance: 'SYMBOL_FOUND_IN_LOCAL_REGISTRY',
    provenanceLabel: 'FOUND IN FINN LOCAL SYMBOL REGISTRY',
    provenanceNote:
      "Symbol exists in FINN's locally maintained symbol list. FINN has not performed a live exchange lookup; full company filings are not indexed.",
    localRegistrySecurityName: companyName,
    localRegistryIsin: isin,
    financialSnapshot: createUnavailableFinancialMetrics(ticker),
    externalLookupLinks: createStandardLookupLinks(ticker, true),
  };
}

/**
 * Builds an honest report for an arbitrary ticker whose identity cannot be verified.
 * Strict Integrity: No company name, no sector, no business description, no fake bull/bear case.
 */
function createUnverifiedIdentityReport(ticker: string): ResearchReport {
  return {
    ticker,
    hasCuratedCoverage: false,
    identityStatus: 'IDENTITY_NOT_VERIFIED',
    identityMessage:
      'This symbol passes format validation, but FINN has not verified that it corresponds to an NSE-listed security.',
    provenance: 'IDENTITY_NOT_VERIFIED',
    provenanceLabel: 'IDENTITY NOT VERIFIED',
    provenanceNote:
      "Format validation passed only. Symbol not found in FINN's local symbol list or research dataset.",
    financialSnapshot: createUnavailableFinancialMetrics(ticker),
    externalLookupLinks: createStandardLookupLinks(ticker, false),
  };
}

/**
 * Standard uningested financial metrics cards.
 * Zero fabricated numbers or misleading reporting period claims.
 */
function createUnavailableFinancialMetrics(ticker: string): FinancialMetric[] {
  return [
    {
      key: 'revenue',
      name: 'Consolidated Revenue',
      value: null,
      formattedValue: '—',
      units: '₹ Cr',
      period: 'Not Ingested',
      source: 'Not Ingested in Offline Dataset',
      status: 'METRIC_NOT_INGESTED',
      reportingNote: `Filing data for ${ticker} is not indexed in the offline research repository.`,
    },
    {
      key: 'net_profit',
      name: 'Profit / Loss After Tax (PAT)',
      value: null,
      formattedValue: '—',
      units: '₹ Cr',
      period: 'Not Ingested',
      source: 'Not Ingested in Offline Dataset',
      status: 'METRIC_NOT_INGESTED',
      reportingNote: 'Direct exchange query required for audited statutory figures.',
    },
    {
      key: 'operating_margin',
      name: 'Operating Margin',
      value: null,
      formattedValue: '—',
      units: '%',
      period: 'Not Ingested',
      source: 'Not Ingested in Offline Dataset',
      status: 'METRIC_NOT_INGESTED',
    },
    {
      key: 'debt_to_equity',
      name: 'Debt-to-Equity Ratio',
      value: null,
      formattedValue: '—',
      units: 'Ratio',
      period: 'Not Ingested',
      source: 'Not Ingested in Offline Dataset',
      status: 'METRIC_NOT_INGESTED',
    },
  ];
}

/**
 * External verification and lookup options.
 * Clearly labeled as lookup links, NOT as sources already retrieved by FINN.
 */
function createStandardLookupLinks(ticker: string, isLocalKnown: boolean): ExternalLookupLink[] {
  return [
    {
      id: `lookup-nse-${ticker}`,
      title: 'National Stock Exchange (NSE India)',
      label: `Query Symbol '${ticker}' on NSE`,
      url: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(ticker)}`,
      purpose: isLocalKnown
        ? 'External lookup option — verify live order book, circuit filters, and Regulation 33 filings on NSE.'
        : 'External lookup option — check whether this symbol exists as an actively traded security on NSE.',
    },
    {
      id: `lookup-bse-${ticker}`,
      title: 'Bombay Stock Exchange (BSE India)',
      label: 'Search Security on BSE India',
      url: 'https://www.bseindia.com/corporates/ann.html',
      purpose:
        'External lookup option — search statutory corporate announcements, financial statements, and board meeting notices.',
    },
    {
      id: `lookup-screener-${ticker}`,
      title: 'Screener Financial Research',
      label: `Search Consolidated Financials for '${ticker}'`,
      url: `https://www.screener.in/company/${encodeURIComponent(ticker)}/`,
      purpose:
        'External lookup option — inspect historical consolidated balance sheets and profit & loss statements.',
    },
  ];
}
