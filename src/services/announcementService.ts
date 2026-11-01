import {
  CorporateAnnouncement,
  AnnouncementFilterState,
  AnnouncementFeedMetrics,
  AnnouncementCategory,
} from '../types/announcements';
import { CORPORATE_ANNOUNCEMENTS } from '../data/announcementData';

/**
 * Announcement Service & Feed Adapter.
 *
 * Separates data ingestion and filtering logic from React components, allowing
 * seamless future transition to a backend proxy or live SSE/WebSocket streaming feed.
 */

export const DEFAULT_ANNOUNCEMENT_FILTERS: AnnouncementFilterState = {
  searchQuery: '',
  category: 'ALL',
  priority: 'ALL',
  sortBy: 'NEWEST_FIRST',
};

/**
 * Filter and sort announcements deterministically based on provided filter state.
 */
export function filterAndSortAnnouncements(
  announcements: CorporateAnnouncement[],
  filters: AnnouncementFilterState
): CorporateAnnouncement[] {
  const normalizedQuery = filters.searchQuery.trim().toLowerCase();

  return announcements
    .filter((item) => {
      // 1. Search Query Filter (ticker, companyName, title, summary, sector)
      if (normalizedQuery) {
        const matchesQuery =
          item.ticker.toLowerCase().includes(normalizedQuery) ||
          item.companyName.toLowerCase().includes(normalizedQuery) ||
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.summary.toLowerCase().includes(normalizedQuery) ||
          item.sector.toLowerCase().includes(normalizedQuery);

        if (!matchesQuery) return false;
      }

      // 2. Category Filter
      if (filters.category !== 'ALL' && item.category !== filters.category) {
        return false;
      }

      // 3. Priority Filter
      if (filters.priority === 'HIGH_ONLY' && item.priority !== 'HIGH') {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 4. Sorting logic
      if (filters.sortBy === 'NEWEST_FIRST') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      if (filters.sortBy === 'OLDEST_FIRST') {
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      }
      if (filters.sortBy === 'PRIORITY_DESC') {
        const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (diff !== 0) return diff;
        // Tie-breaker: newest first
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      return 0;
    });
}

/**
 * Compute aggregate feed metrics across all available announcements.
 */
export function computeAnnouncementMetrics(
  announcements: CorporateAnnouncement[]
): AnnouncementFeedMetrics {
  const categoryCounts: Record<AnnouncementCategory, number> = {
    FINANCIAL_RESULTS: 0,
    ORDERS_CONTRACTS: 0,
    CORPORATE_ACTIONS_FUNDRAISING: 0,
    MANAGEMENT_GOVERNANCE: 0,
    REGULATORY_LEGAL: 0,
  };

  let verifiedCount = 0;
  let demoCount = 0;
  let highPriorityCount = 0;

  for (const ann of announcements) {
    if (ann.isDemo) {
      demoCount++;
    } else {
      verifiedCount++;
    }

    if (ann.priority === 'HIGH') {
      highPriorityCount++;
    }

    if (categoryCounts[ann.category] !== undefined) {
      categoryCounts[ann.category]++;
    }
  }

  return {
    totalCount: announcements.length,
    verifiedCount,
    demoCount,
    highPriorityCount,
    categoryCounts,
  };
}

/**
 * Fetch announcements asynchronously via adapter interface.
 */
export async function fetchCorporateAnnouncements(
  filters: AnnouncementFilterState = DEFAULT_ANNOUNCEMENT_FILTERS
): Promise<{
  announcements: CorporateAnnouncement[];
  allCount: number;
  filteredCount: number;
  metrics: AnnouncementFeedMetrics;
}> {
  // Simulated asynchronous dispatch to mirror production network interface
  await new Promise((resolve) => setTimeout(resolve, 80));

  const all = [...CORPORATE_ANNOUNCEMENTS];
  const metrics = computeAnnouncementMetrics(all);
  const filtered = filterAndSortAnnouncements(all, filters);

  return {
    announcements: filtered,
    allCount: all.length,
    filteredCount: filtered.length,
    metrics,
  };
}

/**
 * Helper to generate official exchange lookup URLs for arbitrary tickers.
 */
export function getExchangeAnnouncementUrls(ticker: string) {
  const clean = ticker.trim().toUpperCase();
  return {
    nseUrl: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(clean)}`,
    bseSearchUrl: `https://www.bseindia.com/markets/equity/EQReports/StockPrcDyn.aspx?scripcode=${encodeURIComponent(
      clean
    )}`,
  };
}
