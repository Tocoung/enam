# FINN — Institutional Investor Intelligence

A high-performance investor intelligence interface for Indian equity markets (NSE/BSE). Built for institutional and active investors to monitor portfolio breadth, detect unusual volume outliers, and execute evidence-grounded company research.

---

## Architecture & Technology Stack

- **Framework**: React 18 with TypeScript 5.6
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 3.4 (Editorial dark navy theme)
- **Zero-Heavyweight Dependencies**: Pure SVG icons, zero bloated chart libraries or heavy agent runtimes

---

## Core Capabilities

### 1. Portfolio Intelligence Dashboard
- **Monitored Equities**: 18 major NSE equities spanning 7 sectors.
- **Derived Alerts**: Dynamic price movement (±2.0%) and volume surges (≥1.5x) derived from configurable thresholds.
- **Strict Provenance**: Conspicuously labeled with DEMO simulated indicators.
- **Market Breadth**: Advance/decline distribution and 20-session baseline volume tracking.
- **Responsive Layout**: Dual-column workspace on desktop, fluid tabbed layout on mobile devices.

### 2. Research Copilot
- **Arbitrary Ticker Ingestion**: Evaluates any valid NSE equity symbol (e.g. `ZOMATO`, `BHARTIARTL`, `RELIANCE`, `TCS`, `HDFCBANK`, `SWIGGY`, `TRENT`, `CGFSDYMGUJHVGF`).
- **Input Validation**: Automatically trims whitespace, normalizes casing to uppercase, and rejects malformed characters.
- **Accurate Provenance & Scope**:
  - `CURATED FILING DATA`: Offline pre-ingested snapshot from audited FY24 filings (e.g. `ZOMATO`, `RELIANCE`, `TCS`, `HDFCBANK`, `SWIGGY`, `BHARTIARTL`).
  - `FOUND IN FINN LOCAL SYMBOL REGISTRY`: Matches FINN's finite local symbol list (e.g. `TRENT`, `BEL`, `PAYTM`, `ASIANPAINT`). FINN does not claim live exchange verification.
  - `IDENTITY NOT VERIFIED`: Ticker format is syntactically valid, but identity is unconfirmed.
  - `METRIC NOT INGESTED`: Unavailable financial metrics are explicitly marked as not ingested.
  - `ANALYTICAL INTERPRETATION`: Reasoned investment theses grounded in cited evidence, distinctly separated from audited facts.
- **Zero Fabrication**: No made-up company names, fake sectors, invented business descriptions, or speculative bull/bear arguments for unindexed tickers.
- **Official Exchange Lookup Options**: Clear, clickable lookup links to official NSE India, BSE India, and Screener query pages.

---

### 3. Corporate Announcement Intelligence Feed
- **Regulatory Categorization**: Segmented into 5 SEBI LODR categories (Financial Results, Orders & Contracts, Corporate Actions & Fundraising, Management & Governance, Regulatory & Legal).
- **FINN Editorial Assessment (Materiality)**: Explicit criteria for `HIGH`, `MEDIUM`, and `ROUTINE` priority based on disclosed transaction scale and operational significance, not an objective market price prediction.
- **4-Tier Provenance & Source Type Taxonomy**:
  - `VERIFIED PRIMARY DOCUMENT`: Exact official statutory filing, regulatory submission, or company disclosure resolved and linked directly (`Open filing ↗` or `Open company disclosure ↗`).
  - `OFFICIAL ARCHIVE LINK`: Official exchange or company announcements repository provided where the specific document is not individually isolated (`Open exchange archive ↗`).
  - `SECONDARY SOURCE`: Event supported by reputable financial media reporting citing corporate disclosures (`Read secondary coverage ↗`).
  - `DEMO ANNOUNCEMENT`: Conspicuously labelled synthetic market illustrations for interface evaluation, providing exchange portal lookup (`Inspect exchange portal ↗`). Zero fabricated filing numbers.
- **Source Type Distinction**:
  - `EXCHANGE_FILING`: Direct regulatory filing with exchange or regulator (`Open filing ↗`).
  - `COMPANY_PRESS_RELEASE` / `COMPANY_REGULATORY_DISCLOSURE`: Official company newsroom release or investor relations statement (`Open company disclosure ↗`).
  - `EXCHANGE_ARCHIVE`: Broad exchange announcements repository (`Open exchange archive ↗`).
  - `SECONDARY_MEDIA`: Reputable financial press reporting citing regulatory disclosures (`Read secondary coverage ↗`).
  - `SIMULATED_PORTAL`: Synthetic demonstration lookup option (`Inspect exchange portal ↗`).
- **Search & Multi-Criteria Sort**: Search across company names, tickers, sectors, and key terms; sort by publication date (newest/oldest) or materiality.
- **Direct Research Deep-Links**: One-click transition from any announcement card directly into the company's Research Copilot dossier.

---

## Data Source Strategy & Integrity

| Layer | Source | Provenance Label | Scope & Limitations |
| :--- | :--- | :--- | :--- |
| **Dashboard** | 20-session deterministic simulation | `DEMO DATA` | Simulated observations for interface evaluation. Not live trading data. |
| **Research (Curated)** | Audited FY24 Annual Reports & BSE/SEBI Filings | `CURATED FILING DATA` | Offline pre-ingested snapshot. Each metric and thesis links directly to a cited source. |
| **Research (Local List)** | Finite local symbol list | `FOUND IN FINN LOCAL SYMBOL REGISTRY` | Symbol exists in FINN's local list; no live exchange lookup conducted. Full filings unindexed. |
| **Research (Unverified)** | Arbitrary format-valid input | `IDENTITY NOT VERIFIED` | Ticker format valid only. External exchange query links provided. Zero data fabricated. |
| **Announcements (Primary)** | Official statutory filings / company press portals | `VERIFIED PRIMARY DOCUMENT` | Exact individual filing or company release specifically verified and linked. |
| **Announcements (Archive)** | Primary BSE/NSE corporate disclosures repositories | `OFFICIAL ARCHIVE LINK` | Official exchange archive repository; individual filing document not resolved. |
| **Announcements (Secondary)**| Verified financial media reports citing disclosures | `SECONDARY SOURCE` | Event details supported by reputable press reports citing regulatory disclosures. |
| **Announcements (Demo)** | Illustrative synthetic simulations | `DEMO ANNOUNCEMENT` | Clearly labelled DEMO entries for UI testing. Links provide portal lookup. |

---

## Environment Variables

No API keys are required to run the full application and explore company research dossiers.

Optional configuration for external live API endpoints:
```env
# Optional: External financial proxy endpoint (if running a custom backend)
# VITE_FINANCIAL_API_URL=https://api.example.com/v1/quote
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build & Preview
```bash
# Type check and build optimized static assets
npm run build

# Preview production build locally
npm run preview
```
