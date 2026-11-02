# FINN — Institutional Investor Intelligence

A high-performance, evidence-grounded investor intelligence interface for Indian equity markets (NSE/BSE). Built for institutional asset managers, risk officers, and active market participants to monitor portfolio breadth, detect unusual volume outliers, inspect corporate announcement disclosures, and execute primary-sourced equity research within a unified client-side workspace.

---

## Table of Contents

1. [Executive Overview & Problem Statement](#executive-overview--problem-statement)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Core Capabilities](#core-capabilities)
   - [Portfolio Intelligence Dashboard & Dual-Mode Selection](#1-portfolio-intelligence-dashboard--dual-mode-selection)
   - [Priority Alert Engine & Volume Baseline Outlier Detection](#2-priority-alert-engine--volume-baseline-outlier-detection)
   - [Research Copilot & Primary Disclosure Grounding](#3-research-copilot--primary-disclosure-grounding)
   - [Corporate Announcement Intelligence Feed & SEBI Categorization](#4-corporate-announcement-intelligence-feed--sebi-categorization)
   - [Bidirectional Inter-Module Navigation](#5-bidirectional-inter-module-navigation)
4. [Data Provenance & System Architecture](#data-provenance--system-architecture)
5. [Installation & Local Development](#installation--local-development)
6. [Testing & Verification Suites](#testing--verification-suites)
7. [Refreshing the Bundled EOD Snapshot](#refreshing-the-bundled-eod-snapshot)
8. [Production Build & Deployment](#production-build--deployment)
9. [System Scope, Limitations & Integrity Boundaries](#system-scope-limitations--integrity-boundaries)
10. [Interface Walkthrough & Screenshots](#interface-walkthrough--screenshots)

---

## Executive Overview & Problem Statement

Active equity analysts and institutional portfolio managers navigating Indian equities face structural information fragmentation:

- **Volume Distortion**: Assessing whether current session volume represents institutional accumulation or distribution requires historical session baselines. Without isolating past completed trading sessions from in-progress intraday bars, volume turnover ratios become noisy and misleading.
- **Data Provenance Ambiguity**: Interfaces routinely mix simulated sandbox models, delayed market feeds, and historical end-of-day (EOD) observations without clear labels, creating compliance hazards for institutional users.
- **Disjointed Filing Ingestion**: Regulatory corporate announcements (SEBI LODR disclosures) are scattered across exchange web portals (BSE/NSE) without normalized materiality scoring or direct cross-linking to equity research dossiers.
- **Hallucinated Research Output**: LLM-driven research tools frequently invent numbers, hallucinate filing dates, or fail to distinguish audited statutory notes from analytical opinions.

**FINN** resolves these challenges by combining:
1. A **dual-mode portfolio adapter** (`DEMO` vs. `REAL_EOD`) providing strict visual and computational provenance separation.
2. A **20-session baseline engine** that isolates historical completed bars to detect statistical volume outliers.
3. An **offline-curated Research Copilot** strictly grounded in primary company disclosures and verified earnings-call transcripts.
4. A **corporate announcement intelligence feed** featuring SEBI LODR categorization and objective materiality grading.
5. A **pure client-side static architecture** requiring zero external database setup or runtime backend dependencies.

---

## Architecture & Technology Stack

FINN is engineered as an ultra-responsive, zero-backend Single Page Application (SPA):

- **Core Framework**: React 18.3 with TypeScript 5.6 (strict mode enabled).
- **Bundler & Dev Server**: Vite 6.0 with Hot Module Replacement (HMR).
- **Styling Architecture**: Tailwind CSS 3.4 with an editorial dark-navy financial color system (`#070b14` canvas, slate/indigo hierarchies, and semantic status indicators).
- **Iconography**: Custom zero-overhead SVG icons (`src/components/icons.tsx`), eliminating third-party component weight.
- **Data & Computation Layer**: Pure TypeScript functional services with zero runtime dependencies:
  - `portfolioService.ts`: Adapts raw demo data or bundled Yahoo Finance historical EOD snapshots with robust fallback safety.
  - `portfolioMetrics.ts`: Computes price changes, 20-session average volume baselines, volume turnover ratios, and derives alerts.
  - `researchService.ts`: Evaluates ticker inputs, performs local registry lookups, and serves pre-ingested research dossiers.
  - `announcementService.ts`: Filters, searches, sorts, and scores corporate announcements.

```
src/
├── types/                 # Formal domain interfaces
│   ├── portfolio.ts       # Raw stocks, metrics, alerts, and provenance modes
│   ├── research.ts        # Dossiers, financial snapshots, bull/bear theses, source taxonomy
│   └── announcements.ts   # SEBI categories, materiality levels, source types
├── data/                  # Bundled offline datasets
│   ├── portfolioData.ts   # 20 simulated equities & default thresholds
│   ├── realEodData.json   # Bundled 15-ticker historical EOD snapshot from Yahoo Finance
│   ├── researchData.ts    # Curated research dossiers & 27-symbol local registry
│   └── announcementData.ts# 20 corporate announcements (primary, archive & demo)
├── services/              # Pure computational & adapter logic
│   ├── portfolioService.ts# Dual-mode selection, snapshot validation & fallback routing
│   ├── portfolioMetrics.ts# 20-session volume baselines & dynamic alert derivation
│   ├── researchService.ts # Input sanitization & dossier resolution
│   └── announcementService.ts # Filtering, metrics & dataset validation
├── components/            # Editorial UI components
│   ├── Header.tsx         # Navigation, mode toggle, and dynamic provenance banner
│   ├── PortfolioSummary.tsx # Breadth metrics, sector count & coverage cards
│   ├── Watchlist.tsx      # Multi-column table with search, sector filter & sorting
│   ├── AlertFeed.tsx      # Priority alert cards with category filtering
│   ├── ThresholdSettingsModal.tsx # Interactive price & volume threshold sliders
│   ├── ResearchCopilot.tsx# Ticker inspection, filing metrics & primary source citations
│   ├── AnnouncementFeed.tsx # Regulatory filings feed with company filter indicator
│   └── icons.tsx          # Standalone lightweight SVG icons
├── App.tsx                # Top-level state coordinator & page routing
└── main.tsx               # Application bootstrap
```

---

## Core Capabilities

### 1. Portfolio Intelligence Dashboard & Dual-Mode Selection

The dashboard tracks **20 major Indian equities** across 7 core sectors (Energy, IT Services, Banking & Financials, Auto, Consumer, Materials, and Healthcare).

Users can toggle between two operational modes via the header toggle:

```
[ DEMO MODE ]  <─────── Switchable ───────>  [ REAL EOD MODE ]
Simulated observations                       Yahoo Finance settled daily bars
20 DEMO positions                            13 REAL_EOD + 7 DEMO_FALLBACK
```

- **`DEMO` Mode**:
  - Displays 20 deterministic simulated positions (`DEMO` provenance badge).
  - Displays an amber warning banner: `DEMO DATA — Simulated portfolio observations. Not live trading data.`
- **`REAL_EOD` Mode**:
  - Dynamically ingests the bundled historical snapshot (`src/data/realEodData.json`).
  - Displays a vibrant indigo/emerald provenance banner: `YAHOO FINANCE HISTORICAL EOD DATA — 13 of 20 positions use historical market observations as of 2026-11-02. Remaining positions use clearly labelled demo fallback data. Not live prices.`
  - **13 Verified Real EOD Equities**: `RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `ICICIBANK`, `ITC`, `SBIN`, `LT`, `MARUTI`, `BAJFINANCE`, `SUNPHARMA`, `DRREDDY`, `SWIGGY`.
  - **7 Demo Fallback Equities**:
    - `TATAMOTORS`: Provider data failure (symbol discontinued/demerged on exchange).
    - `HINDUNILVR`, `TITAN`, `NTPC`, `TATASTEEL`, `WIPRO`, `IDEA`: Symbols not included in the 15-ticker ingestion target list.
    - Each fallback stock is conspicuously tagged with an amber `DEMO FALLBACK` badge and an explanatory tooltip reason.

### 2. Priority Alert Engine & Volume Baseline Outlier Detection

Alerts are derived dynamically on the client by comparing current session metrics against strict historical parameters:

- **20-Session Volume Baseline**: The average daily volume is computed strictly from the **preceding 20 completed sessions**, explicitly excluding the latest session bar to avoid self-contamination.
- **Volume Ratio Calculation**:
  $$\text{Volume Ratio} = \frac{\text{Current Volume}}{\text{20-Session Average Volume}}$$
- **Configurable Thresholds**:
  - **Price Movement Threshold**: Configurable from $\pm 0.5\%$ to $\pm 10.0\%$ (default: $\pm 2.0\%$).
  - **Volume Surge Threshold**: Configurable from $1.1\times$ to $5.0\times$ (default: $1.5\times$).
- **Severity Classification**:
  - `HIGH`: Triggered when **both** price movement ($\ge \text{threshold}$) and volume surge ($\ge \text{threshold}$) occur concurrently.
  - `MEDIUM`: Triggered when an unusual volume surge occurs with stable price, or when a major price movement occurs with normal volume.
  - `INFO`: Subdued volume or range-bound tracking.
- **Interactive Rules Modal**: Allows live adjustment of threshold parameters, instantly re-evaluating alerts across the portfolio in memory without page refreshes.

### 3. Research Copilot & Primary Disclosure Grounding

Research Copilot provides an evidence-based equity inspection terminal for any NSE ticker input:

- **Rigorous Ticker Normalization**: Strips whitespace, normalizes casing to uppercase, validates alphanumeric NSE format (`^[A-Z0-9&._-]{1,20}$`), and rejects malformed inputs.
- **Three-Tier Identity Resolution**:
  1. `CURATED_FILING_DATA` (**6 Core Companies**): Fully audited offline dossiers for `RELIANCE`, `TCS`, `HDFCBANK`, `BHARTIARTL`, `ZOMATO`, and `SWIGGY`.
  2. `SYMBOL_FOUND_IN_LOCAL_REGISTRY` (**27 Companies**): Recognizes valid NSE symbols from FINN's local master list (e.g. `TRENT`, `BEL`, `PAYTM`, `ASIANPAINT`, `ITC`, `INFY`), clearly stating that filings have not yet been indexed rather than hallucinating details.
  3. `IDENTITY_NOT_VERIFIED` (**Arbitrary Valid Tickers**): For any valid unindexed symbol (e.g. `UNKNOWNCO`), displays an unverified identity banner with **zero fabricated numbers**, no fake bull/bear arguments, and provides direct lookup options for NSE India, BSE India, and Screener.in.
- **Audited Financial Metrics**: Each metric card displays key statutory figures (Revenue, EBITDA, PAT, Debt/Equity, Operating Margins) explicitly tagged with `FY24 Audited` and direct note references. Missing metrics display `METRIC NOT INGESTED`.
- **Strict Separation of Theses vs. Facts**:
  - **Investment Theses**: Labeled as `ANALYTICAL INTERPRETATION`.
  - **Supporting Evidence**: Grounded in official company filings and conference call transcripts.
- **Direct Earnings-Call Transcript Links (Phase F2)**:
  - **Reliance Industries (`RELIANCE`)**: Links directly to the official 26-page transcript filed with exchanges:  
    `https://www.ril.com/sites/default/files/2024-10/14102024-Q2-FY2024-25-Transcript.pdf` (`EARNINGS_CALL_TRANSCRIPT`). Evidence grounds transportation fuel crack declines, downstream petrochemical price reductions, softer polymer/polyester demand, and O2C EBITDA weakness.
  - **Tata Consultancy Services (`TCS`)**: Links directly to the official conference call transcript filed under SEBI LODR Regulation 46:  
    `https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2024-25/q2/Management%20Commentary/Transcript%20of%20the%20Q2%202024-25%20Earnings%20Conference%20Call%20held%20on%20Oct%2010%2C%202024.pdf` (`EARNINGS_CALL_TRANSCRIPT`). Evidence grounds cautious North America demand (-2.1% YoY revenue) alongside rapid commercial GenAI scaling (600+ engagements, 86 in production).

### 4. Corporate Announcement Intelligence Feed & SEBI Categorization

A structured regulatory newsfeed tracking corporate disclosures across five mandatory SEBI LODR categories:

1. `FINANCIAL_RESULTS`: Quarterly earnings, audited annual reports, and dividend declarations.
2. `ORDERS_CONTRACTS`: Commercial contract awards, export orders, and client deal signings.
3. `CORPORATE_ACTIONS_FUNDRAISING`: Bonus issues, rights issues, QIPs, and share buybacks.
4. `MANAGEMENT_GOVERNANCE`: Board reconstitutions, CEO/CFO appointments, and auditor changes.
5. `REGULATORY_LEGAL`: Show-cause notices, tax adjudications, and environmental consents.

#### Materiality & Provenance Taxonomy
- **Materiality Assessment**: Explicit editorial grading (`HIGH`, `MEDIUM`, `ROUTINE`) based on disclosed contract values, percentage of consolidated revenue, or structural corporate impact.
- **Four-Tier Provenance Taxonomy**:
  - `VERIFIED_PRIMARY_DOCUMENT` (**5 Records**): Resolves to the exact statutory PDF submission filed with BSE/NSE.
  - `OFFICIAL_ARCHIVE_LINK` (**1 Record**): Links to the official exchange announcements archive for the scrip.
  - `SECONDARY_SOURCE` (**0 Records**): Reserved for verified press reporting citing regulatory disclosures.
  - `DEMO_DATA` (**14 Records**): Clearly marked synthetic demonstrations providing exchange lookup links. Zero simulated filings claim fake filing numbers.

### 5. Bidirectional Inter-Module Navigation

A unified workflow connects all three primary views without losing filter context:

```
┌────────────────────────┐         View Filings →        ┌────────────────────────┐
│  Portfolio Dashboard   ├──────────────────────────────>│   Corporate Filings    │
│   (Selected Ticker)    │<──────────────────────────────┤  (Pre-filtered to co.) │
└───────────┬────────────┘        Clear filter           └───────────▲────────────┘
            │                                                        │
            │ Deep Research                                          │ View Statutory
            │ in Copilot →                                           │ Filings →
            ▼                                                        │
┌────────────────────────┐                                           │
│    Research Copilot    ├───────────────────────────────────────────┘
│   (Company Dossier)    │
└────────────────────────┘
```

- **Dashboard → Filings**: Clicking any equity row reveals a highlighted banner with `View Filings →`, opening the Announcement Feed pre-filtered to that company with an active filter badge (`Filtered by company: RELIANCE`).
- **Research → Filings**: Research dossiers feature a prominent `View Statutory Filings →` action that routes directly to announcements for that ticker.
- **Filings → Research**: Every announcement card includes a `Deep Research in Copilot →` action that launches the company's dossier.

---

## Data Provenance & System Architecture

FINN enforces transparency across every layer of the application:

| Layer | Source Provider | Active Record Count | Provenance Label | Audit Status |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard (DEMO Mode)** | Static simulation (`portfolioData.ts`) | 20 equities | `DEMO` | Simulated baseline values for testing. |
| **Dashboard (REAL_EOD Mode)** | Bundled Yahoo Finance snapshot (`realEodData.json`) | 13 equities | `REAL_EOD` | Settled EOD bars as of **2026-11-02**. Excludes in-progress sessions. |
| **Dashboard Fallbacks** | Offline fallback generator (`portfolioService.ts`) | 7 equities | `DEMO_FALLBACK` | Clearly explained fallback reasons; does not present missing data as real. |
| **Research (Curated)** | Audited FY24 Annual Reports & Q2 FY25 Call Transcripts | 6 companies | `CURATED_FILING_DATA` | Direct PDF links to company filings and conference call transcripts. |
| **Research (Local List)** | Finite local symbol list (`researchData.ts`) | 27 symbols | `FOUND IN FINN LOCAL SYMBOL REGISTRY` | Verified symbol presence in FINN master list; filings unindexed. |
| **Research (Unverified)** | Format validation only | Arbitrary inputs | `IDENTITY_NOT_VERIFIED` | Zero fabricated financials; official exchange lookup links only. |
| **Corporate Announcements** | Statutory filings & simulated illustrations | 20 records | `VERIFIED_PRIMARY_DOCUMENT` (5)<br>`OFFICIAL_ARCHIVE_LINK` (1)<br>`DEMO_DATA` (14) | Direct exchange filing links for verified items; clearly tagged DEMO entries. |

---

## Installation & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: 3.10 or higher *(optional, required only for running the EOD snapshot refresh script or Python test suite)*

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Tocoung/enam.git
   cd enam
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000`. Hot Module Replacement (HMR) is active.

4. **(Optional) Setup Python virtual environment for ingestion/tests**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r scripts/requirements.txt
   ```

---

## Testing & Verification Suites

FINN includes four distinct test and build verification suites to ensure mathematical precision, type safety, and provenance integrity:

```
┌─────────────────────────────────┐   tsc -b && vite build
│ 1. Static Type & Build Check    ├──────────────────────────> 0 type errors, production asset bundle
└─────────────────────────────────┘
┌─────────────────────────────────┐   node scripts/test_portfolio_adapter_ts.mjs
│ 2. TypeScript Adapter Unit Tests ├──────────────────────────> 29 passed (100% production code execution)
└─────────────────────────────────┘
┌─────────────────────────────────┐   python3 scripts/test_portfolio_adapter.py
│ 3. Python Adapter Mirror Tests  ├──────────────────────────> 12 passed (cross-language logic parity)
└─────────────────────────────────┘
┌─────────────────────────────────┐   python3 scripts/test_sync_eod_data.py
│ 4. EOD Pipeline Ingestion Tests ├──────────────────────────> 8 passed (atomic writes & session rules)
└─────────────────────────────────┘
```

### 1. Production Build & TypeScript Typecheck
Executes strict project compilation and Vite asset bundling:
```bash
npm run build
```
- **What it verifies**: TypeScript compilation across all types, components, and data modules (`tsc -b`), ensuring zero missing imports, type mismatches, or invalid JSX syntax.

### 2. Direct TypeScript Portfolio Adapter Unit Tests
Executes the **actual production TypeScript implementation** in `src/services/portfolioService.ts` and `src/services/portfolioMetrics.ts`:
```bash
npm test
# Or directly:
node scripts/test_portfolio_adapter_ts.mjs
```
- **What it verifies (29 assertions)**:
  - Guard safety of snapshot metadata (valid `asOfDate`, schema version, provider attribution).
  - Strict preservation of all 20 positions in `DEMO` mode with null dates and undefined fallback reasons.
  - Exact classification in `REAL_EOD` mode (13 `REAL_EOD`, 7 `DEMO_FALLBACK`, 0 `DEMO`).
  - Baseline slicing integrity (verifies that $\ge 20$ historical sessions exist, are chronologically sorted, and strictly exclude the latest completed bar).
  - Numeric validity of current price, prevClose, and currentVolume across all 20 equities.
  - Fallback diagnostic attribution (`TATAMOTORS` exchange demerger notice and unindexed ticker messages).
  - Provenance propagation through derived metrics and alerts.

### 3. Python Adapter Mirror Tests
Verifies mathematical and algorithmic parity against an independent Python reference implementation:
```bash
python3 scripts/test_portfolio_adapter.py
```
- **What it verifies (12 tests)**: Independent calculation of volume turnover ratios, alert trigger thresholds, advance/decline distribution, and fallback handling.

### 4. EOD Ingestion Pipeline Unit Tests
Verifies the Yahoo Finance EOD ingestion script logic:
```bash
python3 scripts/test_sync_eod_data.py
```
- **What it verifies (8 tests)**:
  - Mocked yfinance OHLCV responses and schema constraints.
  - Enforces the 20-session minimum completed bars requirement.
  - Atomic temporary file writing and atomic swap mechanics (zero corrupt JSON files).
  - In-progress intraday bar filtering prior to 16:00 IST market settlement.

---

## Refreshing the Bundled EOD Snapshot

FINN bundles a historical EOD snapshot in `src/data/realEodData.json`. To refresh this dataset with updated market data:

1. **Activate Python environment**:
   ```bash
   source .venv/bin/activate
   pip install -r scripts/requirements.txt
   ```

2. **Execute the ingestion script**:
   ```bash
   python3 scripts/sync_eod_data.py
   ```

3. **Script Arguments & Configuration**:
   ```bash
   python3 scripts/sync_eod_data.py \
     --output src/data/realEodData.json \
     --period 60d \
     --min-sessions 20
   ```

4. **Settlement Policy & Safety Rules**:
   - **NSE Settlement Cutoff**: The script evaluates Indian Standard Time (UTC + 5:30). If run before **16:00 IST** on a trading day, the current day's partial session is automatically discarded to protect the integrity of settled historical bars.
   - **Atomic Write Guarantee**: Data is initially written to an isolated temporary file, validated against JSON schema rules, and atomically replaced via `os.replace`.
   - **Minimum Session Enforcement**: Tickers with fewer than 20 completed sessions are rejected as `INCOMPLETE` and excluded from `REAL_EOD` presentation.

---

## Production Build & Deployment

### Build Output
To compile FINN for production:
```bash
npm run build
```
This produces an optimized static distribution in the `dist/` directory:
- `dist/index.html` (entry point HTML)
- `dist/assets/index-*.css` (purged Tailwind styles)
- `dist/assets/index-*.js` (minified production bundle)

To preview the production bundle locally:
```bash
npm run preview
```

### Static Hosting Deployment Instructions

Because FINN is a pure static Single Page Application with client-side query-string navigation, it can be deployed to any static CDN host.

#### 1. Vercel
Deploy using the Vercel CLI or Git integration:
```bash
npx vercel
```
*Note: Include a `vercel.json` if deep link rewrites are desired:*
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### 2. Netlify
Deploy using the Netlify CLI:
```bash
npx netlify deploy --dir=dist --prod
```
*Create a `dist/_redirects` file for SPA routing:*
```text
/*    /index.html   200
```

#### 3. Cloudflare Pages / GitHub Pages
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Node version**: `18.x` or higher

---

## System Scope, Limitations & Integrity Boundaries

To maintain institutional compliance and transparency, the following technical boundaries are explicitly documented:

1. **Client-Side Offline Architecture**: FINN does not run a persistent backend daemon or database. All data processing occurs in memory in the user's browser.
2. **Snapshot Staleness & Static EOD Feeds**:
   - The bundled real market data is an end-of-day snapshot retrieved on **2026-11-02**.
   - FINN does **not** provide live intraday tick data, real-time WebSocket feeds, or sub-minute order book depth.
3. **Finite Ingestion Target List**:
   - The EOD ingestion pipeline targets 15 large-cap NSE equities. Because the portfolio watchlist contains 20 positions, 6 equities (`HINDUNILVR`, `TITAN`, `NTPC`, `TATASTEEL`, `WIPRO`, `IDEA`) default to `DEMO_FALLBACK`.
   - `TATAMOTORS` is marked as `DEMO_FALLBACK` due to upstream provider data restructuring (corporate demerger).
4. **Finite Curated Research Corpus**:
   - Curated research dossiers exist for **6 companies** (`RELIANCE`, `TCS`, `HDFCBANK`, `BHARTIARTL`, `ZOMATO`, `SWIGGY`).
   - For all other tickers, FINN provides local symbol recognition or format validation only. FINN **never** fabricates financial figures or investment theses for unindexed companies.
5. **Static Primary Document Links**:
   - Links in the Research Copilot (`rel-src-4`, `tcs-src-4`) point to official PDF documents and exchange archives. FINN does not perform runtime web scraping or live PDF parsing on the client.
6. **No Automated Trade Execution**: FINN is an analytical intelligence interface and does not connect to broker APIs, OMS/EMS systems, or execute trades.

---

## Interface Walkthrough & Screenshots

> [!NOTE]
> Static screenshots captured during validation runs are stored in conversation artifacts. Placeholders below illustrate key interface screens.

### 1. Portfolio Intelligence Dashboard (Dual-Mode: REAL_EOD vs. DEMO)
Displays 20 portfolio equities, advance/decline breadth metrics, and volume outlier indicators with dynamic provenance banners.

```
+----------------------------------------------------------------------------------------------------+
| FINN | Institutional Investor Intelligence        [ DEMO MODE | * REAL EOD MODE * ]   [ Rules: ±2%/1.5x ] |
| YAHOO FINANCE HISTORICAL EOD DATA — 13 of 20 positions use historical market observations (2026-11-02)|
+----------------------------------------------------------------------------------------------------+
| [ Coverage: 13/20 Real ]   [ Advancers: 4 ]   [ Decliners: 13 ]   [ Unusual Volume Outliers: 1 ]   |
+----------------------------------------------------+-----------------------------------------------+
| Watchlist (20 Equities)                            | Priority Alerts (Dynamic SEBI LODR Engine)    |
| - RELIANCE  ₹1,049.00  +1.2%  1.82x [REAL EOD]     | [HIGH] RELIANCE: Volume surge (1.82x) + Price |
| - TCS       ₹1,049.00  -0.5%  0.94x [REAL EOD]     | [MED]  BAJFINANCE: Unusual volume spike 1.64x |
| - TATAMOTORS ₹380.00   -1.8%  1.20x [DEMO FALLBACK]| [MED]  SWIGGY: High volume participation 1.55x|
+----------------------------------------------------+-----------------------------------------------+
```
*(Placeholder: `docs/screenshots/dashboard_dual_mode.png`)*

### 2. Configurable Alert Threshold Modal
Interactive parameter sliders allowing real-time adjustment of price movement ($\pm 0.5\%$ to $\pm 10.0\%$) and volume surge ($1.1\times$ to $5.0\times$) criteria.

```
+-----------------------------------------------------------+
| Alert Configuration & Detection Rules              [ X ]  |
+-----------------------------------------------------------+
| Price Movement Threshold:            ±2.50%               |
| [=======================O...............................] |
|                                                           |
| Unusual Volume Ratio Threshold:      1.75x Baseline       |
| [=============================O.........................] |
|                                                           |
| Active Alerts Matching Criteria: 2 High Priority          |
| [ Reset to Defaults ]                     [ Save Rules ]  |
+-----------------------------------------------------------+
```
*(Placeholder: `docs/screenshots/threshold_settings_modal.png`)*

### 3. Research Copilot (Curated Dossier with Grounded Primary Sources)
Dossier view displaying audited FY24 financials, thesis/evidence separation, and direct links to Q2 FY25 earnings call PDF transcripts.

```
+----------------------------------------------------------------------------------------------------+
| Research Copilot: RELIANCE (Reliance Industries Limited)   [ CURATED FILING DATA ] [ View Filings →]|
| Offline Snapshot: Audited FY24 Annual Report & Q2 FY25 Disclosures | Last Ingested: 2024-11-01     |
+----------------------------------------------------------------------------------------------------+
| Financial Snapshot:                                                                                |
| - Consolidated Gross Revenue: ₹9,98,148 Cr [FY24 Audited]                                         |
| - Consolidated EBITDA:        ₹1,78,677 Cr [FY24 Audited]                                         |
| - Attributable Net Profit:    ₹69,622 Cr   [FY24 Audited]                                         |
+----------------------------------------------------------------------------------------------------+
| Analytical Theses & Verified Primary Disclosures:                                                  |
| [BULL CASE] Dominance of Consumer Businesses (Retail & Jio)                                       |
| Evidence: Retail operates 18,836 stores; Jio commands 470M+ subscribers (Source: FY24 MD&A).       |
|                                                                                                    |
| [BEAR CASE] Global Petrochemical & Refining Crack Spread Headwinds                                 |
| Evidence: Management transcript highlights transportation fuel crack declines & O2C EBITDA weakness|
| Source: RIL Q2 FY2024-25 Media & Analyst Call Transcript [EARNINGS CALL TRANSCRIPT] (Direct PDF ↗) |
+----------------------------------------------------------------------------------------------------+
```
*(Placeholder: `docs/screenshots/research_copilot_dossier.png`)*

### 4. Corporate Announcement Intelligence Feed (SEBI LODR Categorization)
Regulatory disclosures segmented across 5 categories with materiality ratings, direct exchange filing links, and company filter banners.

```
+----------------------------------------------------------------------------------------------------+
| Corporate Announcement Intelligence Feed                     [ Filtered by company: RELIANCE ] [X] |
| 1 filing displayed | SEBI LODR Categories: Financial Results, Contracts, M&A, Governance, Legal   |
+----------------------------------------------------------------------------------------------------+
| [HIGH PRIORITY] [FINANCIAL RESULTS] [VERIFIED PRIMARY DOCUMENT]                                    |
| Reliance Industries Ltd. — Standalone & Consolidated Unaudited Financial Results for Q2 FY25       |
| Disclosed Highlights & Terms:                                                                      |
| - Consolidated EBITDA recorded at ₹39,058 Cr                                                       |
| - Jio net profit up 23.4% YoY; Retail gross revenue reached ₹76,302 Cr                             |
| Source: BSE India Official Corporate Announcements (Direct PDF ↗)         [ Deep Research in Copilot →]|
+----------------------------------------------------------------------------------------------------+
```
*(Placeholder: `docs/screenshots/corporate_announcements_filtered.png`)*

---

## License

This project is prepared for demonstration and institutional review under the MIT License.
