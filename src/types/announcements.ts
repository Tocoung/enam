/**
 * Type definitions for Corporate Announcement Intelligence Feed.
 * Strictly separates authentic exchange-filed announcements from
 * illustrative DEMO simulations and external portal lookups.
 */

export type AnnouncementCategory =
  | 'FINANCIAL_RESULTS'
  | 'ORDERS_CONTRACTS'
  | 'CORPORATE_ACTIONS_FUNDRAISING'
  | 'MANAGEMENT_GOVERNANCE'
  | 'REGULATORY_LEGAL';

export type AnnouncementPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type AnnouncementProvenance =
  | 'VERIFIED_FILING'
  | 'DEMO_DATA'
  | 'EXTERNAL_PORTAL';

export type AnnouncementSourceType =
  | 'BSE_FILING'
  | 'NSE_DISCLOSURE'
  | 'COMPANY_PORTAL'
  | 'SIMULATED_FEED';

export interface AnnouncementSource {
  title: string;
  publisher: string;
  url: string;
  type: AnnouncementSourceType;
  isVerifiedFiling: boolean;
  documentTitle?: string;
  format?: 'PDF' | 'XBRL' | 'PORTAL';
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
  publishedAt: string; // ISO 8601 string for sorting: "YYYY-MM-DDTHH:mm:ss"
  displayDate: string; // Formatted date string for editorial presentation
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
export type AnnouncementSortOption = 'NEWEST_FIRST' | 'OLDEST_FIRST' | 'PRIORITY_DESC';

export interface AnnouncementFilterState {
  searchQuery: string;
  category: AnnouncementCategoryFilter;
  priority: AnnouncementPriorityFilter;
  sortBy: AnnouncementSortOption;
}

export interface AnnouncementFeedMetrics {
  totalCount: number;
  verifiedCount: number;
  demoCount: number;
  highPriorityCount: number;
  categoryCounts: Record<AnnouncementCategory, number>;
}
