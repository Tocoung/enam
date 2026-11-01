export type ProvenanceTag = 'DEMO';

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
