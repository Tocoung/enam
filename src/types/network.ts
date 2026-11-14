/**
 * Type definitions for FINN Network Intelligence Layer.
 * Defines the domain model for professional connections, employment histories,
 * educational backgrounds, structured expertise, and explicit relationship edges.
 *
 * In accordance with FINN data provenance standards, all synthetic demonstration
 * records are explicitly typed and tracked.
 */

export type NetworkDataProvenance =
  | 'SYNTHETIC'        // Procedurally generated or mock records for UI/algorithm demonstration
  | 'PUBLIC_PROFILE'   // Extracted from official regulatory filings, annual report director profiles, or verified press releases
  | 'USER_PROVIDED';   // Private notes and relationships entered directly by the investor

export type OrganisationType =
  | 'LISTED_NSE_BSE'           // Indian equity present in FINN's master registry
  | 'UNLISTED_CORPORATE'        // Private enterprise, consulting firm, PE/VC fund, startup
  | 'EDUCATIONAL_INSTITUTION'   // University, business school, technical institute
  | 'REGULATORY_GOVERNMENT'     // SEBI, RBI, Ministry of Corporate Affairs, CCI
  | 'INDUSTRY_BODY';            // CII, FICCI, NASSCOM, SIAM

/**
 * Discriminated union for organisation references.
 * Ensures listed companies strictly specify a canonical ticker, while
 * unlisted entities specify a stable orgId.
 */
export interface ListedOrganisationRef {
  readonly type: 'LISTED_NSE_BSE';
  /**
   * Canonical ticker key in LOCAL_VERIFIED_SYMBOL_REGISTRY (e.g. 'RELIANCE', 'TCS').
   */
  readonly ticker: string;
  readonly name: string;
  readonly isin?: string;
  readonly sector?: string;
  readonly subsector?: string;
}

export interface UnlistedCorporateRef {
  readonly type: 'UNLISTED_CORPORATE';
  /**
   * Unique external slug for unlisted entities (e.g. 'org-mckinsey-india', 'org-bain-india').
   */
  readonly orgId: string;
  readonly name: string;
  readonly sector?: string;
  readonly subsector?: string;
  readonly websiteUrl?: string;
}

export interface EducationalInstitutionRef {
  readonly type: 'EDUCATIONAL_INSTITUTION';
  /**
   * Unique slug for educational institutions (e.g. 'org-iit-bombay', 'org-iim-ahmedabad').
   */
  readonly orgId: string;
  readonly name: string;
  readonly location?: string;
}

export interface RegulatoryGovernmentRef {
  readonly type: 'REGULATORY_GOVERNMENT';
  /**
   * Unique slug for regulatory or government bodies (e.g. 'org-sebi', 'org-rbi').
   */
  readonly orgId: string;
  readonly name: string;
  readonly jurisdiction?: string;
}

export interface IndustryBodyRef {
  readonly type: 'INDUSTRY_BODY';
  /**
   * Unique slug for industry associations (e.g. 'org-nasscom', 'org-cii').
   */
  readonly orgId: string;
  readonly name: string;
  readonly focusArea?: string;
}

export type OrganisationRef =
  | ListedOrganisationRef
  | UnlistedCorporateRef
  | EducationalInstitutionRef
  | RegulatoryGovernmentRef
  | IndustryBodyRef;

export type ExpertiseCategory =
  | 'SECTOR_INDUSTRY'           // e.g. Downstream Petrochemicals, Quick Commerce, Commercial Banking
  | 'FUNCTIONAL_OPERATIONS'     // e.g. Supply Chain Logistics, Refinery Turnaround, Enterprise Sales
  | 'GOVERNANCE_REGULATORY'     // e.g. SEBI Compliance, Corporate Restructuring, Board Advisory
  | 'TECHNOLOGY_PLATFORMS'      // e.g. Generative AI Implementations, Cloud Migration, Distributed Systems
  | 'CAPITAL_ALLOCATION';       // e.g. M&A Execution, Debt Restructuring, IPO Readiness, ALM

export type ExpertiseProficiency =
  | 'DEEP_OPERATIONAL_EXPERT'    // 10+ years direct hands-on operational execution
  | 'PRACTITIONER'              // Solid operational / advisory capability
  | 'EXECUTIVE_OVERSIGHT';      // Managed or governed teams executing this function

export interface ExpertiseTag {
  readonly id: string;           // e.g. 'exp-o2c-crack-spreads'
  readonly name: string;         // e.g. 'O2C Refining & Petrochemical Crack Spreads'
  readonly category: ExpertiseCategory;
  readonly proficiency: ExpertiseProficiency;
}

export type SeniorityLevel =
  | 'C_LEVEL_EXEC'              // CEO, MD, CFO, COO, CTO, President
  | 'SENIOR_VP_VP'              // Executive VP, VP, Head of Business Unit
  | 'DIRECTOR_LEAD'             // Director, Senior Principal, General Manager
  | 'PRACTITIONER_ANALYST';     // Senior Manager, Consultant, Domain Specialist

export interface EmploymentRecord {
  readonly id: string;
  readonly organisation: OrganisationRef;
  readonly roleTitle: string;    // e.g. 'VP, Refining Operations'
  readonly department?: string;  // e.g. 'Manufacturing & Supply Chain'
  readonly seniority: SeniorityLevel;
  readonly startDate: string;    // ISO format: 'YYYY-MM' or 'YYYY'
  readonly endDate: string | null;// null indicates active current role
  readonly isCurrent: boolean;
  readonly responsibilities: readonly string[];
  readonly relevantDomainTags: readonly string[];
  readonly provenance: NetworkDataProvenance;
}

export interface EducationRecord {
  readonly id: string;
  readonly institution: EducationalInstitutionRef;
  readonly degree: string;        // e.g. 'B.Tech', 'MBA', 'Chartered Accountant'
  readonly fieldOfStudy: string;  // e.g. 'Chemical Engineering', 'Finance'
  readonly startYear?: number;
  readonly endYear?: number;
  readonly provenance: NetworkDataProvenance;
}

export interface Person {
  readonly id: string;           // Stable kebab-case ID (e.g. 'person-arun-sharma')
  readonly name: string;
  readonly currentHeadline: string;// e.g. 'Senior Energy Advisor | Former VP, Refining at RIL'
  readonly currentOrganisation?: OrganisationRef;
  readonly currentRoleTitle?: string;
  readonly location: string;     // Professional city/region only (e.g. 'Mumbai, Maharashtra, India')
  readonly summary: string;      // Concise professional overview
  readonly employmentHistory: readonly EmploymentRecord[];
  readonly educationHistory: readonly EducationRecord[];
  readonly expertise: readonly ExpertiseTag[];
  readonly provenance: NetworkDataProvenance;
  readonly isSynthetic: boolean;
  readonly syntheticNotice?: string;
}

export type RelationshipType =
  | 'PORTFOLIO_EXECUTIVE'       // Executive at a fund portfolio company
  | 'FORMER_COLLEAGUE'          // Previously worked together in the same firm
  | 'INDUSTRY_ADVISOR'          // Retained or trusted commercial/technical advisor
  | 'BOARD_PEER'                // Served together on a board or committee
  | 'UNIVERSITY_ALUMNI'         // Direct alumnus connection with active rapport
  | 'CO_INVESTOR'               // Participated in syndicate or co-investment
  | 'PROFESSIONAL_ACQUAINTANCE'; // Regular conference/industry contact

export type ConnectionStrength = 1 | 2 | 3 | 4 | 5;

export type EdgeDirectionality = 'DIRECTED' | 'UNDIRECTED';

/**
 * Explicit connection between two nodes in the network graph.
 * In FINN, relationship edges are strictly explicit; they are NEVER
 * inferred automatically from shared employment or education.
 *
 * Directionality semantics:
 * - Investor-to-person edges (sourceNodeId === 'INVESTOR_ROOT') are DIRECTED (isDirected: true).
 * - Person-to-person edges (between two Person.id nodes) are explicitly UNDIRECTED (isDirected: false),
 *   representing mutual professional relationships for second-degree referral pathfinding.
 */
export interface NetworkEdge {
  readonly id: string;
  readonly sourceNodeId: string; // 'INVESTOR_ROOT' for direct investor edges, or a Person.id
  readonly targetNodeId: string; // Person.id
  readonly relationshipType: RelationshipType;
  readonly connectionStrength: ConnectionStrength;
  readonly directionality: EdgeDirectionality;
  readonly isDirected: boolean;
  readonly lastInteractionDate?: string; // 'YYYY-MM-DD'
  readonly contextAndEvidence: string;   // Narrative justification for the edge
  readonly sharedContextOrg?: OrganisationRef; // Organisation where relationship formed
  readonly provenance: NetworkDataProvenance;
}

export interface NetworkDatasetMetadata {
  readonly schemaVersion: string;
  readonly generatedAt: string;
  readonly totalPersonas: number;
  readonly totalDirectEdges: number;
  readonly totalSecondDegreeEdges: number;
  readonly provenanceNotice: string;
}

export interface NetworkDataset {
  readonly rootInvestorId: 'INVESTOR_ROOT';
  readonly metadata: NetworkDatasetMetadata;
  readonly people: readonly Person[];
  readonly edges: readonly NetworkEdge[];
}

export interface NetworkValidationResult {
  readonly isValid: boolean;
  readonly totalPersonas: number;
  readonly totalEdges: number;
  readonly directInvestorEdges: number;
  readonly personToPersonEdges: number;
  readonly failures: readonly string[];
}

export const SYNTHETIC_DATASET_DISCLAIMER =
  'SYNTHETIC_DATASET_DISCLAIMER: All personas, paths, and affiliations in this prototype are synthetic investor-network models.';

/**
 * In-memory indexed representation of the network graph for efficient traversal.
 * Edge directionality is strictly respected in the adjacency index:
 * - Direct investor edges are directed outward from 'INVESTOR_ROOT'.
 * - Person-to-person edges are undirected and stored symmetrically for both incident nodes.
 */
export interface NetworkGraph {
  readonly rootInvestorId: 'INVESTOR_ROOT';
  readonly people: ReadonlyMap<string, Person>;
  readonly adjacency: ReadonlyMap<string, readonly NetworkEdge[]>;
  readonly totalNodes: number;
  readonly totalEdges: number;
}

/**
 * Ordered traversal path from INVESTOR_ROOT to a target person.
 * Prototype caps traversal depth at 2 hops (degree 1 or degree 2).
 */
export interface IntroductionPath {
  readonly degree: 1 | 2;
  readonly nodeIds: readonly string[];
  readonly edges: readonly NetworkEdge[];
  readonly intermediary?: Person;
  readonly hopCount: number;
  readonly pathStrength: ConnectionStrength;
  readonly accessibilityScore: number; // 0-100 bounded
  readonly explanation: string;
}

export type RecommendationReasonCategory =
  | 'CURRENT_ROLE'
  | 'PAST_ROLE'
  | 'PEER_ROLE'
  | 'EXPERTISE_EXACT'
  | 'EXPERTISE_PARTIAL'
  | 'RELATIONSHIP_PATH';

export interface RecommendationReason {
  readonly category: RecommendationReasonCategory;
  readonly description: string;
  readonly scoreContribution: number;
  readonly supportingEvidence: string;
}

/**
 * Detailed breakdown of relevance vs accessibility scoring components.
 * Explicitly reconciles raw points, weighted contributions, rounding adjustments,
 * and the final overall score.
 */
export interface ScoreBreakdown {
  readonly rawRelevanceScore: number;
  readonly rawAccessibilityScore: number;
  readonly weightedRelevanceContribution: number;
  readonly weightedAccessibilityContribution: number;
  readonly roundingAdjustment: number;
  readonly overallScore: number;
  readonly reconciliationSummary: string;
}

export interface ContactRecommendation {
  readonly person: Person;
  readonly path: IntroductionPath;
  readonly allPaths: readonly IntroductionPath[];
  readonly degree: 1 | 2;
  readonly accessibilityScore: number; // 0-100 bounded
  readonly relevanceScore: number;     // 0-100 bounded
  readonly overallScore: number;       // 0-100 bounded
  readonly scoreBreakdown: ScoreBreakdown;
  readonly reasons: readonly RecommendationReason[];
  readonly provenanceDisclaimer: string;
}

export type SearchMatchField =
  | 'NAME'
  | 'CURRENT_ROLE'
  | 'CURRENT_ORGANISATION'
  | 'PAST_ROLE'
  | 'PAST_ORGANISATION'
  | 'EXPERTISE'
  | 'HEADLINE_OR_SUMMARY';

export interface SearchMatchReason {
  readonly field: SearchMatchField;
  readonly description: string;
  readonly matchedText: string;
  readonly scoreContribution: number;
}

/**
 * Free-text discovery search result.
 * Separated from professional investment relevance recommendation scoring.
 */
export interface NetworkSearchResult {
  readonly person: Person;
  readonly path: IntroductionPath;
  readonly allPaths: readonly IntroductionPath[];
  readonly degree: 1 | 2;
  readonly searchMatchScore: number;   // 0-100 free-text match quality
  readonly accessibilityScore: number; // 0-100 relationship accessibility
  readonly searchRankingScore: number; // combined discovery score
  readonly matchReasons: readonly SearchMatchReason[];
  readonly provenanceDisclaimer: string;
}

export interface CompanyNetworkQuery {
  readonly type: 'COMPANY';
  readonly ticker: string;
}

export interface SectorNetworkQuery {
  readonly type: 'SECTOR';
  readonly sector: string;
}

export interface ExpertiseNetworkQuery {
  readonly type: 'EXPERTISE';
  readonly query: string;
}

export interface GeneralSearchNetworkQuery {
  readonly type: 'GENERAL';
  readonly query: string;
}

export type NetworkQuery =
  | CompanyNetworkQuery
  | SectorNetworkQuery
  | ExpertiseNetworkQuery
  | GeneralSearchNetworkQuery;

/**
 * Natural language network query intents supported by FINN.
 */
export type NetworkQueryIntentType =
  | 'COMPANY'
  | 'SECTOR'
  | 'EXPERTISE'
  | 'ORGANISATION_HISTORY'
  | 'PERSON_CONNECTION'
  | 'UNKNOWN';

export type InterpretationConfidence = 'EXACT' | 'HIGH' | 'AMBIGUOUS' | 'UNRESOLVED';

export interface BaseInterpretedQuery {
  readonly rawQuery: string;
  readonly intent: NetworkQueryIntentType;
  readonly interpretationLabel: string;
  readonly explanation: string;
  readonly confidence: InterpretationConfidence;
}

export interface CompanyInterpretedQuery extends BaseInterpretedQuery {
  readonly intent: 'COMPANY';
  readonly ticker: string;
  readonly companyName: string;
}

export interface SectorInterpretedQuery extends BaseInterpretedQuery {
  readonly intent: 'SECTOR';
  readonly sector: string;
}

export interface ExpertiseInterpretedQuery extends BaseInterpretedQuery {
  readonly intent: 'EXPERTISE';
  readonly expertiseQuery: string;
}

export interface OrganisationHistoryInterpretedQuery extends BaseInterpretedQuery {
  readonly intent: 'ORGANISATION_HISTORY';
  readonly organisationName: string;
  readonly ticker?: string;
  readonly orgId?: string;
}

export interface PersonConnectionInterpretedQuery extends BaseInterpretedQuery {
  readonly intent: 'PERSON_CONNECTION';
  readonly personName: string;
  readonly targetPerson?: Person;
}

export interface UnknownInterpretedQuery extends BaseInterpretedQuery {
  readonly intent: 'UNKNOWN';
  readonly unresolvedEntity?: string;
  readonly suggestedAlternative?: string;
}

export type InterpretedNetworkQuery =
  | CompanyInterpretedQuery
  | SectorInterpretedQuery
  | ExpertiseInterpretedQuery
  | OrganisationHistoryInterpretedQuery
  | PersonConnectionInterpretedQuery
  | UnknownInterpretedQuery;

export type QueryExecutionStatus =
  | 'SUCCESS'
  | 'NO_MATCHES'
  | 'UNKNOWN_ENTITY'
  | 'AMBIGUOUS'
  | 'EMPTY';

/**
 * Intermediary peer along a 2nd-degree path who can facilitate an introduction
 * to the target persona. Strictly distinct from domain/professional expertise recommendations.
 */
export interface IntroductionFacilitator {
  readonly person: Person;
  readonly targetPerson: Person;
  readonly path: IntroductionPath;
  readonly facilitatedPathSummary: string;
  readonly accessibilityScore: number;
  readonly rankingScore: number;
  readonly roleBadge: 'Introduction Facilitator';
  readonly reasons: readonly RecommendationReason[];
  readonly explanation: string;
  readonly provenanceDisclaimer: string;
}

export interface QueryExecutionResult {
  readonly query: InterpretedNetworkQuery;
  readonly recommendations: readonly ContactRecommendation[];
  readonly targetRecommendation?: ContactRecommendation;
  readonly introductionFacilitators?: readonly IntroductionFacilitator[];
  readonly personConnectionPaths?: readonly IntroductionPath[];
  readonly status: QueryExecutionStatus;
  readonly statusMessage: string;
  readonly provenanceNotice: string;
}

/**
 * Summary KPI metrics for the Network Overview tab.
 * Dynamically computed from graph structure and personas.
 */
export interface NetworkOverviewMetrics {
  readonly totalContacts: number;
  readonly firstDegreeCount: number;
  readonly secondDegreeCount: number;
  readonly totalEdges: number;
  readonly directInvestorEdges: number;
  readonly peerToPeerEdges: number;
  readonly expertiseCategoryCounts: Record<ExpertiseCategory, number>;
  readonly totalExpertiseTags: number;
  readonly provenanceNotice: string;
}

