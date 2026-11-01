import {
  CorporateAnnouncement,
  AnnouncementFilterState,
  AnnouncementFeedMetrics,
  AnnouncementCategory,
  DatasetValidationResult,
  DatasetValidationFailure,
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

/**
 * Lightweight dataset integrity validation function for all announcement records.
 *
 * Validates:
 * 1. Unique announcement IDs.
 * 2. isDemo === (provenance === 'DEMO_DATA').
 * 3. All non-DEMO records have a source URL.
 * 4. All DEMO records have an explicit demo notice.
 * 5. VERIFIED_PRIMARY_DOCUMENT is not paired with EXCHANGE_ARCHIVE, SECONDARY_MEDIA or SIMULATED_PORTAL.
 * 6. OFFICIAL_ARCHIVE_LINK is paired with EXCHANGE_ARCHIVE.
 * 7. SECONDARY_SOURCE is paired with SECONDARY_MEDIA.
 * 8. DEMO_DATA is paired with SIMULATED_PORTAL.
 * 9. All publication dates parse to valid dates.
 * 10. No legacy synthetic exchange filing identifiers remain.
 */
export function validateAnnouncementDataset(
  announcements: CorporateAnnouncement[] = CORPORATE_ANNOUNCEMENTS
): DatasetValidationResult {
  const failures: DatasetValidationFailure[] = [];
  const seenIds = new Set<string>();

  let primaryDocuments = 0;
  let archiveLinks = 0;
  let secondarySources = 0;
  let demoRecords = 0;

  for (const ann of announcements) {
    // 1. Unique announcement IDs
    if (!ann.id || ann.id.trim() === '') {
      failures.push({
        id: ann.id || 'unknown',
        field: 'id',
        message: 'Missing announcement ID',
      });
    } else if (seenIds.has(ann.id)) {
      failures.push({
        id: ann.id,
        field: 'id',
        message: `Duplicate announcement ID: ${ann.id}`,
      });
    } else {
      seenIds.add(ann.id);
    }

    // Provenance counting
    if (ann.provenance === 'VERIFIED_PRIMARY_DOCUMENT') primaryDocuments++;
    else if (ann.provenance === 'OFFICIAL_ARCHIVE_LINK') archiveLinks++;
    else if (ann.provenance === 'SECONDARY_SOURCE') secondarySources++;
    else if (ann.provenance === 'DEMO_DATA') demoRecords++;

    // 2. isDemo === (provenance === 'DEMO_DATA')
    const expectedIsDemo = ann.provenance === 'DEMO_DATA';
    if (ann.isDemo !== expectedIsDemo) {
      failures.push({
        id: ann.id,
        field: 'isDemo',
        message: `isDemo (${ann.isDemo}) does not strictly equal (provenance === 'DEMO_DATA') (${expectedIsDemo})`,
      });
    }

    // 3. All non-DEMO records have a source URL
    if (!ann.isDemo) {
      if (!ann.source?.url || typeof ann.source.url !== 'string' || ann.source.url.trim() === '') {
        failures.push({
          id: ann.id,
          field: 'source.url',
          message: 'Non-DEMO record is missing a valid source URL',
        });
      }
    }

    // 4. All DEMO records have an explicit demo notice
    if (ann.isDemo) {
      if (!ann.demoNotice || typeof ann.demoNotice !== 'string' || ann.demoNotice.trim() === '') {
        failures.push({
          id: ann.id,
          field: 'demoNotice',
          message: 'DEMO record is missing an explicit demo notice',
        });
      }
    }

    // 5. VERIFIED_PRIMARY_DOCUMENT is not paired with EXCHANGE_ARCHIVE, SECONDARY_MEDIA or SIMULATED_PORTAL
    if (ann.provenance === 'VERIFIED_PRIMARY_DOCUMENT') {
      const invalidTypes = ['EXCHANGE_ARCHIVE', 'SECONDARY_MEDIA', 'SIMULATED_PORTAL'];
      if (!ann.source?.type || invalidTypes.includes(ann.source.type)) {
        failures.push({
          id: ann.id,
          field: 'source.type',
          message: `VERIFIED_PRIMARY_DOCUMENT cannot be paired with ${ann.source?.type}`,
        });
      }
    }

    // 6. OFFICIAL_ARCHIVE_LINK is paired with EXCHANGE_ARCHIVE
    if (ann.provenance === 'OFFICIAL_ARCHIVE_LINK') {
      if (ann.source?.type !== 'EXCHANGE_ARCHIVE') {
        failures.push({
          id: ann.id,
          field: 'source.type',
          message: `OFFICIAL_ARCHIVE_LINK must be paired with EXCHANGE_ARCHIVE, got ${ann.source?.type}`,
        });
      }
    }

    // 7. SECONDARY_SOURCE is paired with SECONDARY_MEDIA
    if (ann.provenance === 'SECONDARY_SOURCE') {
      if (ann.source?.type !== 'SECONDARY_MEDIA') {
        failures.push({
          id: ann.id,
          field: 'source.type',
          message: `SECONDARY_SOURCE must be paired with SECONDARY_MEDIA, got ${ann.source?.type}`,
        });
      }
    }

    // 8. DEMO_DATA is paired with SIMULATED_PORTAL
    if (ann.provenance === 'DEMO_DATA') {
      if (ann.source?.type !== 'SIMULATED_PORTAL') {
        failures.push({
          id: ann.id,
          field: 'source.type',
          message: `DEMO_DATA must be paired with SIMULATED_PORTAL, got ${ann.source?.type}`,
        });
      }
    }

    // 9. All publication dates parse to valid dates
    const parsedTime = Date.parse(ann.publishedAt);
    if (isNaN(parsedTime)) {
      failures.push({
        id: ann.id,
        field: 'publishedAt',
        message: `Invalid publication date: "${ann.publishedAt}"`,
      });
    }

    // 10. No legacy synthetic exchange filing identifiers remain
    if (ann.exchangeFilingNumber && ann.exchangeFilingNumber.trim() !== '') {
      failures.push({
        id: ann.id,
        field: 'exchangeFilingNumber',
        message: `Legacy synthetic exchange filing identifier found: "${ann.exchangeFilingNumber}"`,
      });
    }
    const syntheticPattern = /\b(NSE-NEAPS|BSE-XBRL|NSE-REG30|BSE-CA-)\w+/i;
    if (syntheticPattern.test(ann.title) || syntheticPattern.test(ann.summary)) {
      failures.push({
        id: ann.id,
        field: 'title/summary',
        message: `Legacy synthetic filing identifier pattern detected in text for announcement ${ann.id}`,
      });
    }
  }

  return {
    isValid: failures.length === 0,
    totalRecords: announcements.length,
    failures,
    counts: {
      primaryDocuments,
      archiveLinks,
      secondarySources,
      demoRecords,
    },
  };
}
