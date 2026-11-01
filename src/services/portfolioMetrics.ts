import {
  DailySession,
  StockRawData,
  StockWithMetrics,
  PortfolioAlert,
  ThresholdConfig,
  AlertFilterCategory,
} from '../types/portfolio';

/**
 * Calculates absolute and percentage price movement from current price and previous close.
 * Safely handles missing, null, zero or non-positive previous close values.
 */
export function calculatePriceMovement(
  currentPrice: number | null,
  prevClose: number | null
): { priceChange: number | null; priceChangePercent: number | null; isMissingPriceData: boolean } {
  if (
    currentPrice === null ||
    prevClose === null ||
    typeof currentPrice !== 'number' ||
    typeof prevClose !== 'number' ||
    isNaN(currentPrice) ||
    isNaN(prevClose) ||
    prevClose <= 0
  ) {
    return {
      priceChange: null,
      priceChangePercent: null,
      isMissingPriceData: true,
    };
  }

  const priceChange = Number((currentPrice - prevClose).toFixed(2));
  const priceChangePercent = Number(((priceChange / prevClose) * 100).toFixed(2));

  return {
    priceChange,
    priceChangePercent,
    isMissingPriceData: false,
  };
}

/**
 * Calculates the 20-day historical average volume (excluding the current session)
 * and the ratio of current volume against this baseline.
 * Safely handles insufficient sessions (<20), zero volume, and missing current session volume.
 */
export function calculateVolumeRatio(
  currentVolume: number | null,
  pastSessions: DailySession[]
): {
  avg20dVolume: number | null;
  volumeRatio: number | null;
  isInsufficientVolumeHistory: boolean;
} {
  if (!pastSessions || !Array.isArray(pastSessions)) {
    return {
      avg20dVolume: null,
      volumeRatio: null,
      isInsufficientVolumeHistory: true,
    };
  }

  // Exactly slice the previous 20 sessions (excluding today's current session)
  const previous20Sessions = pastSessions.slice(-20);
  const validSessions = previous20Sessions.filter(
    (s) => typeof s.volume === 'number' && !isNaN(s.volume) && s.volume >= 0
  );

  const isInsufficientVolumeHistory = validSessions.length < 20;

  if (validSessions.length === 0) {
    return {
      avg20dVolume: null,
      volumeRatio: null,
      isInsufficientVolumeHistory: true,
    };
  }

  const totalVolume = validSessions.reduce((acc, s) => acc + s.volume, 0);
  // Average across valid historical sessions (strictly preceding current day)
  const avg20dVolume = Math.round(totalVolume / validSessions.length);

  if (
    currentVolume === null ||
    typeof currentVolume !== 'number' ||
    isNaN(currentVolume) ||
    currentVolume < 0 ||
    avg20dVolume <= 0
  ) {
    return {
      avg20dVolume,
      volumeRatio: null,
      isInsufficientVolumeHistory,
    };
  }

  const volumeRatio = Number((currentVolume / avg20dVolume).toFixed(2));

  return {
    avg20dVolume,
    volumeRatio,
    isInsufficientVolumeHistory,
  };
}

/**
 * Computes all derived metrics for a stock record.
 */
export function computeStockMetrics(stock: StockRawData): StockWithMetrics {
  const priceMetrics = calculatePriceMovement(stock.currentPrice, stock.prevClose);
  const volumeMetrics = calculateVolumeRatio(stock.currentVolume, stock.pastSessions);

  return {
    ...stock,
    priceChange: priceMetrics.priceChange,
    priceChangePercent: priceMetrics.priceChangePercent,
    isMissingPriceData: priceMetrics.isMissingPriceData,
    avg20dVolume: volumeMetrics.avg20dVolume,
    volumeRatio: volumeMetrics.volumeRatio,
    isInsufficientVolumeHistory: volumeMetrics.isInsufficientVolumeHistory,
  };
}

/**
 * Derives actionable portfolio alerts dynamically based on user-configured thresholds.
 * High severity is triggered when the anomaly exceeds threshold * multiplier.
 */
export function deriveAlerts(
  stocks: StockWithMetrics[],
  thresholds: ThresholdConfig
): PortfolioAlert[] {
  const alerts: PortfolioAlert[] = [];
  const highPriceThreshold = thresholds.priceChangePercentThreshold * thresholds.highPriorityMultiplier;
  const highVolumeThreshold = thresholds.volumeRatioThreshold * thresholds.highPriorityMultiplier;

  for (const stock of stocks) {
    // 1. Price Movement Alert
    if (stock.priceChangePercent !== null) {
      const absPriceChange = Math.abs(stock.priceChangePercent);
      if (absPriceChange >= thresholds.priceChangePercentThreshold) {
        const isHigh = absPriceChange >= highPriceThreshold;
        const direction = stock.priceChangePercent > 0 ? 'Surge' : 'Drop';
        const sign = stock.priceChangePercent > 0 ? '+' : '';

        alerts.push({
          id: `alert-price-${stock.ticker}`,
          ticker: stock.ticker,
          companyName: stock.name,
          sector: stock.sector,
          type: 'PRICE_MOVEMENT',
          severity: isHigh ? 'HIGH' : 'MEDIUM',
          title: `${stock.ticker} Price ${direction} of ${sign}${stock.priceChangePercent}%`,
          description: `Price moved from ₹${stock.prevClose?.toLocaleString('en-IN')} to ₹${stock.currentPrice?.toLocaleString('en-IN')}, crossing the ±${thresholds.priceChangePercentThreshold}% threshold.`,
          metricLabel: '1D Move',
          metricValue: `${sign}${stock.priceChangePercent}%`,
          timestamp: 'Today, 15:30 IST',
          provenance: 'DEMO',
        });
      }
    }

    // 2. Unusual Volume Alert
    if (stock.volumeRatio !== null && !stock.isInsufficientVolumeHistory) {
      if (stock.volumeRatio >= thresholds.volumeRatioThreshold) {
        const isHigh = stock.volumeRatio >= highVolumeThreshold;

        alerts.push({
          id: `alert-vol-${stock.ticker}`,
          ticker: stock.ticker,
          companyName: stock.name,
          sector: stock.sector,
          type: 'UNUSUAL_VOLUME',
          severity: isHigh ? 'HIGH' : 'MEDIUM',
          title: `${stock.ticker} Trading at ${stock.volumeRatio}x 20D Average Volume`,
          description: `Session volume is ${formatVolumeCompact(stock.currentVolume || 0)} vs 20-day baseline of ${formatVolumeCompact(stock.avg20dVolume || 0)} (threshold: ${thresholds.volumeRatioThreshold}x).`,
          metricLabel: 'Vol Ratio',
          metricValue: `${stock.volumeRatio}x`,
          timestamp: 'Today, 15:30 IST',
          provenance: 'DEMO',
        });
      }
    }
  }

  // Sort alerts: HIGH severity first, then by priority
  return alerts.sort((a, b) => {
    if (a.severity === 'HIGH' && b.severity !== 'HIGH') return -1;
    if (a.severity !== 'HIGH' && b.severity === 'HIGH') return 1;
    return a.ticker.localeCompare(b.ticker);
  });
}

/**
 * Filters alerts based on selected category.
 */
export function filterAlerts(
  alerts: PortfolioAlert[],
  category: AlertFilterCategory
): PortfolioAlert[] {
  switch (category) {
    case 'HIGH_PRIORITY':
      return alerts.filter((a) => a.severity === 'HIGH');
    case 'PRICE_MOVEMENT':
      return alerts.filter((a) => a.type === 'PRICE_MOVEMENT');
    case 'UNUSUAL_VOLUME':
      return alerts.filter((a) => a.type === 'UNUSUAL_VOLUME');
    case 'ALL':
    default:
      return alerts;
  }
}

/**
 * Filters and searches stocks in the watchlist.
 */
export function filterStocks(
  stocks: StockWithMetrics[],
  searchQuery: string,
  selectedSector: string
): StockWithMetrics[] {
  const query = searchQuery.trim().toLowerCase();

  return stocks.filter((stock) => {
    const matchesSearch =
      query === '' ||
      stock.ticker.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query) ||
      stock.sector.toLowerCase().includes(query);

    const matchesSector =
      selectedSector === 'ALL' || stock.sector === selectedSector;

    return matchesSearch && matchesSector;
  });
}

/**
 * Format Indian stock volume compactly (e.g. 1.25M, 850K).
 */
export function formatVolumeCompact(volume: number | null): string {
  if (volume === null || isNaN(volume)) return '—';
  if (volume >= 10_000_000) {
    return `${(volume / 10_000_000).toFixed(2)} Cr`;
  }
  if (volume >= 100_000) {
    return `${(volume / 100_000).toFixed(2)} L`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}k`;
  }
  return volume.toLocaleString('en-IN');
}

/**
 * Format currency in Indian Rupees.
 */
export function formatRupees(amount: number | null): string {
  if (amount === null || isNaN(amount)) return '—';
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
