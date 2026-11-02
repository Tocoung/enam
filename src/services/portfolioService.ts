import {
  PortfolioDataMode,
  StockRawData,
  RealEodSnapshot,
  RealEodSnapshotMetadata,
  DailySession,
} from '../types/portfolio';
import { PORTFOLIO_RAW_DATA } from '../data/portfolioData';
import rawSnapshotJson from '../data/realEodData.json';

// Cast imported JSON to typed snapshot safely
const rawSnapshot =
  rawSnapshotJson && typeof rawSnapshotJson === 'object'
    ? (rawSnapshotJson as unknown as RealEodSnapshot)
    : ({} as RealEodSnapshot);

/**
 * Returns read-only metadata about the bundled historical EOD snapshot.
 * Safely guards against missing or malformed fields.
 */
export function getSnapshotMetadata(): RealEodSnapshotMetadata {
  return {
    schemaVersion: typeof rawSnapshot.schemaVersion === 'string' ? rawSnapshot.schemaVersion : '1.0.0',
    provider: typeof rawSnapshot.provider === 'string' ? rawSnapshot.provider : 'Yahoo Finance',
    retrievedAt: typeof rawSnapshot.retrievedAt === 'string' ? rawSnapshot.retrievedAt : '',
    asOfDate:
      typeof rawSnapshot.asOfDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawSnapshot.asOfDate)
        ? rawSnapshot.asOfDate
        : null,
    eodPolicy: typeof rawSnapshot.eodPolicy === 'string' ? rawSnapshot.eodPolicy : '',
    totalTickers:
      typeof rawSnapshot.totalTickers === 'number' && Number.isFinite(rawSnapshot.totalTickers)
        ? rawSnapshot.totalTickers
        : 0,
    successfulTickers:
      typeof rawSnapshot.successfulTickers === 'number' && Number.isFinite(rawSnapshot.successfulTickers)
        ? rawSnapshot.successfulTickers
        : 0,
    incompleteTickers:
      typeof rawSnapshot.incompleteTickers === 'number' && Number.isFinite(rawSnapshot.incompleteTickers)
        ? rawSnapshot.incompleteTickers
        : 0,
    failedTickers:
      typeof rawSnapshot.failedTickers === 'number' && Number.isFinite(rawSnapshot.failedTickers)
        ? rawSnapshot.failedTickers
        : 0,
  };
}

/**
 * Validates whether a raw session object has finite positive prices, non-negative volume,
 * and a valid YYYY-MM-DD date.
 */
function isValidSession(session: unknown): boolean {
  if (!session || typeof session !== 'object') return false;
  const s = session as { close?: unknown; volume?: unknown; date?: unknown };
  return (
    typeof s.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(s.date) &&
    !isNaN(Date.parse(s.date)) &&
    typeof s.close === 'number' &&
    Number.isFinite(s.close) &&
    s.close > 0 &&
    typeof s.volume === 'number' &&
    Number.isFinite(s.volume) &&
    s.volume >= 0
  );
}

/**
 * Retrieves portfolio stocks tailored to the requested data mode.
 *
 * In DEMO mode:
 * - Returns all original demo stock records with strict DEMO provenance.
 *
 * In REAL_EOD mode:
 * - Maps valid Yahoo Finance EOD observations for tickers having status === 'OK' and >= 20 historical baseline sessions.
 * - Current price and volume are taken strictly from the latest completed session.
 * - Previous close is taken from tickerRecord.prevClose or second-latest session.
 * - Historical baseline (pastSessions) contains all older sessions, strictly excluding the latest session.
 * - Every historical session is validated and confirmed to be in chronological order.
 * - Missing, incomplete, or demerged tickers (e.g. TATAMOTORS, uncovered equities) safely retain their demo values
 *   with strict DEMO_FALLBACK provenance and an explanatory fallback reason.
 * - Never mutates underlying source arrays or JSON.
 */
export function getPortfolioStocks(mode: PortfolioDataMode): StockRawData[] {
  if (mode === 'DEMO') {
    return PORTFOLIO_RAW_DATA.map((stock) => ({
      ...stock,
      pastSessions: stock.pastSessions.map((s) => ({ ...s })),
      provenance: 'DEMO',
      asOfDate: null,
      fallbackReason: undefined,
    }));
  }

  // REAL_EOD Mode
  const tickersMap = rawSnapshot.tickers && typeof rawSnapshot.tickers === 'object' ? rawSnapshot.tickers : {};

  return PORTFOLIO_RAW_DATA.map((demoStock) => {
    const tickerKey = demoStock.ticker;
    const tickerRecord = tickersMap[tickerKey];

    // 1. Missing record in snapshot
    if (!tickerRecord) {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: rawSnapshot.asOfDate || null,
        fallbackReason: 'Symbol not included in Yahoo Finance EOD dataset',
      };
    }

    // 2. Ticker has explicit NO_DATA (e.g. TATAMOTORS due to demerger)
    if (tickerRecord.status === 'NO_DATA') {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: rawSnapshot.asOfDate || null,
        fallbackReason: 'No market data returned from provider (symbol discontinued/demerged on exchange)',
      };
    }

    // 3. Ticker has error or validation failure
    if (tickerRecord.status !== 'OK') {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: rawSnapshot.asOfDate || null,
        fallbackReason: tickerRecord.error || `Provider data status: ${tickerRecord.status}`,
      };
    }

    const sessions = tickerRecord.sessions;
    // 4. Must have at least 21 total sessions: 1 current session + at least 20 historical sessions for baseline
    if (!Array.isArray(sessions) || sessions.length < 21) {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: rawSnapshot.asOfDate || null,
        fallbackReason: `Insufficient historical observations (${sessions?.length ?? 0} sessions, >= 21 required for 20D baseline)`,
      };
    }

    // 5. Validate that all sessions are valid and strictly chronologically ascending
    let allValid = true;
    let strictlyOrdered = true;
    for (let i = 0; i < sessions.length; i++) {
      if (!isValidSession(sessions[i])) {
        allValid = false;
        break;
      }
      if (i > 0 && sessions[i].date <= sessions[i - 1].date) {
        strictlyOrdered = false;
        break;
      }
    }

    if (!allValid || !strictlyOrdered) {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: rawSnapshot.asOfDate || null,
        fallbackReason: !allValid
          ? 'Malformed date, price, or volume in historical session observations'
          : 'Historical session observations are not strictly chronologically ordered',
      };
    }

    // Validate the latest and second-latest sessions
    const latestIndex = sessions.length - 1;
    const latestSession = sessions[latestIndex];
    const prevSession = sessions[latestIndex - 1];

    const prevCloseVal =
      typeof tickerRecord.prevClose === 'number' &&
      Number.isFinite(tickerRecord.prevClose) &&
      tickerRecord.prevClose > 0
        ? tickerRecord.prevClose
        : prevSession.close;

    if (
      !Number.isFinite(latestSession.close) || latestSession.close <= 0 ||
      !Number.isFinite(prevCloseVal) || prevCloseVal <= 0 ||
      !Number.isFinite(latestSession.volume) || latestSession.volume < 0
    ) {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: rawSnapshot.asOfDate || null,
        fallbackReason: 'Non-finite or invalid price/volume in observations',
      };
    }

    // Historical baseline: strictly older sessions excluding the current/latest session
    const pastSessions: DailySession[] = sessions.slice(0, latestIndex).map((s) => ({
      date: s.date,
      close: s.close,
      volume: s.volume,
    }));

    return {
      ticker: demoStock.ticker,
      name: demoStock.name,
      isin: demoStock.isin,
      sector: demoStock.sector,
      currency: demoStock.currency,
      currentPrice: latestSession.close,
      prevClose: prevCloseVal,
      currentVolume: latestSession.volume,
      pastSessions,
      provenance: 'REAL_EOD',
      asOfDate: latestSession.date,
      fallbackReason: undefined,
    };
  });
}

/**
 * Computes coverage statistics across a portfolio stock list.
 */
export function getPortfolioCoverage(stocks: StockRawData[]) {
  const total = stocks.length;
  const realCount = stocks.filter((s) => s.provenance === 'REAL_EOD').length;
  const fallbackCount = stocks.filter((s) => s.provenance === 'DEMO_FALLBACK').length;
  const demoCount = stocks.filter((s) => s.provenance === 'DEMO').length;

  return {
    total,
    realCount,
    fallbackCount,
    demoCount,
  };
}
