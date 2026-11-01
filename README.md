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
- **Market Breadth**: Real-time advance/decline distribution and volume ratio tracking.
- **Responsive Layout**: Dual-column workspace on desktop, fluid tabbed layout on mobile devices.

### 2. Research Copilot
- **Arbitrary Ticker Ingestion**: Evaluates any valid NSE equity symbol (e.g. `ZOMATO`, `BHARTIARTL`, `RELIANCE`, `TCS`, `HDFCBANK`, `SWIGGY`, `TRENT`).
- **Input Validation**: Automatically trims whitespace, normalizes casing to uppercase, and rejects malformed characters.
- **Company Overview**: Corporate profile, ISIN, CIN, sector, industry, and business description.
- **Financial Snapshot**: Audited financial metrics (Revenue, PAT, Margins, Debt/Equity, Cash Reserves). Missing metrics (e.g., Banking Debt/Equity) are explicitly marked as `Not Reported` with explanatory regulatory context (e.g., CRAR).
- **Bull Case & Catalysts**: Evidence-backed analytical hypotheses citing verified filings, distinct from audited facts.
- **Bear Case & Risks**: Structured vulnerability analysis tagged with risk severity (`HIGH`, `MEDIUM`, `MONITOR`).
- **Primary Source Citations**: Direct clickable URLs to official investor relations portals, NSE equity pages, and BSE Regulation 33 earnings filings.
- **Unindexed Fallback**: For valid NSE tickers without offline ingested dossiers, provides transparent direct links to official NSE and BSE quote portals without fabricating data.

---

## Data Source Strategy & Integrity

| Layer | Source | Provenance Label | Fabrication Policy |
| :--- | :--- | :--- | :--- |
| **Dashboard** | 20-session deterministic simulation | `DEMO DATA` | Simulated for interface testing |
| **Research (Indexed)** | Audited FY24 / Q2 FY25 Annual Reports & BSE Filings | `VERIFIED_FILING` | **Zero fabrication**; verified audited facts |
| **Research (Unindexed)** | Primary NSE / BSE Exchange Portals | `UNINDEXED_EXCHANGE_LOOKUP` | Financials left blank / unindexed; direct exchange links provided |

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
