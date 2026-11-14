# FINN Network Intelligence Layer — Architectural Design & Domain Model

**Document Version:** 1.0.0-DRAFT  
**Author:** Founding AI Engineer / FINN Architecture Team  
**Date:** November 2026  
**Status:** Approved for Review (Phase 1, Step 1 Design Specification)  
**Target Repository:** `https://github.com/Tocoung/enam`  
**Current Commit:** `24fd8d7`

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

/**
 * Explicit connection between two nodes.
 * Connection strength:
 * 1 = Distant acquaintance (infrequent contact, limited rapport)
 * 2 = Established contact (occasional interactions, reliable response)
 * 3 = Strong professional tie (frequent communication, solid mutual trust)
 * 4 = High-trust collaborator (close working history, deep relationship)
 * 5 = Inner-circle confidant (exceptional trust, immediate access, strategic alignment)
 */
export interface NetworkEdge {
  id: string;
  sourceNodeId: string;        // 'INVESTOR_ROOT' for direct investor relationships, or a Person.id
  targetNodeId: string;        // Person.id
  relationshipType: RelationshipType;
  connectionStrength: 1 | 2 | 3 | 4 | 5;
  lastInteractionDate?: string;// 'YYYY-MM-DD'
  contextAndEvidence: string;  // Explicit explanation justifying the edge
  sharedContextOrg?: OrganisationRef; // Shared employer or board where the relationship was built
  provenance: NetworkDataProvenance;
}
```

---

## 5. Relationship Graph Representation

### 5.1 Root Node Convention
The investor is represented as the single root node:
- **`INVESTOR_ROOT`**: Represents the authenticated investor user ("You").
- Direct investor connections are edges where `sourceNodeId === 'INVESTOR_ROOT'`.
- All other connections are edges between two `Person.id` nodes.

```
       [ INVESTOR_ROOT ] ("You")
         │           │
Strength │ 5         │ 4 (Direct 1st-Degree)
         ▼           ▼
   [ Person A ]   [ Person B ]
   (Ex-RIL VP)    (Partner, Top Tier VC)
         │
Strength │ 4 (2nd-Degree Reachability)
         ▼
   [ Person C ]
   (Current CFO, Listed Competitor)
```

### 5.2 Explicit Edge Invariant (Anti-Hallucination Guard)
> [!IMPORTANT]
> **Strict Non-Inference Rule**: A relationship edge MUST NOT be inferred automatically simply because two individuals share the same university or overlapping employer dates.  
> Co-tenure at a massive enterprise (such as TCS with 600,000+ employees or Reliance with 300,000+ employees) does not constitute a personal relationship. Edges exist **only** when explicitly recorded in `networkData.ts` with dedicated narrative evidence.

### 5.3 Client-Side Graph Traversal Architecture
The graph is maintained in memory using an **Adjacency List Index**:
```typescript
export interface NetworkGraph {
  nodes: Map<string, Person>;
  // Key: Node ID, Value: Array of outbound edges
  adjacency: Map<string, NetworkEdge[]>;
  // Reverse index: Key: Target Node ID, Value: Array of inbound edges
  reverseAdjacency: Map<string, NetworkEdge[]>;
}
```

#### Traversal Capabilities:
1. **Direct Contacts (Degree 1)**: All edges where `sourceNodeId === 'INVESTOR_ROOT'`.
2. **Second-Degree Contacts (Degree 2)**: Reached via a two-hop path:
   $$\text{INVESTOR\_ROOT} \xrightarrow{\text{Edge}_1} \text{Person}_A \xrightarrow{\text{Edge}_2} \text{Person}_B$$
3. **Shortest & Strongest Path Finding**:
   - Implemented via Breadth-First Search (BFS) for minimal hops and Dijkstra's algorithm for path scoring.
   - For any target contact, FINN computes the **introduction path**:
     ```typescript
     export interface IntroductionPath {
       degree: 1 | 2;
       intermediary?: Person;
       investorToIntermediaryStrength?: number;
       intermediaryToTargetStrength?: number;
       compositeTrustScore: number;
       pathExplanation: string;
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

$$\text{Final Rank Score} = \text{Domain Relevance Score} \times \text{Relationship Accessibility Factor}$$

```
                ▲ Domain Relevance Score (0 - 100)
                │
                │     [ High Relevance, Low Access ]      [ High Relevance, High Access ]
                │     Ex-CEO (2nd-degree, weak edge)      Former VP (1st-degree, Strength 5)
                │     • "Needs warm intro"                • "Call directly today"
                │
                │     [ Low Relevance, Low Access ]       [ Low Relevance, High Access ]
                │     Distant peer in unrelated field     Close friend in healthcare
                │     • "Not recommended"                 • "Valued friend, wrong sector"
                └────────────────────────────────────────────────────────────────────────►
                                                      Relationship Accessibility Factor (0.0 - 1.0)
```

### 7.2 Domain Relevance Scoring Engine ($\text{Score} \in [0, 100]$)
For a query targeting company $C$ (e.g. `ticker === 'RELIANCE'`):

1. **Direct Employment Match ($\le 55\text{ pts}$)**:
   - **Current Employee**: $+55\text{ pts}$ if currently employed at target company.
   - **Former Employee (Recency Scaled)**:
     - Ended within past 2 years: $+45\text{ pts}$
     - Ended 2–5 years ago: $+35\text{ pts}$
     - Ended $>5$ years ago: $+20\text{ pts}$
   - **Seniority Bonus**:
     - C-Level Executive: $+10\text{ pts}$
     - Senior VP / Head of Business: $+7\text{ pts}$
     - Director / GM: $+5\text{ pts}$

2. **Competitor & Peer Affiliation ($\le 30\text{ pts}$)**:
   - If candidate worked at an acknowledged industry competitor (e.g. for `SWIGGY`, competitor is `ZOMATO`; for `TCS`, competitor is `INFY` or `WIPRO`):
     - Current competitor employee: $+30\text{ pts}$
     - Former competitor employee: $+20\text{ pts}$

3. **Domain Expertise & Keyword Match ($\le 25\text{ pts}$)**:
   - Exact match with company's core operating sector (e.g. 'Petrochemicals' or 'Cloud Modernization'): $+15\text{ pts}$
   - Supporting operational capability: $+10\text{ pts}$

### 7.3 Relationship Accessibility Factor ($\text{Factor} \in [0.1, 1.0]$)
Measures the friction of initiating a conversation:
- **1st-Degree (Direct Connection)**:
  $$\text{Accessibility} = 0.5 + \left(0.1 \times \text{Strength}\right)$$
  - Strength 5: $1.00$
  - Strength 4: $0.90$
  - Strength 3: $0.80$
  - Strength 2: $0.70$
  - Strength 1: $0.60$
- **2nd-Degree (Via Intermediary)**:
  $$\text{Accessibility} = 0.25 \times \left(\frac{\text{Strength}_{1}}{5}\right) \times \left(\frac{\text{Strength}_{2}}{5}\right)$$
  - Example: Investor $\xrightarrow{\text{Str 5}}$ Person A $\xrightarrow{\text{Str 4}}$ Target:
    $$\text{Accessibility} = 0.25 \times 1.0 \times 0.8 = 0.20 \quad (\text{adjusted to } 0.35\text{ base})$$

### 7.4 Explainability Output Structure
FINN never presents an unexplained score. Recommendations will return a structured justification object:
```typescript
export interface ContactRecommendation {
  person: Person;
  rankScore: number;
  relevanceBreakdown: {
    baseCompanyMatch: number;
    seniorityBonus: number;
    competitorMatch: number;
    expertiseMatch: number;
    matchedAffiliations: string[];
    matchedExpertise: string[];
  };
  accessibilityBreakdown: {
    degree: 1 | 2;
    introductionPath?: IntroductionPath;
    accessibilityMultiplier: number;
  };
  narrativeRationale: string;
}
```
*Example UI Rationale*:  
> *"Arun Sharma is a 1st-degree connection (Strength 4/5) who served as VP of Refining at Reliance Industries (2018–2023). He provides direct operational insight into Jamnagar crack spread dynamics."*

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
│   └── networkData.ts        # Synthetic dataset (12-15 personas, ~30 explicit edges)
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

## 12. Implementation Sequence for Subsequent Steps

To ensure disciplined execution without regressions, the implementation will follow a strict phased roadmap:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 1, Step 1: Architectural Design & Domain Model Specification (CURRENT)│
│ Deliverable: docs/NETWORK_ARCHITECTURE.md (Design Only)                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ Phase 1, Step 2: Domain Types & Synthetic Dataset Authoring                 │
│ • Author src/types/network.ts                                               │
│ • Create curated synthetic dataset in src/data/networkData.ts               │
│ • Strict reuse of LOCAL_VERIFIED_SYMBOL_REGISTRY tickers                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ Phase 1, Step 3: Graph Traversal & Scoring Service Implementation           │
│ • Implement src/services/networkService.ts                                  │
│ • BFS pathfinding & explainable relevance ranking algorithms                │
│ • Add automated unit test suite (scripts/test_network_service.mjs)          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ Phase 1, Step 4: UI Components & System Integration                         │
│ • Build standalone NetworkView component                                    │
│ • Integrate navigation in App.tsx and Header.tsx                            │
│ • Embed company contact recommendations in ResearchCopilot.tsx              │
│ • Enrich corporate announcements in AnnouncementFeed.tsx                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ Phase 1, Step 5: End-to-End Verification, Visual Audit & Hardening          │
│ • Cross-browser verification and responsive testing                         │
│ • Verification across all existing test suites                              │
│ • Final documentation review and submission package                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

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
- [x] Completely documentation-only: zero application code or runtime behavior altered in this step.
