#!/usr/bin/env node
/**
 * Direct TypeScript Unit Tests for FINN Portfolio Adapter & Provenance Integration.
 *
 * Executes the ACTUAL production TypeScript code in src/services/portfolioService.ts
 * and src/services/portfolioMetrics.ts via jiti (bundled in node_modules).
 *
 * Run: node scripts/test_portfolio_adapter_ts.mjs
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Initialize jiti to load TypeScript directly
const jiti = require(path.join(rootDir, 'node_modules/jiti'))(path.join(rootDir, 'index.js'));

const portfolioService = jiti('./src/services/portfolioService.ts');
const portfolioMetrics = jiti('./src/services/portfolioMetrics.ts');
const portfolioData = jiti('./src/data/portfolioData.ts');

const { getSnapshotMetadata, getPortfolioStocks, getPortfolioCoverage } = portfolioService;
const { computeStockMetrics, deriveAlerts } = portfolioMetrics;
const { PORTFOLIO_RAW_DATA, DEFAULT_THRESHOLDS } = portfolioData;

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${details ? ': ' + details : ''}`);
  }
}

console.log('=== FINN Production TypeScript Portfolio Adapter Tests ===\n');

// 1. Snapshot Metadata
console.log('1. Snapshot Metadata & Guard Safety:');
const meta = getSnapshotMetadata();
assert(typeof meta === 'object' && meta !== null, 'Metadata object exists');
assert(meta.provider === 'Yahoo Finance', 'Provider is Yahoo Finance', meta.provider);
assert(typeof meta.asOfDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(meta.asOfDate), 'asOfDate is valid YYYY-MM-DD', meta.asOfDate);
assert(meta.totalTickers === 15, 'totalTickers is 15', meta.totalTickers);
assert(meta.successfulTickers === 14, 'successfulTickers is 14', meta.successfulTickers);
assert(meta.failedTickers === 1, 'failedTickers is 1', meta.failedTickers);

// 2. DEMO Mode Integrity
console.log('\n2. DEMO Mode Fidelity & Immutability:');
const demoStocks = getPortfolioStocks('DEMO');
assert(demoStocks.length === 20, 'DEMO mode returns exactly 20 positions', demoStocks.length);
assert(demoStocks.every((s) => s.provenance === 'DEMO'), 'All DEMO positions have strict DEMO provenance');
assert(demoStocks.every((s) => s.asOfDate === null), 'All DEMO positions have null asOfDate');
assert(demoStocks.every((s) => s.fallbackReason === undefined), 'All DEMO positions have undefined fallbackReason');

// Verify exact values match PORTFOLIO_RAW_DATA
let demoMatches = true;
for (let i = 0; i < PORTFOLIO_RAW_DATA.length; i++) {
  const raw = PORTFOLIO_RAW_DATA[i];
  const derived = demoStocks[i];
  if (
    raw.ticker !== derived.ticker ||
    raw.currentPrice !== derived.currentPrice ||
    raw.prevClose !== derived.prevClose ||
    raw.currentVolume !== derived.currentVolume
  ) {
    demoMatches = false;
    break;
  }
}
assert(demoMatches, 'DEMO positions match original PORTFOLIO_RAW_DATA prices and volumes exactly');

// 3. REAL_EOD Mode Breakdown
console.log('\n3. REAL_EOD Mode Counts & Classification:');
const realStocks = getPortfolioStocks('REAL_EOD');
assert(realStocks.length === 20, 'REAL_EOD mode preserves all 20 portfolio positions', realStocks.length);

const coverage = getPortfolioCoverage(realStocks);
assert(coverage.total === 20, 'Coverage total is 20', coverage.total);
assert(coverage.realCount === 13, 'Coverage realCount is 13', coverage.realCount);
assert(coverage.fallbackCount === 7, 'Coverage fallbackCount is 7', coverage.fallbackCount);
assert(coverage.demoCount === 0, 'Coverage demoCount is 0 in REAL_EOD mode', coverage.demoCount);

// 4. Baseline Slicing & Historical Session Integrity
console.log('\n4. Baseline Slicing & Historical Session Integrity:');
const realOnly = realStocks.filter((s) => s.provenance === 'REAL_EOD');
assert(realOnly.length === 13, 'Found 13 REAL_EOD stocks');

let allBaselinesValid = true;
let allSessionsChronological = true;
let allExcludedLatest = true;

for (const stock of realOnly) {
  if (stock.pastSessions.length < 20) {
    allBaselinesValid = false;
  }
  for (let i = 0; i < stock.pastSessions.length; i++) {
    const s = stock.pastSessions[i];
    if (
      typeof s.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(s.date) ||
      typeof s.close !== 'number' ||
      !Number.isFinite(s.close) ||
      s.close <= 0 ||
      typeof s.volume !== 'number' ||
      !Number.isFinite(s.volume) ||
      s.volume < 0
    ) {
      allBaselinesValid = false;
    }
    if (i > 0 && s.date <= stock.pastSessions[i - 1].date) {
      allSessionsChronological = false;
    }
    // Baseline must strictly exclude the current session date
    if (s.date >= stock.asOfDate) {
      allExcludedLatest = false;
    }
  }
}

assert(allBaselinesValid, 'All 13 REAL_EOD stocks have >= 20 valid historical sessions');
assert(allSessionsChronological, 'All historical sessions are strictly chronologically ordered');
assert(allExcludedLatest, 'Historical baseline strictly excludes latest completed session');

// 5. Prices and Volumes Validity
console.log('\n5. Current Price, PrevClose & Volume Validation:');
let allPricesValid = true;
for (const stock of realStocks) {
  if (
    typeof stock.currentPrice !== 'number' ||
    !Number.isFinite(stock.currentPrice) ||
    stock.currentPrice <= 0 ||
    typeof stock.currentVolume !== 'number' ||
    !Number.isFinite(stock.currentVolume) ||
    stock.currentVolume < 0 ||
    (stock.prevClose !== null && (!Number.isFinite(stock.prevClose) || stock.prevClose <= 0))
  ) {
    allPricesValid = false;
  }
}
assert(allPricesValid, 'All 20 stocks have finite positive currentPrice and valid currentVolume');

// 6. Demerged & Uncovered Fallbacks
console.log('\n6. Fallback Diagnostics:');
const tataMotors = realStocks.find((s) => s.ticker === 'TATAMOTORS');
assert(tataMotors && tataMotors.provenance === 'DEMO_FALLBACK', 'TATAMOTORS has DEMO_FALLBACK provenance');
assert(
  tataMotors?.fallbackReason?.includes('demerged') || tataMotors?.fallbackReason?.includes('discontinued'),
  'TATAMOTORS fallbackReason cites exchange demerger/discontinued status',
  tataMotors?.fallbackReason
);

const uncovered = ['HINDUNILVR', 'TITAN', 'NTPC', 'TATASTEEL', 'WIPRO', 'IDEA'];
const uncoveredCorrect = uncovered.every((sym) => {
  const stock = realStocks.find((s) => s.ticker === sym);
  return (
    stock &&
    stock.provenance === 'DEMO_FALLBACK' &&
    stock.fallbackReason === 'Symbol not included in Yahoo Finance EOD dataset'
  );
});
assert(uncoveredCorrect, 'All 6 uncovered equities have DEMO_FALLBACK and explanatory reason');

// 7. Metrics & Alert Provenance Propagation
console.log('\n7. Metrics & Alert Provenance Propagation:');
const stocksWithMetrics = realStocks.map(computeStockMetrics);
const alerts = deriveAlerts(stocksWithMetrics, DEFAULT_THRESHOLDS);
assert(alerts.length > 0, 'Alerts generated from REAL_EOD dataset', alerts.length);

const realAlerts = alerts.filter((a) => a.provenance === 'REAL_EOD');
const fallbackAlerts = alerts.filter((a) => a.provenance === 'DEMO_FALLBACK');
const demoAlerts = alerts.filter((a) => a.provenance === 'DEMO');

assert(realAlerts.length > 0, 'Generated alerts with REAL_EOD provenance', realAlerts.length);
assert(fallbackAlerts.length > 0, 'Generated alerts with DEMO_FALLBACK provenance', fallbackAlerts.length);
assert(demoAlerts.length === 0, 'Zero DEMO provenance alerts in REAL_EOD mode', demoAlerts.length);
assert(
  realAlerts.every((a) => a.timestamp.includes('EOD Close')),
  'All REAL_EOD alerts have EOD Close timestamp format'
);

console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
