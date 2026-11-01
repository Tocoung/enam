import { StockRawData, DailySession } from '../types/portfolio';

/**
 * Deterministic generator for realistic 20-session trading history.
 * Generates an array of past trading sessions chronologically (oldest to newest).
 */
function generateHistoricalSessions(
  basePrice: number,
  baseVolume: number,
  volatility: number,
  count: number = 20
): DailySession[] {
  const sessions: DailySession[] = [];
  let currentPrice = basePrice * 0.95;
  const baseDate = new Date('2026-10-01');

  for (let i = 0; i < count; i++) {
    const sessionDate = new Date(baseDate);
    sessionDate.setDate(baseDate.getDate() + i);

    // Skip weekends for realistic trading days
    const day = sessionDate.getDay();
    if (day === 0 || day === 6) continue;

    // Pseudo-deterministic price fluctuation
    const seed = Math.sin(i * 1.7 + basePrice) * volatility;
    currentPrice = Number((currentPrice * (1 + seed)).toFixed(2));

    // Pseudo-deterministic volume fluctuation
    const volFactor = 0.8 + Math.abs(Math.cos(i * 2.3 + baseVolume)) * 0.45;
    const sessionVolume = Math.round(baseVolume * volFactor);

    sessions.push({
      date: sessionDate.toISOString().split('T')[0],
      close: currentPrice,
      volume: sessionVolume,
    });

    if (sessions.length >= count) break;
  }

  return sessions;
}

/**
 * Portfolio of 18 major NSE-listed companies across 7 diverse sectors.
 * All records strictly tagged as DEMO data.
 */
export const PORTFOLIO_RAW_DATA: StockRawData[] = [
  {
    ticker: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    isin: 'INE002A01018',
    sector: 'Energy & Petrochemicals',
    currency: 'INR',
    currentPrice: 2785.40,
    prevClose: 2710.20, // +2.77% (Triggers price alert)
    currentVolume: 11_450_000,
    pastSessions: generateHistoricalSessions(2720, 5_800_000, 0.015, 20), // Vol ratio ~1.97x (Triggers volume alert)
    provenance: 'DEMO',
  },
  {
    ticker: 'TCS',
    name: 'Tata Consultancy Services',
    isin: 'INE467B01029',
    sector: 'IT Services',
    currency: 'INR',
    currentPrice: 4120.00,
    prevClose: 4155.00, // -0.84% (Normal)
    currentVolume: 1_850_000,
    pastSessions: generateHistoricalSessions(4130, 2_100_000, 0.012, 20), // Vol ratio ~0.88x (Normal)
    provenance: 'DEMO',
  },
  {
    ticker: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    isin: 'INE040A01034',
    sector: 'Banking & Financials',
    currency: 'INR',
    currentPrice: 1742.60,
    prevClose: 1690.00, // +3.11% (High Priority Price Alert)
    currentVolume: 24_500_000,
    pastSessions: generateHistoricalSessions(1680, 11_200_000, 0.018, 20), // Vol ratio ~2.18x (High Volume Alert)
    provenance: 'DEMO',
  },
  {
    ticker: 'INFY',
    name: 'Infosys Ltd.',
    isin: 'INE009A01021',
    sector: 'IT Services',
    currency: 'INR',
    currentPrice: 1860.25,
    prevClose: 1872.10, // -0.63% (Normal)
    currentVolume: 6_200_000,
    pastSessions: generateHistoricalSessions(1850, 6_800_000, 0.014, 20),
    provenance: 'DEMO',
  },
  {
    ticker: 'ICICIBANK',
    name: 'ICICI Bank Ltd.',
    isin: 'INE090A01021',
    sector: 'Banking & Financials',
    currency: 'INR',
    currentPrice: 1248.80,
    prevClose: 1253.50, // -0.37% (Normal)
    currentVolume: 9_100_000,
    pastSessions: generateHistoricalSessions(1230, 9_400_000, 0.011, 20),
    provenance: 'DEMO',
  },
  {
    ticker: 'ITC',
    name: 'ITC Ltd.',
    isin: 'INE154A01025',
    sector: 'Consumer Goods',
    currency: 'INR',
    currentPrice: 472.10,
    prevClose: 486.50, // -2.96% (Price Drop Alert)
    currentVolume: 21_200_000,
    pastSessions: generateHistoricalSessions(485, 12_500_000, 0.01, 20), // Vol ratio ~1.69x (Volume Alert)
    provenance: 'DEMO',
  },
  {
    ticker: 'SBIN',
    name: 'State Bank of India',
    isin: 'INE062A01020',
    sector: 'Banking & Financials',
    currency: 'INR',
    currentPrice: 812.30,
    prevClose: 816.00, // -0.45% (Normal)
    currentVolume: 14_800_000,
    pastSessions: generateHistoricalSessions(810, 16_000_000, 0.016, 20),
    provenance: 'DEMO',
  },
  {
    ticker: 'LT',
    name: 'Larsen & Toubro Ltd.',
    isin: 'INE018A01030',
    sector: 'Infrastructure & Engineering',
    currency: 'INR',
    currentPrice: 3620.50,
    prevClose: 3510.00, // +3.15% (High Price Alert)
    currentVolume: 4_350_000,
    pastSessions: generateHistoricalSessions(3520, 2_200_000, 0.02, 20), // Vol ratio ~1.97x (Volume Alert)
    provenance: 'DEMO',
  },
  {
    ticker: 'HINDUNILVR',
    name: 'Hindustan Unilever Ltd.',
    isin: 'INE030A01027',
    sector: 'Consumer Goods',
    currency: 'INR',
    currentPrice: 2380.00,
    prevClose: 2392.50, // -0.52%
    currentVolume: 1_400_000,
    pastSessions: generateHistoricalSessions(2400, 1_600_000, 0.009, 20),
    provenance: 'DEMO',
  },
  {
    ticker: 'TATAMOTORS',
    name: 'Tata Motors Ltd.',
    isin: 'INE155A01022',
    sector: 'Automobile',
    currency: 'INR',
    currentPrice: 948.75,
    prevClose: 915.20, // +3.67% (High Price Alert)
    currentVolume: 19_800_000,
    pastSessions: generateHistoricalSessions(920, 8_900_000, 0.022, 20), // Vol ratio ~2.22x (High Volume Alert)
    provenance: 'DEMO',
  },
  {
    ticker: 'MARUTI',
    name: 'Maruti Suzuki India Ltd.',
    isin: 'INE585B01010',
    sector: 'Automobile',
    currency: 'INR',
    currentPrice: 11450.00,
    prevClose: 11520.00, // -0.61%
    currentVolume: 320_000,
    pastSessions: generateHistoricalSessions(11400, 360_000, 0.013, 20),
    provenance: 'DEMO',
  },
  {
    ticker: 'BAJFINANCE',
    name: 'Bajaj Finance Ltd.',
    isin: 'INE296A01024',
    sector: 'Banking & Financials',
    currency: 'INR',
    currentPrice: 6920.00,
    prevClose: 7110.00, // -2.67% (Price Drop Alert)
    currentVolume: 1_650_000,
    pastSessions: generateHistoricalSessions(7050, 1_050_000, 0.017, 20), // Vol ratio ~1.57x (Volume Alert)
    provenance: 'DEMO',
  },
  {
    ticker: 'TITAN',
    name: 'Titan Company Ltd.',
    isin: 'INE280A01028',
    sector: 'Consumer Goods',
    currency: 'INR',
    currentPrice: 3410.00,
    prevClose: 3425.00, // -0.44%
    currentVolume: 780_000,
    pastSessions: generateHistoricalSessions(3400, 890_000, 0.012, 20),
    provenance: 'DEMO',
  },
  {
    ticker: 'SUNPHARMA',
    name: 'Sun Pharmaceutical Industries',
    isin: 'INE044A01036',
    sector: 'Healthcare & Pharma',
    currency: 'INR',
    currentPrice: 1780.40,
    prevClose: 1745.00, // +2.03% (Medium Price Alert)
    currentVolume: 2_950_000,
    pastSessions: generateHistoricalSessions(1730, 2_800_000, 0.014, 20),
    provenance: 'DEMO',
  },
  {
    ticker: 'NTPC',
    name: 'NTPC Ltd.',
    isin: 'INE733E01010',
    sector: 'Energy & Petrochemicals',
    currency: 'INR',
    currentPrice: 388.50,
    prevClose: 391.20, // -0.69%
    currentVolume: 12_400_000,
    pastSessions: generateHistoricalSessions(385, 13_100_000, 0.015, 20),
    provenance: 'DEMO',
  },
  {
    ticker: 'TATASTEEL',
    name: 'Tata Steel Ltd.',
    isin: 'INE081A01020',
    sector: 'Infrastructure & Engineering',
    currency: 'INR',
    currentPrice: 154.20,
    prevClose: 151.00, // +2.12% (Medium Price Alert)
    currentVolume: 38_500_000,
    pastSessions: generateHistoricalSessions(150, 36_000_000, 0.02, 20),
    provenance: 'DEMO',
  },
  {
    ticker: 'WIPRO',
    name: 'Wipro Ltd.',
    isin: 'INE075A01022',
    sector: 'IT Services',
    currency: 'INR',
    currentPrice: 565.00,
    prevClose: 568.50, // -0.62%
    currentVolume: 5_100_000,
    pastSessions: generateHistoricalSessions(560, 5_400_000, 0.015, 20),
    provenance: 'DEMO',
  },
  // Edge Case 1: Insufficient History (< 20 trading sessions, e.g. newly listed or tracked with only 12 days)
  {
    ticker: 'DRREDDY',
    name: "Dr. Reddy's Laboratories Ltd.",
    isin: 'INE089A01023',
    sector: 'Healthcare & Pharma',
    currency: 'INR',
    currentPrice: 6540.00,
    prevClose: 6515.00,
    currentVolume: 420_000,
    pastSessions: generateHistoricalSessions(6480, 410_000, 0.015, 12), // ONLY 12 SESSIONS (<20)
    provenance: 'DEMO',
  },
  // Edge Case 2: Missing Previous Close & Insufficient History (e.g. IPO / newly traded listing)
  {
    ticker: 'SWIGGY',
    name: 'Swiggy Ltd.',
    isin: 'INE00H001014',
    sector: 'Consumer Goods',
    currency: 'INR',
    currentPrice: 428.50,
    prevClose: null, // Missing previous close baseline
    currentVolume: 8_200_000,
    pastSessions: generateHistoricalSessions(415, 7_500_000, 0.02, 5), // Only 5 historical sessions
    provenance: 'DEMO',
  },
  // Edge Case 3: Zero Session Volume & Unchanged Price
  {
    ticker: 'IDEA',
    name: 'Vodafone Idea Ltd.',
    isin: 'INE669E01016',
    sector: 'Telecommunication',
    currency: 'INR',
    currentPrice: 7.80,
    prevClose: 7.80, // 0.00% change (Unchanged)
    currentVolume: 0, // Zero volume session
    pastSessions: generateHistoricalSessions(7.8, 120_000_000, 0.01, 20),
    provenance: 'DEMO',
  },
];

/**
 * Default threshold parameters for institutional intelligence alerts.
 */
export const DEFAULT_THRESHOLDS = {
  priceChangePercentThreshold: 2.0, // ±2.0%
  volumeRatioThreshold: 1.5,        // 1.5x of 20D average
  highPriorityMultiplier: 1.5,      // 1.5x threshold = HIGH priority (±3.0% price or 2.25x volume)
};

/**
 * List of available unique sectors across the portfolio.
 */
export const PORTFOLIO_SECTORS = [
  'ALL',
  'Automobile',
  'Banking & Financials',
  'Consumer Goods',
  'Energy & Petrochemicals',
  'Healthcare & Pharma',
  'Infrastructure & Engineering',
  'IT Services',
  'Telecommunication',
] as const;
