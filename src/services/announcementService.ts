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
 * Provides typed filtering, deterministic sorting, and aggregate provenance metrics.
 */

export const DEFAULT_ANNOUNCEMENT_FILTERS: AnnouncementFilterState = {
  searchQuery: '',
  category: 'ALL',
  priority: 'ALL',
  provenance: 'ALL',
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

      // 4. Provenance Filter (if specified)
      if (filters.provenance && filters.provenance !== 'ALL' && item.provenance !== filters.provenance) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 5. Sorting logic
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

  let primaryDocCount = 0;
  let archiveLinkCount = 0;
  let secondarySourceCount = 0;
  let demoCount = 0;
  let highPriorityCount = 0;

  for (const ann of announcements) {
    if (ann.provenance === 'VERIFIED_PRIMARY_DOCUMENT') {
      primaryDocCount++;
    } else if (ann.provenance === 'OFFICIAL_ARCHIVE_LINK') {
      archiveLinkCount++;
    } else if (ann.provenance === 'SECONDARY_SOURCE') {
      secondarySourceCount++;
    } else if (ann.provenance === 'DEMO_DATA') {
      demoCount++;
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
    primaryDocCount,
    archiveLinkCount,
    secondarySourceCount,
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
  await new Promise((resolve) => setTimeout(resolve, 60));

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
