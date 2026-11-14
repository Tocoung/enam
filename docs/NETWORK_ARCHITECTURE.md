# FINN Network Intelligence Layer — Architectural Design & Domain Model

**Document Version:** 1.0.0-DRAFT  
**Author:** Founding AI Engineer / FINN Architecture Team  
**Date:** November 2026  
**Status:** Phase 1, Step 3.2 Complete — Deep Freeze, Sector Ambiguity & Scoring Boundary Hardening Implemented  
**Target Repository:** `https://github.com/Tocoung/enam`  
**Current Commit:** `[Pending Step 3.2 commit]` (Base commit: `1a8313b790b3b9a7a5193cbfd7889f7c4e7f3758`)

---

## 1. Executive Summary

FINN (*Financial Investment Agent*) is an institutional-grade investment intelligence interface tailored for the Indian equity markets (NSE/BSE). The platform currently combines three core pillars:
1. **Portfolio Intelligence (Push)**: A dual-mode (`DEMO` vs. `REAL_EOD`) watchlist tracking 20 large-cap Indian equities, 20-session volume baselines, price/volume breakout alerts, and market breadth.
2. **Research Copilot (Pull)**: An evidence-grounded equity inspection terminal supporting audited statutory filings, structured bull/bear investment theses, and direct earnings-call primary document links.
3. **Corporate Announcement Intelligence (Filings)**: A real-time SEBI LODR regulatory disclosure feed with objective materiality scoring and bidirectional cross-navigation.

This specification designs the fourth pillar: the **Network Intelligence Layer**.

### The Strategic Value of Network Intelligence for Equity Investors
In institutional equity investing, public filings, earnings releases, and quantitative market data provide *what* occurred. However, understanding the *operational reality*, *industry ground truth*, and *organizational culture* of companies requires primary qualitative intelligence:
- Speaking with former operating executives who ran refining or retail supply chains.
- Consulting banking domain experts on NPA provisioning and credit growth dynamics.
- Reaching out to trusted peers who evaluate software vendor contract renewals.

The **Network Intelligence Layer** models an investor's professional relationship web as a client-side property graph. It systematically links:
$$\text{Investor} \xrightarrow{\text{explicit relationship}} \text{Industry Professional} \xrightarrow{\text{employment / affiliation}} \text{Target Company / Sector}$$

By cross-referencing this relationship graph with FINN's existing company registries and regulatory announcement feeds, FINN transforms an otherwise static contact list into an **active intelligence asset**.

---

## 2. Existing FINN Architecture Findings

A thorough audit of the current repository (`main` at `24fd8d7`) was conducted to ground the proposed design in verified codebase realities.

### 2.1 Repository & Technology Stack (Verified)
- **Framework & Runtime**: React 18.3.1 running on Vite 6.0.3 and TypeScript 5.6.3 (`package.json`, `tsconfig.json`).
- **Styling Architecture**: Tailwind CSS 3.4.16 utilizing an editorial dark-navy palette (`#070b14` canvas, slate/indigo visual hierarchies).
- **Iconography**: Standalone pure SVG components (`src/components/icons.tsx`), eliminating heavyweight third-party icon libraries.
- **Dependencies**: Zero backend servers, zero runtime database connectors, zero external graph database dependencies. All computations execute client-side in the browser.

### 2.2 Navigation Model & Application Coordinator (`src/App.tsx`, `src/components/Header.tsx`)
- Navigation is coordinated through a single top-level state variable in `App.tsx`:
  ```typescript
  const [activePage, setActivePage] = useState<'dashboard' | 'research' | 'announcements'>(...);
  ```
- Navigation is synchronized bidirectionally with browser URL search parameters:
  - `?page=announcements&ticker=RELIANCE`
  - `?page=research&ticker=TCS`
  - Defaults to `'dashboard'` when query parameters are omitted.
- `src/components/Header.tsx` renders top-level navigation tabs (`Dashboard`, `Research`, `Announcements`), the dual-mode switch (`DEMO` / `REAL_EOD`), and the alert threshold configuration trigger.
- `App.tsx` also renders a fixed mobile bottom navigation bar (`lg:hidden`).

### 2.3 Company Identity & Ticker Registries (`src/data/researchData.ts`, `src/types/research.ts`)
FINN maintains a strictly validated, non-duplicative company identity structure:
1. **Local Master Symbol Registry** (`LOCAL_VERIFIED_SYMBOL_REGISTRY` in `src/data/researchData.ts`):
   - A curated dictionary of **27 recognized Indian equity symbols** (20 portfolio equities + 7 non-portfolio large-caps).
   - Maps each ticker to canonical metadata: `{ companyName: string; isin: string }`.
   - Examples:
     ```typescript
     RELIANCE: { companyName: 'Reliance Industries Limited', isin: 'INE002A01018' },
     TCS: { companyName: 'Tata Consultancy Services Limited', isin: 'INE467B01029' },
     ZOMATO: { companyName: 'Zomato Limited', isin: 'INE758T01015' },
     SWIGGY: { companyName: 'Swiggy Limited', isin: 'INE00H001014' },
     TRENT: { companyName: 'Trent Limited', isin: 'INE849A01020' }
     ```
2. **Curated Research Dossier Registry** (`VERIFIED_RESEARCH_REGISTRY` in `src/data/researchData.ts`):
   - Exactly **6 core companies** have full offline research dossiers (`RELIANCE`, `TCS`, `HDFCBANK`, `BHARTIARTL`, `ZOMATO`, `SWIGGY`).
   - Detailed schema (`ResearchReport`) includes `companyOverview` (`cin`, `sector`, `industry`, `listingExchange`, `headquarters`, `businessDescription`), `financialSnapshot`, `bullCase`, `bearCase`, `sources`, and `externalLookupLinks`.
3. **Format Validation** (`validateTicker` in `src/services/researchService.ts`):
   - Enforces uppercase alphanumeric NSE format: `/^[A-Z0-9&-]{1,20}$/`.

### 2.4 Data Provenance Conventions (Verified)
The repository strictly enforces provenance labeling across all subsystems:
- **Portfolio**: `ProvenanceTag = 'DEMO' | 'REAL_EOD' | 'DEMO_FALLBACK'` (`src/types/portfolio.ts`).
- **Research**: `ResearchProvenance = 'CURATED_FILING_DATA' | 'SYMBOL_FOUND_IN_LOCAL_REGISTRY' | 'IDENTITY_NOT_VERIFIED' | 'DEMO_DATA'` (`src/types/research.ts`).
- **Announcements**: `AnnouncementProvenance = 'VERIFIED_PRIMARY_DOCUMENT' | 'OFFICIAL_ARCHIVE_LINK' | 'SECONDARY_SOURCE' | 'DEMO_DATA'` (`src/types/announcements.ts`).

### 2.5 Current Dossier Resolution Workflow (`src/services/researchService.ts`)
When an investor enters a ticker symbol into Research Copilot:
1. `validateTicker(rawInput)` validates syntax.
2. Checks `VERIFIED_RESEARCH_REGISTRY[ticker]`. If matched, returns curated dossier with status `VERIFIED_CURATED_DOSSIER`.
3. If not in curated dossiers, checks `LOCAL_VERIFIED_SYMBOL_REGISTRY[ticker]`. If matched, returns `SYMBOL_FOUND_IN_LOCAL_REGISTRY` with unavailable metrics and external exchange lookup links.
4. If neither matches, returns `IDENTITY_NOT_VERIFIED` with zero fabricated metrics or claims.

---

## 3. Proposed Network Architecture

To preserve FINN's high performance, clean modularity, and client-side privacy, the Network Intelligence Layer is designed as a **decoupled, in-memory graph service**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRESENTATION LAYER                                    │
│                                                                                         │
│  ┌─────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────┐  │
│  │   Standalone Network    │   │  Research Copilot Panel  │   │ Announcement Context │  │
│  │     Explorer View       │   │ "Who can help understand │   │  "Network Angles for │  │
│  │  (Browse & Graph View)  │   │      this company?"      │   │     this Filing"     │  │
│  └───────────┬─────────────┘   └────────────┬─────────────┘   └──────────┬───────────┘  │
└──────────────┼──────────────────────────────┼────────────────────────────┼──────────────┘
               │                              │                            │
┌──────────────▼──────────────────────────────▼────────────────────────────▼──────────────┐
│                                    SERVICE LAYER                                        │
│                              src/services/networkService.ts                             │
│                                                                                         │
│   • Graph Construction & Adjacency Indexing                                             │
│   • Path Finding (BFS / Dijkstra shortest & highest-strength paths)                     │
│   • Explainable Recommendation & Relevance Scoring Engine                               │
│   • Company & Industry Query Resolvers                                                  │
└──────────────────────────────────────┬──────────────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────────────────┐
│                                    DATA LAYER                                           │
│                               src/data/networkData.ts                                   │
│                                                                                         │
│   • Root Investor Node ("You / Primary Investor")                                       │
│   • Curated Synthetic Person Profiles (Structured Employment, Education, Expertise)     │
│   • Explicit Investor-to-Person Relationships (Degree 1 Edges)                          │
│   • Explicit Person-to-Person Relationships (Degree 2+ Edges)                           │
└───────────────────┬─────────────────────────────────────────────────┬───────────────────┘
                    │                                                 │
                    │ References                                      │ References
┌───────────────────▼─────────────────────┐     ┌─────────────────────▼───────────────────┐
│        EXISTING COMPANY REGISTRY        │     │         PROVENANCE & PRIVACY            │
│   src/data/researchData.ts              │     │   Strict 'SYNTHETIC' classification     │
│   (LOCAL_VERIFIED_SYMBOL_REGISTRY)      │     │   Isolated mock personal entities       │
└─────────────────────────────────────────┘     └─────────────────────────────────────────┘
```

### Architectural Principles:
1. **Re-use, Never Duplicate**: Company affiliations reference existing canonical tickers from `LOCAL_VERIFIED_SYMBOL_REGISTRY`. Unlisted entities and institutions use a normalized external reference pattern.
2. **Explicit Edges Only**: Relationships are never assumed based on co-tenure or co-alumni status. An edge requires explicit evidence, connection strength, and interaction context.
3. **Pure Functional Logic**: The graph traversal, scoring, and query filters are pure TypeScript functions amenable to deterministic automated unit testing.
4. **Client-Side Scalability**: Designed for networks of 100–1,000 nodes and 200–5,000 edges, executing pathfinding and ranking in $<5\text{ ms}$ on modern browser engines without round-trips.

---

## 4. Domain Entities and TypeScript Interface Definitions

The domain model will be authored in a new dedicated type file: `src/types/network.ts`.

### 4.1 Provenance Taxonomy
```typescript
/**
 * Data provenance classification for Network intelligence records.
 * In Phase 1, all mock personal data is strictly SYNTHETIC.
 */
export type NetworkDataProvenance =
  | 'SYNTHETIC'       // Procedurally generated or mock records for UI/algorithm demonstration
  | 'PUBLIC_PROFILE'  // Extracted from official regulatory filings, annual report director profiles, or verified press releases
  | 'USER_PROVIDED';  // Private notes and relationships entered directly by the investor
```

### 4.2 Organisation & Affiliation References
```typescript
export type OrganisationType =
  | 'LISTED_NSE_BSE'          // Indian equity present in FINN's master registry
  | 'UNLISTED_CORPORATE'       // Private enterprise, consulting firm, PE/VC fund, startup
  | 'EDUCATIONAL_INSTITUTION'  // University, business school, technical institute
  | 'REGULATORY_GOVERNMENT'    // SEBI, RBI, Ministry of Corporate Affairs, CCI
  | 'INDUSTRY_BODY';           // CII, FICCI, NASSCOM, SIAM

/**
 * Normalized reference to an organisation.
 * If listed, reuses the canonical FINN ticker to link seamlessly to company dossiers and filings.
 */
export interface OrganisationRef {
  type: OrganisationType;
  /**
   * If type === 'LISTED_NSE_BSE', ticker MUST be a valid key in LOCAL_VERIFIED_SYMBOL_REGISTRY (e.g. 'RELIANCE', 'TCS').
   */
  ticker?: string;
  /**
   * Unique external slug for unlisted entities (e.g. 'org-mckinsey-india', 'org-iit-bombay').
   */
  orgId?: string;
  name: string;
  sector?: string;
  subsector?: string;
}
```

### 4.3 Structured Expertise Tags
```typescript
export type ExpertiseCategory =
  | 'SECTOR_INDUSTRY'          // e.g. Downstream Petrochemicals, Retail Quick-Commerce, Commercial Banking
  | 'FUNCTIONAL_OPERATIONS'    // e.g. Supply Chain Logistics, Refinery Turnaround, Enterprise Sales
  | 'GOVERNANCE_REGULATORY'    // e.g. SEBI Compliance, RBI Audit, Corporate Restructuring
  | 'TECHNOLOGY_PLATFORMS'     // e.g. Generative AI Implementations, Core Banking Migration
  | 'CAPITAL_ALLOCATION';      // e.g. M&A Execution, Debt Restructuring, IPO Readiness

export type ExpertiseProficiency =
  | 'DEEP_OPERATIONAL_EXPERT'   // 10+ years direct hands-on execution experience
  | 'PRACTITIONER'             // Solid operational / advisory capability
  | 'EXECUTIVE_OVERSIGHT';     // Managed or governed teams executing this function

export interface ExpertiseTag {
  id: string;                  // e.g. 'exp-o2c-refining-margins'
  name: string;                // e.g. 'O2C Refining & Petrochemical Crack Spreads'
  category: ExpertiseCategory;
  proficiency: ExpertiseProficiency;
}
```

### 4.4 Employment History
```typescript
export type SeniorityLevel =
  | 'C_LEVEL_EXEC'             // CEO, MD, CFO, COO, CTO, President
  | 'SENIOR_VP_VP'             // Executive VP, VP, Head of Business Unit
  | 'DIRECTOR_LEAD'            // Director, Senior Principal, General Manager
  | 'PRACTITIONER_ANALYST';    // Senior Manager, Consultant, Domain Specialist

export interface EmploymentRecord {
  id: string;
  organisation: OrganisationRef;
  roleTitle: string;           // e.g. 'Head of Refining Operations'
  department?: string;         // e.g. 'Manufacturing & Supply Chain'
  seniority: SeniorityLevel;
  startDate: string;           // ISO format: 'YYYY-MM' or 'YYYY'
  endDate: string | null;      // null indicates active current role
  isCurrent: boolean;
  responsibilities: string[];  // Factual scope of duties
  relevantDomainTags: string[];// Keywords linked to business drivers (e.g. 'Crack Spreads', 'Store Rollout')
}
```

### 4.5 Education History
```typescript
export interface EducationRecord {
  id: string;
  institution: OrganisationRef; // Must have type === 'EDUCATIONAL_INSTITUTION'
  degree: string;               // e.g. 'B.Tech', 'MBA', 'Chartered Accountant'
  fieldOfStudy: string;         // e.g. 'Chemical Engineering', 'Finance'
  startYear?: number;
  endYear?: number;
}
```

### 4.6 Person Entity
```typescript
export interface Person {
  id: string;                  // Stable kebab-case ID (e.g. 'person-arun-sharma')
  name: string;
  currentHeadline: string;     // e.g. 'Senior Advisor, Energy Transition | Former Director, RIL'
  currentOrganisation?: OrganisationRef;
  currentRoleTitle?: string;
  location: string;            // e.g. 'Mumbai, Maharashtra, India'
  summary: string;             // Concise professional overview
  employmentHistory: EmploymentRecord[];
  educationHistory: EducationRecord[];
  expertise: ExpertiseTag[];
  provenance: NetworkDataProvenance;
  isSynthetic: boolean;
  syntheticNotice?: string;
}
```

### 4.7 Relationship Model (Edges)
```typescript
export type RelationshipType =
  | 'PORTFOLIO_EXECUTIVE'      // Executive at a fund portfolio company
  | 'FORMER_COLLEAGUE'         // Previously worked together in the same firm
  | 'INDUSTRY_ADVISOR'         // Retained or trusted commercial/technical advisor
  | 'BOARD_PEER'               // Served together on a board or committee
  | 'UNIVERSITY_ALUMNI'        // Direct alumnus connection with active rapport
  | 'CO_INVESTOR'              // Participated in syndicate or co-investment
  | 'PROFESSIONAL_ACQUAINTANCE';// Regular conference/industry contact

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
  id: string;
  sourceNodeId: string;        // 'INVESTOR_ROOT' for direct investor relationships, or a Person.id
  targetNodeId: string;        // Person.id
  relationshipType: RelationshipType;
  connectionStrength: ConnectionStrength;
  directionality: EdgeDirectionality;
  isDirected: boolean;
  lastInteractionDate?: string;// 'YYYY-MM-DD'
  contextAndEvidence: string;  // Explicit explanation justifying the edge
  sharedContextOrg?: OrganisationRef; // Shared employer or board where the relationship was built
  provenance: NetworkDataProvenance;
}
```

### 4.8 Phase 1 Step 2 Domain Model Refinements & Discriminated Union
In the implemented domain model (`src/types/network.ts`), `OrganisationRef` is structured as a discriminated union over `type`:
- `ListedOrganisationRef`: `type: 'LISTED_NSE_BSE'`, strictly requires `ticker: string` matching `LOCAL_VERIFIED_SYMBOL_REGISTRY`.
- `UnlistedCorporateRef`: `type: 'UNLISTED_CORPORATE'`, strictly requires `orgId: string` (e.g. `'org-mckinsey-india'`).
- `EducationalInstitutionRef`: `type: 'EDUCATIONAL_INSTITUTION'`, strictly requires `orgId: string` (e.g. `'org-iit-bombay'`).
- `RegulatoryGovernmentRef`: `type: 'REGULATORY_GOVERNMENT'`, strictly requires `orgId: string` (e.g. `'org-sebi'`).
- `IndustryBodyRef`: `type: 'INDUSTRY_BODY'`, strictly requires `orgId: string` (e.g. `'org-cii'`).

This compile-time discrimination prevents invalid combinations (such as listed entities lacking a ticker or unlisted entities lacking an orgId) and enforces FINN's local registry reuse.

---

## 5. Relationship Graph Representation

### 5.1 Root Node Convention & Edge Directionality
The investor is represented as the single root node:
- **`INVESTOR_ROOT`**: Represents the authenticated investor user ("You").
- Direct investor connections are edges where `sourceNodeId === 'INVESTOR_ROOT'`.
- All other connections are edges between two `Person.id` nodes.
- **Directionality Convention**:
  - **Investor-to-Person Edges**: Strictly **DIRECTED** (`sourceNodeId: 'INVESTOR_ROOT'`, `directionality: 'DIRECTED'`, `isDirected: true`). Represents the investor's direct reach to known contacts.
  - **Person-to-Person Edges**: Explicitly **UNDIRECTED** (`directionality: 'UNDIRECTED'`, `isDirected: false`). Represents mutual professional relationships between peers; second-degree introduction paths traverse symmetrically regardless of which node was defined as source or target.

```
       [ INVESTOR_ROOT ] ("You")
         │           │
Strength │ 5         │ 4 (Direct 1st-Degree, DIRECTED)
         ▼           ▼
   [ Person A ]   [ Person B ]
   (Ex-RIL VP)    (Partner, Top Tier VC)
         │
Strength │ 4 (2nd-Degree Mutual Peer Tie, UNDIRECTED)
         ▼
   [ Person C ]
   (Current CFO, Listed Competitor)
```

### 5.2 Explicit Edge Invariant (Anti-Hallucination Guard)
> [!IMPORTANT]
> **Strict Non-Inference Rule**: A relationship edge MUST NOT be inferred automatically simply because two individuals share the same university or overlapping employer dates.  
> Co-tenure at a massive enterprise (such as TCS with 600,000+ employees or Reliance with 300,000+ employees) does not constitute a personal relationship. Edges exist **only** when explicitly recorded in `networkData.ts` with dedicated narrative evidence.

### 5.3 Client-Side Graph Traversal Architecture
The graph is maintained in memory using an **Adjacency List Index** (`buildNetworkGraph` in `src/services/networkService.ts`):
```typescript
export interface NetworkGraph {
  readonly rootInvestorId: 'INVESTOR_ROOT';
  readonly people: ReadonlyMap<string, Person>;
  readonly adjacency: ReadonlyMap<string, readonly NetworkEdge[]>;
  readonly totalNodes: number;
  readonly totalEdges: number;
}
```

#### Traversal Rules & Invariants:
1. **Direct Contacts (Degree 1)**: Traversed via direct outward edges where `sourceNodeId === 'INVESTOR_ROOT'`. Investor edges are strictly directed and cannot be traversed backwards.
2. **Second-Degree Contacts (Degree 2)**: Reached via a two-hop path:
   $$\text{INVESTOR\_ROOT} \xrightarrow{\text{Edge}_1\text{ (Directed)}} \text{Person}_A \xrightarrow{\text{Edge}_2\text{ (Undirected)}} \text{Person}_B$$
3. **Traversal Depth Capped at 2 Hops**: The pathfinder explores direct and 2nd-degree paths exclusively. 3rd-degree exploration is excluded to prevent exponential search expansion and low-trust noise.
4. **No Repeated Nodes**: Paths must contain strictly distinct nodes; self-referential or cyclic introductions are rejected.
5. **Deterministic Ordering**: When multiple paths exist to a target contact, paths are sorted deterministically:
   - Hop count ascending (degree 1 before degree 2).
   - Accessibility score descending.
   - Intermediary persona ID ascending (lexicographical tie-break).
   - Edge IDs ascending.
6. **Introduction Path Model**:
```typescript
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
```

---

## 6. Connection-Strength Semantics

To avoid subjective ambiguity, connection strengths are governed by explicit criteria:

| Strength | Semantic Tier | Interaction Frequency | Mutual Trust & Responsiveness | Typical Context Example |
| :---: | :---: | :---: | :---: | :---: |
| **5** | **Inner-Circle Confidant** | Weekly / Monthly active dialogue | Immediate responsiveness; willing to provide critical confidential counsel. | Former co-founder, long-time direct report, close operating partner. |
| **4** | **High-Trust Collaborator** | Quarterly touchpoints | High willingness to provide thorough briefing or direct introductions. | Senior executive who managed major transactions together over multiple years. |
| **3** | **Established Professional** | Bi-annual / Annual contact | Dependable response for targeted domain questions. | Former colleague from a prior firm; respected advisory board member. |
| **2** | **Warm Acquaintance** | Occasional / Event-based | Polite response; may require context refresher before asking for favors. | Co-panelist at investor symposium, alumni peer from same cohort. |
| **1** | **Distant Contact** | Sporadic / Dormant (>2 yrs) | Low response probability; cold outreach dynamics. | Met once at an industry summit, exchanged business cards. |

---

## 7. Recommendation-Scoring Design

FINN will answer four primary investor questions:
1. *"Who in my network can help me understand Company X (e.g. RELIANCE)?"*
2. *"Who has deep domain expertise in Sector Y (e.g. Commercial Banking or Quick Commerce)?"*
3. *"Who has worked at a key competitor of Company X?"*
4. *"Who can introduce me to Person Z?"*

### 7.1 Separation of Relevance vs. Accessibility
A critical flaw in naive networking tools is conflating **how well a person knows a topic** with **how easily the investor can reach them**. FINN explicitly decouples these two dimensions:

$$\text{Overall Score} = \text{round}\left(0.65 \times \text{Relevance Score} + 0.35 \times \text{Accessibility Score}\right)$$

> [!IMPORTANT]
> **Strict Professional Relevance Invariant**: If a candidate has zero professional relevance ($\text{relevanceScore} = 0$), they are **strictly excluded** from recommendation results ($\text{overallScore} = 0$). A close personal friend or high-accessibility contact is never recommended for a company or sector inquiry unless they possess substantive domain relevance.

```
                ▲ Domain Relevance Score (0 - 100)
                │
                │     [ High Relevance, Low Access ]      [ High Relevance, High Access ]
                │     Ex-Executive (2nd-degree intro)     Current VP (1st-degree, Strength 5)
                │     • "Warm referral via peer"          • "Direct top recommendation"
                │
                │     [ Zero Relevance: EXCLUDED ]        [ Zero Relevance: EXCLUDED ]
                │     Distant contact in other sector     Close friend in unrelated field
                │     • Excluded from results             • Excluded from results (No spam)
                └────────────────────────────────────────────────────────────────────────►
                                                      Relationship Accessibility Score (0 - 100)
```

### 7.2 Domain Relevance Scoring Engine ($\text{Score} \in [0, 100]$)

The scoring engine evaluates candidate relevance across four query modalities:

#### 1. Company Queries (`getContactsForCompany(ticker, graph)`):
- **Current Employment**: $+60\text{ pts}$ (`CURRENT_ROLE`) if currently employed at target company.
- **Previous Employment**: $+35\text{ pts}$ (`PAST_ROLE`) for previous tenure at target company.
- **Sector Peer Affiliation**: $+20\text{ pts}$ (current peer role) or $+10\text{ pts}$ (past peer role) (`PEER_ROLE`) in the same sector (e.g. Swiggy vs Zomato in Consumer Services, TCS vs Infosys in IT).
- **Domain Expertise Alignment**: $+15\text{ pts}$ (exact match) or $+10\text{ pts}$ (partial match) multiplied by proficiency factor (`EXPERTISE_EXACT` / `EXPERTISE_PARTIAL`).
- **Profile Headline / Overview Match**: $+10\text{ pts}$ (`EXPERTISE_PARTIAL`).

#### 2. Sector Queries (`getContactsForSector(sector, graph)`):
- **Current Role in Sector**: $+50\text{ pts}$ (`CURRENT_ROLE`).
- **Past Role in Sector**: $+25\text{ pts}$ (`PAST_ROLE`).
- **Exact Sector Expertise Tag**: $+25\text{ pts} \times \text{proficiencyMultiplier}$ (`EXPERTISE_EXACT`).
- **Operational / Subsector Tag**: $+15\text{ pts} \times \text{proficiencyMultiplier}$ (`EXPERTISE_PARTIAL`).

#### 3. Expertise Queries (`getContactsForExpertise(query, graph)`):
- **Exact Tag Name Match**: $+60\text{ pts} \times \text{proficiencyMultiplier}$ (`EXPERTISE_EXACT`).
- **Partial Keyword Match**: $+35\text{ pts} \times \text{proficiencyMultiplier}$ (`EXPERTISE_PARTIAL`).
- **Headline / Responsibilities Highlight**: $+15\text{ pts}$ (`CURRENT_ROLE`).

#### 4. General Search (`searchNetwork(query, graph)`):
- **Name Match**: $+80\text{ pts}$ (exact) or $+50\text{ pts}$ (partial) (`RELATIONSHIP_PATH`).
- **Current Organisation / Role Title**: $+40\text{ pts}$ (`CURRENT_ROLE`).
- **Past Organisation**: $+20\text{ pts}$ (`PAST_ROLE`).
- **Company Ticker Automatic Dispatch**: When the search query matches a verified ticker, company relevance is incorporated automatically.

#### Expertise Proficiency Multipliers (`PROFICIENCY_MULTIPLIERS`):
- `DEEP_OPERATIONAL_EXPERT`: $1.0\times$ (100% of base points)
- `EXECUTIVE_OVERSIGHT`: $0.85\times$ (85% of base points)
- `PRACTITIONER`: $0.70\times$ (70% of base points)

All relevance scores are bounded between $0$ and $100$.

### 7.3 Relationship Accessibility Score ($\text{Score} \in [0, 100]$)

Measures introduction accessibility and social friction from `INVESTOR_ROOT`:

$$\text{accessibilityScore} = \max\left(0, \min\left(100, \text{pathStrength} \times 20 - (\text{hopCount} - 1) \times 15\right)\right)$$

- **Direct Contacts ($\text{hopCount} = 1$)**:
  - Connection Strength 5: $5 \times 20 - 0 = 100$
  - Connection Strength 4: $4 \times 20 - 0 = 80$
  - Connection Strength 3: $3 \times 20 - 0 = 60$
  - Connection Strength 2: $2 \times 20 - 0 = 40$
  - Connection Strength 1: $1 \times 20 - 0 = 20$
- **Second-Degree Contacts ($\text{hopCount} = 2$)**:
  - Governed by the weakest link on the path ($\text{pathStrength} = \min(\text{Str}_1, \text{Str}_2)$) minus a $15$-point hop penalty:
  - Strengths (5, 5) $\implies \text{pathStrength} = 5$: $5 \times 20 - 15 = 85$
  - Strengths (5, 4) $\implies \text{pathStrength} = 4$: $4 \times 20 - 15 = 65$
  - Strengths (4, 4) $\implies \text{pathStrength} = 4$: $4 \times 20 - 15 = 65$
  - Strengths (3, 4) $\implies \text{pathStrength} = 3$: $3 \times 20 - 15 = 45$
  - Strengths (2, 4) $\implies \text{pathStrength} = 2$: $2 \times 20 - 15 = 25$

### 7.4 Explainability Output Structure & Recommendation Models

FINN never presents an unexplained score or black-box recommendation. Recommendations return typed justification structures:

```typescript
export interface RecommendationReason {
  readonly category: RecommendationReasonCategory;
  readonly description: string;
  readonly scoreContribution: number;
  readonly supportingEvidence: string;
}

export interface ContactRecommendation {
  readonly person: Person;
  readonly path: IntroductionPath;
  readonly allPaths: readonly IntroductionPath[];
  readonly degree: 1 | 2;
  readonly accessibilityScore: number;
  readonly relevanceScore: number;
  readonly overallScore: number;
  readonly reasons: readonly RecommendationReason[];
  readonly provenanceDisclaimer: string;
}
```

#### Deterministic Ranking Order:
1. `overallScore` descending
2. `relevanceScore` descending
3. `accessibilityScore` descending
4. `degree` ascending (degree 1 direct contacts prioritized on ties)
5. `person.name` ascending (lexicographical alphabetical tie-break)

### 7.5 Exported Service API Functions (`src/services/networkService.ts`)

- `buildNetworkGraph(dataset: NetworkDataset): NetworkGraph`
- `findIntroductionPaths(targetPersonId: string, graph: NetworkGraph): IntroductionPath[]`
- `getContactsForCompany(ticker: string, graph: NetworkGraph): ContactRecommendation[]`
- `getContactsForSector(sector: string, graph: NetworkGraph): ContactRecommendation[]`
- `getContactsForExpertise(query: string, graph: NetworkGraph): ContactRecommendation[]`
- `searchNetwork(query: string, graph: NetworkGraph): ContactRecommendation[]`
- `queryNetwork(query: NetworkQuery, graph: NetworkGraph): ContactRecommendation[]`

---

## 8. Provenance and Synthetic-Data Policy

FINN upholds an uncompromising standard of data integrity:

### 8.1 Prototype Synthetic Data Rules
1. **Mandatory `SYNTHETIC` Tagging**:
   - In Phase 1, every mock person, education entry, and relationship edge will explicitly carry `provenance: 'SYNTHETIC'` and `isSynthetic: true`.
2. **Clear UI Disclaimers**:
   - The Network interface will prominently display:
     > `[SYNTHETIC NETWORK DATA]`  
     > *All personal profiles, employment histories, and relationship edges in this demonstration environment are synthetic personas generated for architecture evaluation. No real personal contact data has been ingested.*
3. **No Fabricated Data on Real Living Persons**:
   - The synthetic dataset will **never** assign fabricated personal opinions, simulated private phone numbers, fake personal scandals, or fictional quotes to real living executives.
   - Mock personas will use plausible, representative names and backgrounds (e.g. "Arun Sharma - Energy Operations Consultant") clearly identified as synthetic.
4. **Clean Decoupling from Real Corporate Data**:
   - Real corporate data (`src/data/realEodData.json`, `LOCAL_VERIFIED_SYMBOL_REGISTRY`, and SEC/SEBI statutory filings) remains 100% authentic.
   - The network dataset simply *references* canonical company tickers (`'RELIANCE'`, `'TCS'`), without polluting corporate filing records.

---

## 9. Privacy & Governance Considerations (Production Roadmap)

While the prototype uses synthetic mock data client-side, a production-grade deployment would handle sensitive investor contacts. The following controls are designed for future enterprise hardening:

1. **Client-Side Encryption of User Notes**:
   - Any private notes added by the investor regarding relationship history or meeting takeaways should be encrypted client-side using Web Cryptography API (`AES-256-GCM`) before being stored or synchronized.
2. **Tenant Isolation**:
   - An investor's network is strictly private. Investor A cannot see Investor B's contact book or relationship strengths.
3. **Consent-Driven Warm Introduction Protocol**:
   - In collaborative investment partnerships (e.g. multi-partner funds), second-degree introductions require an explicit double opt-in workflow:
     1. Partner A requests an intro to Contact C via Partner B.
     2. Partner B receives a notification asking for consent.
     3. Only upon Partner B's confirmation are Contact C's details revealed.
4. **Statutory Compliance**:
   - Architecture complies with the **Digital Personal Data Protection Act, 2023 (India)** and **GDPR**:
     - Right to access, correct, and erase personal profile records.
     - Zero sharing of personal contact data with third-party LLM providers.

---

## 10. Integration Points with Push and Pull Subsystems

The Network Intelligence Layer is designed as a cross-cutting intelligence utility, not an isolated screen:

### 10.1 Integration with Pull: Research Copilot (`src/components/ResearchCopilot.tsx`)
When an investor reviews a company dossier (e.g. `RELIANCE`):
- A new section **"Network Intelligence & Primary Access"** will appear adjacent to the Financial Snapshot and Theses.
- It automatically invokes `findRelevantContactsForCompany('RELIANCE')`.
- Displays top-ranked contacts categorized by:
  - *Direct Company Veterans*: Former executives who operated inside the firm.
  - *Competitor Operatives*: Professionals from direct sector peers (e.g. BPCL, IOCL, Nayara).
  - *Warm Introduction Paths*: 2nd-degree contacts with a single intermediary.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Research Copilot: RELIANCE (Reliance Industries Limited)       [ CURATED FILING DATA ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Financial Snapshot ]   [ Bull / Bear Case ]   [ Primary Sources ]                    │
│                                                                                        │
│ ▼ Network Intelligence: Who can help you evaluate RELIANCE?                            │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│   │ [1st Degree • Strength 4/5] Arun Sharma — Former VP, Refining Operations (RIL)   │ │
│   │ Expertise: O2C Crack Spreads, Turnaround Operations | Contact: Direct Message    │ │
│   └──────────────────────────────────────────────────────────────────────────────────┘ │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│   │ [2nd Degree • via Vikram Sen] Rajesh Patel — Petrochemical Marketing Specialist  │ │
│   │ Pathway: You ──(Str 5)──> Vikram Sen ──(Str 4)──> Rajesh Patel                   │ │
│   │ Action: [ Request Introduction via Vikram ]                                      │ │
│   └──────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Integration with Push: Corporate Announcements (`src/components/AnnouncementFeed.tsx`)
When a material announcement arrives (e.g. Swiggy RHP filing or major contract win):
- The announcement card evaluates the issuing ticker against the network graph.
- If relevant contacts exist, an actionable pill is displayed:  
  `[ 2 Network Contacts relevant to this filing ]`.
- Clicking opens a drawer revealing the contacts who have domain expertise in that exact transaction type (e.g. IPO underwriting or SEBI compliance).

### 10.3 Standalone Network Explorer View (`src/components/NetworkView.tsx`)
- Accessible via the top navigation bar (`Dashboard`, `Research`, `Announcements`, `Network`).
- Allows comprehensive search by person name, company, sector, expertise tag, or degree of connection.
- Features graph path visualization and relationship strength filters.

---

## 11. Proposed File Structure & Responsibilities

The implementation in subsequent steps will adhere strictly to established FINN architectural conventions:

```
src/
├── types/
│   └── network.ts            # Domain interfaces (Person, Edge, Expertise, Recommendation)
├── data/
│   └── networkData.ts        # Synthetic dataset (16 personas, 26 explicit edges: 16 direct, 10 person-to-person)
├── services/
│   └── networkService.ts     # Graph indexing, BFS pathfinding, recommendation scoring
└── components/
    ├── NetworkView.tsx       # Standalone Network Explorer page
    ├── CompanyNetworkCard.tsx# Embedded component for Research Copilot
    └── icons.tsx             # (Add Users, Network, UserCheck, Link2 icons as needed)
```

### Modular Responsibilities:
- `src/types/network.ts`: Zero dependencies; pure TypeScript type declarations.
- `src/data/networkData.ts`: Imports `Person`, `NetworkEdge`, and references `LOCAL_VERIFIED_SYMBOL_REGISTRY`. Pure static constant data.
- `src/services/networkService.ts`: Imports types and data; provides pure functions:
  - `buildNetworkGraph(people, edges): NetworkGraph`
  - `findShortestPaths(sourceId, targetId, graph): IntroductionPath[]`
  - `getContactsForCompany(ticker, graph): ContactRecommendation[]`
  - `getContactsForSector(sector, graph): ContactRecommendation[]`
  - `searchNetwork(query, graph): Person[]`
- `src/components/NetworkView.tsx`: Full-screen browser with search bar, filter chips (Degree 1, Degree 2, Sector), and contact cards.
- `src/components/CompanyNetworkCard.tsx`: Compact embedded widget inside `ResearchCopilot.tsx`.

---

## 12. Implementation Sequence & Status

To ensure disciplined execution without regressions, the implementation follows a strict seven-stage roadmap:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Architecture: Architectural Design & Domain Model Specification (COMPLETE)│
│ Deliverable: docs/NETWORK_ARCHITECTURE.md (Design Specification)           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 2. Dataset: Domain Types, Synthetic Dataset & Hardened Validator (COMPLETE) │
│ • Implemented src/types/network.ts with discriminated unions & directionality│
│ • Created 16-persona synthetic dataset in src/data/networkData.ts           │
│ • Step 2.1 Hardened validation: date regex, chronology & consistency checks │
│ • Automated unit test suite in scripts/test_network_dataset.mjs (98 passing)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 3. Graph Service & Scoring: Traversal & Intelligence Service (COMPLETE)     │
│ • Implemented src/services/networkService.ts                                │
│ • BFS pathfinding (2-hop cap) & explainable relevance ranking algorithms    │
│ • Step 3.1 & 3.2 Hardening: Deep freeze, sector precision & boundary bounds │
│ • Automated unit test suite in scripts/test_network_service.mjs (262 passing│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 4. Network Interface: Standalone Network UI & Navigation (NEXT)             │
│ • Build standalone NetworkView component with search & degree filters       │
│ • Integrate navigation in App.tsx and Header.tsx                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 5. Direct Network Queries: Dedicated Target & Filter Query Workflows        │
│ • Direct company, sector, and expertise contact retrieval endpoints         │
│ • Interactive introduction path expansion & intermediary display            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 6. Contextual Integration: Push/Pull Intelligence Linking (PLANNED)         │
│ • Embed company contact recommendations in ResearchCopilot.tsx (Pull)       │
│ • Enrich corporate announcements in AnnouncementFeed.tsx (Push)             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 7. End-to-End Verification & Submission Hardening (PLANNED)                 │
│ • Cross-browser verification, responsive layout audit & WCAG compliance     │
│ • Full regression verification across all test suites                       │
│ • Final documentation review and submission package                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.1 Phase 1 Steps 2 & 2.1 Completed Dataset Specification & Hardened Validation
- **Dataset Scale**: Exactly 16 detailed personas (`NETWORK_PERSONAS`), 32 employment records, 21 education records, 48 expertise tags, 16 direct investor edges (`INVESTOR_ROOT` $\rightarrow$ Person), and 10 person-to-person edges (total 26 edges).
- **Provenance Standard**: 100% of persona and relationship records explicitly carry `provenance: 'SYNTHETIC'` and `isSynthetic: true`.
- **Equity Registry Grounding**: 24 listed employment records reference verified canonical tickers from `LOCAL_VERIFIED_SYMBOL_REGISTRY` (covering `RELIANCE`, `TCS`, `INFY`, `SWIGGY`, `ZOMATO`, `BAJFINANCE`, `HDFCBANK`, `ICICIBANK`, `SBIN`, `BHARTIARTL`, `IDEA`, `SUNPHARMA`, `DRREDDY`, `LT`, `WIPRO`, `MARUTI`, `TATAMOTORS`, `TRENT`, `HINDUNILVR`, `PAYTM`). Zero unindexed phantom tickers.
- **Relationship Directionality Semantics**:
  - Direct investor edges (16): Explicitly typed with `directionality: 'DIRECTED'` and `isDirected: true`.
  - Person-to-person edges (10): Explicitly typed with `directionality: 'UNDIRECTED'` and `isDirected: false`. Enables symmetric 2nd-degree referral traversal across mutual peer ties.
- **Reachability Guarantees**:
  - Direct (1st-degree): 16 of 16 personas ($100\%$) directly reachable from `INVESTOR_ROOT`.
  - 2nd-degree paths: 13 distinct personas are reachable via 2 hops through intermediate peers (`person-vikram-sen`, `person-priya-nair`, `person-karan-mehta`, `person-amit-tandon`, `person-kavita-iyer`, `person-deepa-menon`, `person-rohit-gupta`, `person-tanvi-joshi`), exceeding the $\ge 8$ requirement.
- **Hardened Validation Architecture (`validateNetworkDataset`)**:
  1. **Strict Date Format**: Start and end dates validated via regex (`YYYY` or `YYYY-MM`), rejecting non-strings, text dates, and out-of-bounds months (e.g. `2020-13`, `2020-00`).
  2. **Chronological Ordering**: Numeric integer comparison (`YYYYMM`) enforcing `startDate <= endDate` for previous roles and intra-record checks.
  3. **Career Chronology**: Verifies current role `startDate >= previousRole.startDate`.
  4. **Strict `isCurrent` / `endDate` Correspondence**: Enforces bidirectional contract: `isCurrent === true` strictly corresponds to `endDate === null`; `isCurrent === false` strictly corresponds to `endDate !== null`.
  5. **Current Employment Consistency**:
     - At most 1 current employment record per persona.
     - When 1 current record exists, `currentOrganisation` (type, name, and ticker/orgId) and `currentRoleTitle` must match the current employment record.
     - When 0 current records exist, `currentOrganisation` and `currentRoleTitle` must remain undefined.
  6. **Education Year Bounds**: Validates integer years within 1900–2100 and enforces `startYear <= endYear`.
  7. **Directionality Invariants**: Enforces `INVESTOR_ROOT` edges are `DIRECTED` (`isDirected: true`) and P2P edges are `UNDIRECTED` (`isDirected: false`).
  8. **Cross-Category ID Uniqueness**: Enforces global uniqueness across personas, employment records, education records, expertise tags, and edges.
  9. **Registry & Structural Invariants**: Preserves 16 personas, 16 direct edges, $\ge 8$ P2P edges, valid endpoints, no self-edges, connection strengths 1–5, and canonical ticker validation.
- **Automated Test Suite**: `scripts/test_network_dataset.mjs` executes 98 unit tests via `jiti`, verifying production dataset validity (0 failures) and rejecting 17 corrupted edge-case variations.
- **Validation Execution**: `validateNetworkDataset(NETWORK_DATASET)` returns `isValid: true` with 0 failures.

### 12.2 Phase 1 Step 3 Completed Graph Intelligence Service & Traversal Specification
- **Service Implementation**: `src/services/networkService.ts` implements pure deterministic graph construction, directed/undirected traversal capped at 2 hops, explainable relevance scoring, and contact ranking.
- **Pathfinding (`findIntroductionPaths`)**:
  - Evaluates 1-hop direct investor paths and 2-hop introductions via intermediaries.
  - Strictly caps traversal depth at 2 edges.
  - Eliminates cyclic or repeated nodes.
  - Calculates normalized accessibility score ($0-100$):
    $$\text{accessibilityScore} = \max\left(0, \min\left(100, \text{pathStrength} \times 20 - (\text{hopCount} - 1) \times 15\right)\right)$$
  - Deterministic sorting: hopCount asc, accessibilityScore desc, intermediary ID asc, edge IDs asc.

### 12.3 Phase 1 Steps 3.1 & 3.2 Refinements: Deep Freeze, Sector Ambiguity & Scoring Boundary Hardening
- **Deep Runtime Immutability (`deepFreeze` & `ReadOnlyMap<K, V>`)**:
  - Encapsulates Map collections within `ReadOnlyMap`, which implements `ReadonlyMap<K, V>` and explicitly throws runtime `Error` exceptions on `set()`, `delete()`, and `clear()`.
  - `deepFreeze` traverses all own property keys including symbols (`Reflect.ownKeys`).
  - Does not halt recursion merely because the parent is already shallow-frozen; deep children and nested arrays are systematically frozen.
  - Cycles are tracked via `WeakSet` to prevent infinite recursion on cyclic object graphs.
  - Explicit collection policy: `ReadOnlyMap` instances are supported by deeply freezing their values; standard mutable `Map` and `Set` instances are rejected with a `TypeError` to prevent unfreezable collection state from remaining reachable.
- **Sector Matching Precision & Ambiguity (`isSectorMatch`)**:
  - Evaluates canonical cluster identity via `CANONICAL_SECTOR_MAP`.
  - Multi-sector and ambiguous labels (`energy, retail & telecommunications`, `conglomerate / energy`, `consumer goods & internet services`) are strictly removed and rejected.
  - Generic or ambiguous tokens (`Services`, `Technology`, `Consulting`) return `false`.
  - Unambiguous energy aliases (`Energy`, `Energy & Petrochemicals`, `Oil & Gas Refining & Marketing`, `Energy & Industrials Advisory`) match reliably, while ambiguous conglomerates return `false`.
- **Score Breakdown, Validation & Boundary Hardening (`calculateScoreBreakdown`)**:
  - Implements `sanitizeScore` to cleanly handle `NaN`, non-numbers, negative values, and values exceeding 100:
    - `NaN` and non-numbers are sanitized to `0`.
    - Negative numbers and `-Infinity` are clamped to `0`.
    - Values $> 100$ and `+Infinity` are clamped to `100`.
  - If sanitized relevance score is `0`: `overallScore` is strictly `0`, with `weightedRelevanceContribution = 0`, `weightedAccessibilityContribution = 0`, and `roundingAdjustment = 0`.
  - Mathematical reconciliation identity:
    $$\text{weightedRelevanceContribution} + \text{weightedAccessibilityContribution} + \text{roundingAdjustment} \equiv \text{overallScore}$$
    holds unconditionally. Exhaustively verified across all 10,201 integer pairs $(r, a) \in [0, 100]^2$ with 0 violations.
  - Recommendation outputs (`ContactRecommendation`) maintain exact consistency with the underlying calculation.
- **Separated Free-Text Discovery Search (`searchNetwork`)**:
  - Returns `NetworkSearchResult` with explicit `searchMatchScore`, `accessibilityScore`, and bounded composite `searchRankingScore` ($0.7 \times \text{match} + 0.3 \times \text{accessibility}$).
  - Fields searched: `NAME`, `CURRENT_ORGANISATION`, `CURRENT_ROLE`, `PAST_ORGANISATION`, `PAST_ROLE`, `EXPERTISE`, `HEADLINE_OR_SUMMARY`.
  - Deduplicates field match contributions and gracefully handles empty/whitespace queries.
- **Automated Test Suite**: `scripts/test_network_service.mjs` executes 272 comprehensive tests, passing with 0 failures.

### 12.4 Phase 1 Step 4 Completed Network Intelligence Interface Specification
- **Standalone Navigation Integration (`src/App.tsx`, `src/components/Header.tsx`, `src/components/icons.tsx`)**:
  - Main navigation updated to support `activePage === 'network'`, accessible via desktop header navigation bar (with `Users` icon and `TIES` badge) and mobile bottom navigation bar (`grid-cols-6`).
  - Supports deep-linking and browser reload state via URL query parameter `?page=network`.
- **Top-Level Network View (`src/components/NetworkView.tsx`)**:
  - Multi-mode interface supporting five distinct query workflows:
    1. `DISCOVERY`: Free-text search powered by `searchNetwork`, querying names, roles, organizations, and expertise.
    2. `COMPANY`: Targeted company queries against verified tickers (`RELIANCE`, `TCS`, etc.) invoking `getContactsForCompany`.
    3. `SECTOR`: Industry sector filtering across canonical clusters invoking `getContactsForSector`.
    4. `EXPERTISE`: Functional skill & operational expertise queries invoking `getContactsForExpertise`.
    5. `ALL_DIRECTORY`: Unfiltered contact directory listing all 16 synthetic personas.
  - Interactive secondary filter bar supporting relationship degree filtering (`All`, `1st Degree`, `2nd Degree`) and domain expertise category filtering.
  - Educational callout explaining the fundamental distinction between professional domain relevance and relationship accessibility.
  - Pre-populated quick-query suggestion pills (`RELIANCE`, `TCS`, `Refining Margins`, `Vikram Sen`, `Priya Nair`) and responsive empty states.
- **Network Overview & Synthetic Provenance (`src/components/network/NetworkOverviewCards.tsx`)**:
  - Prominent synthetic data disclaimer banner highlighting 100% client-side synthetic provenance with no external PII ingestion.
  - Key metric cards generated by `computeNetworkOverviewMetrics(graph)`:
    - Total Synthetic Contacts ($16$)
    - First-Degree Direct Ties ($16$)
    - Second-Degree Reachable Contacts ($13$)
    - Mapped Network Edges ($26$, including 10 peer-to-peer ties)
  - Interactive expertise distribution chips spanning the 5 core expertise categories (`SECTOR_INDUSTRY`, `FUNCTIONAL_OPERATIONS`, `GOVERNANCE_REGULATORY`, `TECHNOLOGY_PLATFORMS`, `CAPITAL_ALLOCATION`).
- **Contact Recommendation Card (`src/components/network/NetworkContactCard.tsx`)**:
  - Displays persona avatar, name, current role and organisation, listed ticker badge, and relationship degree badge.
  - Clearly distinguishes between **Recommendation Score** ($0.65 \times \text{Relevance} + 0.35 \times \text{Accessibility}$) and **Search Rank** ($0.70 \times \text{Match} + 0.30 \times \text{Accessibility}$).
  - Expandable **"Show Score Math"** drawer detailing the exact mathematical formula, components, and rounding adjustment.
  - Relevance rationale / search match explanation pills and compact relationship path visualizer.
- **Detailed Contact Profile Drawer (`src/components/network/NetworkContactProfileModal.tsx`)**:
  - Accessible modal slide-over drawer triggered upon selecting any contact card.
  - Displays complete persona background, verified employment history timeline (with current vs. past tags), verified expertise chips with proficiency levels (`Deep Operational Expert`, `Executive Oversight`, `Practitioner`), education credentials, and all available introduction paths from `INVESTOR_ROOT`.
  - Accessible keyboard navigation (`Escape` key closes modal).
- **Relationship Path Visualizer (`src/components/network/NetworkPathVisualizer.tsx`)**:
  - Renders 1-hop direct connections and 2-hop intermediary referral paths (`Investor -> Intermediary -> Target Contact`).
  - Displays relationship nature, tie strengths ($1-5$ stars), and normalized accessibility score ($0-100$).
- **Test Suite Verification**:
  - `npm test`: 399 unit tests passing across all suites (`test_network_service.mjs`, `test_network_dataset.mjs`, `test_services.mjs`).
  - `npm run build`: Production build verified with zero errors.


---

## 13. Explicit Assumptions and Unresolved Design Decisions

### 13.1 Explicit Assumptions
1. **Single-User Paradigm in Prototype**: For the initial prototype, `INVESTOR_ROOT` represents the single active user; multi-tenant user authentication is deferred to future enterprise releases.
2. **Static In-Memory Representation**: The graph dataset fits comfortably in client memory ($<1\text{ MB}$); no server-side graph database (e.g. Neo4j) is needed or recommended for this phase.
3. **No Direct Web Scraping**: All synthetic contact profiles and company connections are maintained in structured local TypeScript files, adhering to the client-side offline architectural guarantee.

### 13.2 Unresolved Decisions for Stakeholder Review
1. **Maximum Traversal Depth**:
   - *Current Decision*: Cap pathfinding at **2 degrees** (Investor $\rightarrow$ Intermediary $\rightarrow$ Target).
   - *Rationale*: 3rd-degree introductions in private investment settings have near-zero conversion and introduce significant noise.
   - *Question for Stakeholders*: Should 3rd-degree reachability be displayed as an aggregate count (e.g. "+42 3rd-degree contacts") without revealing full profiles?
2. **Standalone Page vs. Purely Contextual Overlay**:
   - *Current Decision*: Provide both a standalone `Network` navigation tab and contextual panels inside `ResearchCopilot` and `AnnouncementFeed`.
   - *Question for Stakeholders*: Does the standalone tab add substantial user value, or should Network intelligence be exclusively surfaced in context during company research and announcement reviews?
3. **Contact Interaction Logging**:
   - *Current Decision*: Store `lastInteractionDate` statically in the dataset.
   - *Question for Stakeholders*: Should a future step introduce browser `localStorage` persistence to allow investors to log new interactions or adjust connection strengths locally?

---

## 14. Document Consistency & Integrity Checklist

- [x] All file paths cited correspond to verified files in the current repository.
- [x] Reuses canonical tickers from `LOCAL_VERIFIED_SYMBOL_REGISTRY` without duplicate registries.
- [x] Strict non-inference rule: personal edges require explicit evidence, avoiding false co-tenure inferences.
- [x] Decouples relationship accessibility (strength & hops) from professional domain relevance.
- [x] Enforces strict `SYNTHETIC` provenance tags for prototype safety.
- [x] Requires zero external graph database dependencies; perfectly compatible with Vite + React SPA.
- [x] Implementation scoped strictly to domain types, dataset, validator, and pure graph service: zero UI alterations or modifications to existing portfolio, research, or announcement runtime behavior.
