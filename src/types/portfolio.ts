export type ProvenanceTag = 'DEMO' | 'REAL_EOD' | 'DEMO_FALLBACK';

export type PortfolioDataMode = 'DEMO' | 'REAL_EOD';

export type AlertType = 'PRICE_MOVEMENT' | 'UNUSUAL_VOLUME';
export type AlertSeverity = 'HIGH' | 'MEDIUM';
export type AlertFilterCategory = 'ALL' | 'HIGH_PRIORITY' | 'PRICE_MOVEMENT' | 'UNUSUAL_VOLUME';

export interface DailySession {
  date: string;
  close: number;
  volume: number;
}

export interface StockRawData {
  ticker: string;
  name: string;
  isin: string;
  sector: string;
  currency: 'INR';
  currentPrice: number | null;
  prevClose: number | null;
  currentVolume: number | null;
  /**
   * Historical sessions ordered chronologically (oldest to newest).
   * Note: Volume ratio calculation specifically uses the previous 20 sessions excluding current.
   */
  pastSessions: DailySession[];
  provenance: ProvenanceTag;
  asOfDate?: string | null;
  fallbackReason?: string;
}

export interface StockWithMetrics extends StockRawData {
  priceChange: number | null;
  priceChangePercent: number | null;
  avg20dVolume: number | null;
  volumeRatio: number | null;
  isInsufficientVolumeHistory: boolean;
  isMissingPriceData: boolean;
}

export interface PortfolioAlert {
  id: string;
  ticker: string;
  companyName: string;
  sector: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  timestamp: string;
  provenance: ProvenanceTag;
}

export interface ThresholdConfig {
  priceChangePercentThreshold: number; // e.g. 2.0 (%)
  volumeRatioThreshold: number;        // e.g. 1.5 (x)
  highPriorityMultiplier: number;      // e.g. 1.5x threshold qualifies as HIGH
}

export interface RealEodSession {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RealEodTickerRecord {
  ticker: string;
  yahooSymbol: string;
  currency: string;
  status: 'OK' | 'NO_DATA' | 'INCOMPLETE' | 'VALIDATION_FAILED' | 'ERROR' | string;
  sessionCount: number;
  hasMinimumSessions: boolean;
  latestDate?: string | null;
  currentPrice?: number | null;
  prevClose?: number | null;
  currentVolume?: number | null;
  error?: string;
  sessions: RealEodSession[];
}

export interface RealEodSnapshotMetadata {
  schemaVersion: string;
  provider: string;
  retrievedAt: string;
  asOfDate: string | null;
  eodPolicy: string;
  totalTickers: number;
  successfulTickers: number;
  incompleteTickers: number;
  failedTickers: number;
}

export interface RealEodSnapshot extends RealEodSnapshotMetadata {
  tickers: Record<string, RealEodTickerRecord>;
}
