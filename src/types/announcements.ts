/**
 * Type definitions for Corporate Announcement Intelligence Feed.
 * Strictly separates authentic exact primary documents from broad exchange archives,
 * secondary press sources, and illustrative DEMO simulations.
 */

export type AnnouncementCategory =
  | 'FINANCIAL_RESULTS'
  | 'ORDERS_CONTRACTS'
  | 'CORPORATE_ACTIONS_FUNDRAISING'
  | 'MANAGEMENT_GOVERNANCE'
  | 'REGULATORY_LEGAL';

export type AnnouncementPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type AnnouncementProvenance =
  | 'VERIFIED_PRIMARY_DOCUMENT'
  | 'OFFICIAL_ARCHIVE_LINK'
  | 'SECONDARY_SOURCE'
  | 'DEMO_DATA';

export type AnnouncementSourceType =
  | 'EXCHANGE_FILING'
  | 'COMPANY_PRESS_RELEASE'
  | 'COMPANY_REGULATORY_DISCLOSURE'
  | 'EXCHANGE_ARCHIVE'
  | 'SECONDARY_MEDIA'
  | 'SIMULATED_PORTAL';

export interface AnnouncementSource {
  title: string;
  publisher: string;
  url: string;
  type: AnnouncementSourceType;
  documentTitle?: string;
  format?: 'PDF' | 'XBRL' | 'PORTAL' | 'ARTICLE';
}

export interface CorporateAnnouncement {
  id: string;
  ticker: string;
  companyName: string;
  isin?: string;
  sector: string;
  title: string;
  summary: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  priorityRationale: string;
  publishedAt: string; // ISO 8601 string: "YYYY-MM-DDTHH:mm:ss"
  displayDate: string; // Formatted date string with context (e.g. "Filing Date: Oct 22, 2024")
  source?: AnnouncementSource;
  provenance: AnnouncementProvenance;
  provenanceLabel: string;
  isDemo: boolean;
  demoNotice?: string;
  keyHighlights?: string[];
  exchangeFilingNumber?: string;
}

export type AnnouncementCategoryFilter = 'ALL' | AnnouncementCategory;
export type AnnouncementPriorityFilter = 'ALL' | 'HIGH_ONLY';
export type AnnouncementProvenanceFilter = 'ALL' | AnnouncementProvenance;
export type AnnouncementSortOption = 'NEWEST_FIRST' | 'OLDEST_FIRST' | 'PRIORITY_DESC';

export interface AnnouncementFilterState {
  searchQuery: string;
  category: AnnouncementCategoryFilter;
  priority: AnnouncementPriorityFilter;
  provenance?: AnnouncementProvenanceFilter;
  sortBy: AnnouncementSortOption;
}

export interface AnnouncementFeedMetrics {
  totalCount: number;
  primaryDocCount: number;
  archiveLinkCount: number;
  secondarySourceCount: number;
  demoCount: number;
  highPriorityCount: number;
  categoryCounts: Record<AnnouncementCategory, number>;
}

export interface DatasetValidationFailure {
  id: string;
  field: string;
  message: string;
}

export interface DatasetValidationResult {
  isValid: boolean;
  totalRecords: number;
  failures: DatasetValidationFailure[];
  counts: {
    primaryDocuments: number;
    archiveLinks: number;
    secondarySources: number;
    demoRecords: number;
  };
}
