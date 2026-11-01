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

## Data Source Strategy & Integrity

| Layer | Source | Provenance Label | Scope & Limitations |
| :--- | :--- | :--- | :--- |
| **Dashboard** | 20-session deterministic simulation | `DEMO DATA` | Simulated observations for interface evaluation. Not live trading data. |
| **Research (Curated)** | Audited FY24 Annual Reports & BSE/SEBI Filings | `CURATED FILING DATA` | Offline pre-ingested snapshot. Each metric and thesis links directly to a cited source. |
| **Research (Local List)** | Finite local symbol list | `FOUND IN FINN LOCAL SYMBOL REGISTRY` | Symbol exists in FINN's local list; no live exchange lookup conducted. Full filings unindexed. |
| **Research (Unverified)** | Arbitrary format-valid input | `IDENTITY NOT VERIFIED` | Ticker format valid only. External exchange query links provided. Zero data fabricated. |

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
