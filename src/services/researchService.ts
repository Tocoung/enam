import {
  ResearchReport,
  TickerValidationResult,
  FinancialMetric,
  ExternalLookupLink,
} from '../types/research';
import {
  VERIFIED_RESEARCH_REGISTRY,
  LOCAL_NSE_MASTER_REGISTRY,
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
 * Stage 2: Check for Curated Research Dossier (pre-ingested audited FY24/Q2 FY25 filings & thesis).
 * Stage 3: Check Local NSE Equity Master (symbol identity confirmed, but research not indexed).
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

  // Case 1: Curated research dossier with pre-ingested audited filings
  if (VERIFIED_RESEARCH_REGISTRY[ticker]) {
    const report = VERIFIED_RESEARCH_REGISTRY[ticker];
    return {
      ...report,
      lastRetrieved: new Date().toISOString().split('T')[0],
    };
  }

  // Case 2: Symbol confirmed in Local NSE Equity Master, but filings not yet indexed
  if (LOCAL_NSE_MASTER_REGISTRY[ticker]) {
    const masterEntry = LOCAL_NSE_MASTER_REGISTRY[ticker];
    return createMasterIndexedReport(ticker, masterEntry.companyName, masterEntry.isin);
  }

  // Case 3: Arbitrary format-valid ticker NOT found in master or curated registry (e.g. CGFSDYMGUJHVGF)
  return createUnverifiedIdentityReport(ticker);
}

/**
 * Builds an unindexed report for a symbol confirmed in the local NSE Equity Master.
 * Shows verified identity, but explicitly refuses to fabricate filings, descriptions, or thesis.
 */
function createMasterIndexedReport(
  ticker: string,
  companyName: string,
  isin: string
): ResearchReport {
  return {
    ticker,
    hasCuratedCoverage: false,
    identityStatus: 'SYMBOL_FOUND_IN_NSE_MASTER',
    identityMessage: `Symbol matches an active security in the local NSE Equity Master (${companyName} • ISIN: ${isin}). However, audited financial statements and analytical research are not currently indexed in FINN's offline dataset.`,
    provenance: 'SYMBOL_FOUND_IN_NSE_MASTER',
    provenanceLabel: 'SYMBOL FOUND IN NSE MASTER',
    provenanceNote:
      'Security identity verified against local NSE master register. Audited corporate filing extraction and thesis have not been ingested for this equity.',
    masterSecurityName: companyName,
    masterIsin: isin,
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
      'Format validation passed. No matching security found in the local exchange master register or research dataset.',
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
function createStandardLookupLinks(ticker: string, isMasterKnown: boolean): ExternalLookupLink[] {
  return [
    {
      id: `lookup-nse-${ticker}`,
      title: 'National Stock Exchange (NSE India)',
      label: `Query Symbol '${ticker}' on NSE`,
      url: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(ticker)}`,
      purpose: isMasterKnown
        ? 'Direct exchange query — verify real-time price quotation, volume, and Regulation 33 announcements.'
        : 'External verification option — check if this symbol exists as an actively traded security on NSE.',
    },
    {
      id: `lookup-bse-${ticker}`,
      title: 'Bombay Stock Exchange (BSE India)',
      label: 'Search Security on BSE India',
      url: 'https://www.bseindia.com/corporates/ann.html',
      purpose:
        'External verification option — search corporate announcements, financial statements, and board meeting notices.',
    },
    {
      id: `lookup-screener-${ticker}`,
      title: 'Screener Financial Research',
      label: `Search Consolidated Financials for '${ticker}'`,
      url: `https://www.screener.in/company/${encodeURIComponent(ticker)}/`,
      purpose:
        'External verification option — inspect historical consolidated balance sheets and profit & loss statements.',
    },
  ];
}
