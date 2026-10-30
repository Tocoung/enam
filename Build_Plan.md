# FINN — Build Plan

## Objective
Build a mobile-first investor intelligence prototype that helps an investor identify important changes and investigate a company quickly.

## P0 — Must work
1. Dashboard with a portfolio of 15–20 NSE-listed companies.
2. Daily price changes and volume-based alerts, with data provenance clearly indicated.
3. Prioritised announcement feed with category filters.
4. Research page accepting arbitrary NSE tickers.
5. One end-to-end research flow showing financial/business information, risks, bull/bear cases and source links.
6. Responsive layout, working navigation and useful error states.
7. Deployment, README, GitHub repository and submission email.

## P1 — Only after P0 works
- Configurable alert thresholds.
- QoQ and YoY results comparisons.
- Improved caching and loading states.
- Additional primary-source document extraction.

## Explicitly out of scope
- Authentication and user accounts.
- Complex database infrastructure.
- Full automation of every exchange filing.
- Voice interface and autonomous background agents.
- Multiple redundant AI models.
- Features that cannot be demonstrated reliably.

## Data integrity rules
- Label sample data as DEMO.
- Never represent fabricated announcements as actual filings.
- Never invent financial values or source citations.
- Distinguish retrieved facts from AI-generated interpretation.
- Show original source links where available.

## Definition of done
The app runs, the primary user journeys work, the deployed version is tested on a mobile viewport, and all submission links are accessible.