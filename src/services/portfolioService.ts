import {
  PortfolioDataMode,
  StockRawData,
  RealEodSnapshot,
  RealEodSnapshotMetadata,
  DailySession,
} from '../types/portfolio';
import { PORTFOLIO_RAW_DATA } from '../data/portfolioData';
import rawSnapshotJson from '../data/realEodData.json';

// Cast imported JSON to typed snapshot
const snapshot: RealEodSnapshot = rawSnapshotJson as unknown as RealEodSnapshot;

/**
 * Returns read-only metadata about the bundled historical EOD snapshot.
 */
export function getSnapshotMetadata(): RealEodSnapshotMetadata {
  return {
    schemaVersion: snapshot.schemaVersion || '1.0.0',
    provider: snapshot.provider || 'Yahoo Finance',
    retrievedAt: snapshot.retrievedAt || '',
    asOfDate: snapshot.asOfDate || null,
    eodPolicy: snapshot.eodPolicy || '',
    totalTickers: snapshot.totalTickers || 0,
    successfulTickers: snapshot.successfulTickers || 0,
    incompleteTickers: snapshot.incompleteTickers || 0,
    failedTickers: snapshot.failedTickers || 0,
  };
}

/**
 * Validates whether a raw session object has finite positive prices and non-negative volume.
 */
function isValidSession(session: { close?: unknown; volume?: unknown; date?: unknown }): boolean {
  return (
    typeof session.date === 'string' &&
    session.date.length === 10 &&
    typeof session.close === 'number' &&
    Number.isFinite(session.close) &&
    session.close > 0 &&
    typeof session.volume === 'number' &&
    Number.isFinite(session.volume) &&
    session.volume >= 0
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
 * - Previous close is taken from the second-latest session.
 * - Historical baseline (pastSessions) contains all older sessions, strictly excluding the latest session.
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
  return PORTFOLIO_RAW_DATA.map((demoStock) => {
    const tickerKey = demoStock.ticker;
    const tickerRecord = snapshot.tickers ? snapshot.tickers[tickerKey] : undefined;

    // 1. Missing record in snapshot
    if (!tickerRecord) {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: snapshot.asOfDate || null,
        fallbackReason: 'Symbol not included in Yahoo Finance EOD dataset',
      };
    }

    // 2. Ticker has explicit NO_DATA (e.g. TATAMOTORS due to demerger)
    if (tickerRecord.status === 'NO_DATA') {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: snapshot.asOfDate || null,
        fallbackReason: 'No market data returned from provider (symbol discontinued/demerged on exchange)',
      };
    }

    // 3. Ticker has error or validation failure
    if (tickerRecord.status !== 'OK') {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: snapshot.asOfDate || null,
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
        asOfDate: snapshot.asOfDate || null,
        fallbackReason: `Insufficient historical observations (${sessions?.length ?? 0} sessions, >= 21 required for 20D baseline)`,
      };
    }

    // Validate the latest and second-latest sessions
    const latestIndex = sessions.length - 1;
    const latestSession = sessions[latestIndex];
    const prevSession = sessions[latestIndex - 1];

    if (!isValidSession(latestSession) || !isValidSession(prevSession)) {
      return {
        ...demoStock,
        pastSessions: demoStock.pastSessions.map((s) => ({ ...s })),
        provenance: 'DEMO_FALLBACK',
        asOfDate: snapshot.asOfDate || null,
        fallbackReason: 'Malformed price or volume in latest session observations',
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
      prevClose: typeof tickerRecord.prevClose === 'number' && Number.isFinite(tickerRecord.prevClose) && tickerRecord.prevClose > 0
        ? tickerRecord.prevClose
        : prevSession.close,
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
