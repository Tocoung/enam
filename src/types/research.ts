/**
 * Type definitions for the FINN Research Copilot.
 */

export interface TickerValidationResult {
  isValid: boolean;
  normalizedTicker: string;
  error?: string;
}

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
  period: string; // e.g. "FY24 Audited", "Q2 FY25"
  source: string; // e.g. "Audited Annual Report FY24", "BSE Listing Disclosure"
  isReported: boolean;
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

export interface ResearchReport {
  ticker: string;
  companyOverview: CompanyOverview;
  financialSnapshot: FinancialMetric[];
  bullCase: BullCaseItem[];
  bearCase: BearCaseItem[];
  sources: ResearchSource[];
  lastRetrieved: string;
  provenance: 'VERIFIED_FILING' | 'UNINDEXED_EXCHANGE_LOOKUP' | 'DEMO_SYNTHESIS';
  provenanceNote: string;
  isUnindexed?: boolean;
}

export type ResearchStatus = 'idle' | 'loading' | 'success' | 'error';
