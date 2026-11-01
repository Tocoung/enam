/**
 * Type definitions for FINN Research Copilot.
 * Strictly separates ticker format validation from security identity verification
 * and audited filing ingestion.
 */

export interface TickerValidationResult {
  isValid: boolean;
  normalizedTicker: string;
  error?: string;
}

export type IdentityVerificationStatus =
  | 'VERIFIED_CURATED_DOSSIER'
  | 'SYMBOL_FOUND_IN_NSE_MASTER'
  | 'IDENTITY_NOT_VERIFIED';

export type ResearchProvenance =
  | 'CURATED_FILING_DATA'
  | 'SYMBOL_FOUND_IN_NSE_MASTER'
  | 'IDENTITY_NOT_VERIFIED'
  | 'DEMO_DATA';

export type MetricStatus =
  | 'CURATED_FILING_DATA'
  | 'METRIC_NOT_INGESTED'
  | 'EXEMPT_NOT_APPLICABLE';

export interface CompanyOverview {
  companyName: string;
  ticker: string;
  isin?: string;
  cin?: string;
  sector: string;
  industry: string;
  listingExchange: string; // e.g. "NSE: RELIANCE / BSE: 500325"
  businessDescription: string;
  descriptionSource: string;
  foundedYear?: number;
  headquarters?: string;
}

export interface FinancialMetric {
  key: string;
  name: string;
  value: string | number | null;
  formattedValue: string;
  units: string;
  period: string; // e.g. "FY24 Audited", "Not Ingested"
  source: string; // e.g. "Audited Annual Report FY24", "Not Ingested in Offline Dataset"
  status: MetricStatus;
  reportingNote?: string;
}

export interface BullCaseItem {
  id: string;
  title: string;
  thesis: string;
  evidence: string;
  sourceRef: string;
  category: 'market_position' | 'revenue_growth' | 'margin_expansion' | 'capital_allocation' | 'moat';
}

export interface BearCaseItem {
  id: string;
  title: string;
  thesis: string;
  evidence: string;
  sourceRef: string;
  severity: 'HIGH' | 'MEDIUM' | 'MONITOR';
  category:
    | 'regulatory'
    | 'competition'
    | 'margin_pressure'
    | 'valuation'
    | 'macro'
    | 'capital_allocation'
    | 'execution';
}

export type SourceType =
  | 'PRIMARY_FILING'
  | 'EXCHANGE_DISCLOSURE'
  | 'ANNUAL_REPORT'
  | 'REGULATORY_PORTAL'
  | 'SECONDARY_ANALYSIS';

export interface ResearchSource {
  id: string;
  title: string;
  publisher: string;
  publishDate?: string;
  url: string;
  type: SourceType;
  description?: string;
}

export interface ExternalLookupLink {
  id: string;
  title: string;
  label: string;
  url: string;
  purpose: string;
}

export interface ResearchReport {
  ticker: string;
  identityStatus: IdentityVerificationStatus;
  identityMessage: string;
  provenance: ResearchProvenance;
  provenanceLabel: string;
  provenanceNote: string;
  lastRetrieved?: string;
  hasCuratedCoverage: boolean;

  // Verified master attributes (if found in master)
  masterSecurityName?: string;
  masterIsin?: string;

  // Only present if hasCuratedCoverage === true
  companyOverview?: CompanyOverview;
  financialSnapshot: FinancialMetric[];
  bullCase?: BullCaseItem[];
  bearCase?: BearCaseItem[];
  sources?: ResearchSource[];

  // External verification & lookup links (especially for unindexed / unverified symbols)
  externalLookupLinks: ExternalLookupLink[];
}

export type ResearchStatus = 'idle' | 'loading' | 'success' | 'error';
