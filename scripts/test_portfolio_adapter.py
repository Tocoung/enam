#!/usr/bin/env python3
"""
Python Specification Mirror Test Suite for FINN Portfolio Adapter & Provenance Integration.

NOTE: This test suite simulates the portfolio adapter in Python to verify specification
rules and edge-case contracts against raw JSON/TS source files.
It does NOT execute production TypeScript runtime code directly.

For direct execution and testing of pure TypeScript production code (src/services/portfolioService.ts),
execute: node scripts/test_portfolio_adapter_ts.mjs
"""

import json
import math
import re
import unittest
from typing import Any, Dict, List, Optional


def load_real_eod_json() -> Dict[str, Any]:
    with open("src/data/realEodData.json", "r", encoding="utf-8") as f:
        return json.load(f)


def parse_portfolio_raw_data() -> List[Dict[str, Any]]:
    """
    Parses demo positions from src/data/portfolioData.ts.
    Extracts ticker, name, isin, sector, currency, currentPrice, prevClose, currentVolume.
    """
    with open("src/data/portfolioData.ts", "r", encoding="utf-8") as f:
        content = f.read()

    stocks = []
    # Match object blocks within PORTFOLIO_RAW_DATA
    pattern = re.compile(
        r'''ticker:\s*'([^']+)',\s*name:\s*(?:'([^']+)'|"([^"]+)"),\s*isin:\s*'([^']+)',\s*sector:\s*'([^']+)',\s*currency:\s*'INR',\s*currentPrice:\s*([0-9.]+),\s*prevClose:\s*([0-9.]+|null)''',
        re.MULTILINE,
    )
    for m in pattern.finditer(content):
        ticker = m.group(1)
        name = m.group(2) or m.group(3)
        isin = m.group(4)
        sector = m.group(5)
        price_str = m.group(6)
        prev_close_str = m.group(7)

        stocks.append({
            "ticker": ticker,
            "name": name,
            "isin": isin,
            "sector": sector,
            "currency": "INR",
            "currentPrice": float(price_str) if price_str != "null" else None,
            "prevClose": float(prev_close_str) if prev_close_str != "null" else None,
            "currentVolume": 1000000,
            "pastSessions": [{"date": f"2026-10-{i:02d}", "close": 100.0, "volume": 50000} for i in range(1, 21)],
            "provenance": "DEMO",
        })
    return stocks


def simulate_adapter(stocks: List[Dict[str, Any]], snapshot: Dict[str, Any], mode: str) -> List[Dict[str, Any]]:
    """
    Python mirror of src/services/portfolioService.ts getPortfolioStocks().
    """
    if mode == "DEMO":
        return [
            {
                **s,
                "pastSessions": [dict(sess) for sess in s["pastSessions"]],
                "provenance": "DEMO",
                "fallbackReason": None,
            }
            for s in stocks
        ]

    # REAL_EOD Mode
    result = []
    snapshot_tickers = snapshot.get("tickers", {})
    as_of = snapshot.get("asOfDate")

    for s in stocks:
        ticker = s["ticker"]
        rec = snapshot_tickers.get(ticker)

        if not rec:
            result.append({
                **s,
                "pastSessions": [dict(sess) for sess in s["pastSessions"]],
                "provenance": "DEMO_FALLBACK",
                "asOfDate": as_of,
                "fallbackReason": "Symbol not included in Yahoo Finance EOD dataset",
            })
            continue

        if rec.get("status") == "NO_DATA":
            result.append({
                **s,
                "pastSessions": [dict(sess) for sess in s["pastSessions"]],
                "provenance": "DEMO_FALLBACK",
                "asOfDate": as_of,
                "fallbackReason": "No market data returned from provider (symbol discontinued/demerged on exchange)",
            })
            continue

        if rec.get("status") != "OK":
            result.append({
                **s,
                "pastSessions": [dict(sess) for sess in s["pastSessions"]],
                "provenance": "DEMO_FALLBACK",
                "asOfDate": as_of,
                "fallbackReason": rec.get("error", "Status not OK"),
            })
            continue

        sessions = rec.get("sessions", [])
        if len(sessions) < 21:
            result.append({
                **s,
                "pastSessions": [dict(sess) for sess in s["pastSessions"]],
                "provenance": "DEMO_FALLBACK",
                "asOfDate": as_of,
                "fallbackReason": "Insufficient historical observations (<20 baseline sessions)",
            })
            continue

        latest = sessions[-1]
        prev = sessions[-2]
        past = sessions[:-1]

        result.append({
            "ticker": s["ticker"],
            "name": s["name"],
            "isin": s["isin"],
            "sector": s["sector"],
            "currency": "INR",
            "currentPrice": latest["close"],
            "prevClose": rec.get("prevClose") or prev["close"],
            "currentVolume": latest["volume"],
            "pastSessions": past,
            "provenance": "REAL_EOD",
            "asOfDate": latest["date"],
            "fallbackReason": None,
        })

    return result


def calculate_price_movement(curr: Optional[float], prev: Optional[float]):
    if curr is None or prev is None or prev <= 0 or math.isnan(curr) or math.isnan(prev):
        return None, None
    change = round(curr - prev, 2)
    pct = round((change / prev) * 100, 2)
    return change, pct


def calculate_volume_ratio(curr_vol: Optional[int], past_sessions: List[Dict[str, Any]]):
    if not past_sessions or len(past_sessions) < 20:
        return None, None, True
    prev_20 = past_sessions[-20:]
    valid = [s["volume"] for s in prev_20 if isinstance(s.get("volume"), (int, float)) and s["volume"] >= 0]
    if len(valid) < 20:
        return None, None, True
    avg_20 = round(sum(valid) / 20)
    if avg_20 == 0:
        return avg_20, None, False
    if curr_vol is None or curr_vol < 0:
        return avg_20, None, False
    ratio = round(curr_vol / avg_20, 2)
    return avg_20, ratio, False


def derive_alerts(stocks: List[Dict[str, Any]], price_thresh: float = 2.0, vol_thresh: float = 1.5):
    alerts = []
    for s in stocks:
        _, pct = calculate_price_movement(s["currentPrice"], s["prevClose"])
        _, ratio, is_insuf = calculate_volume_ratio(s["currentVolume"], s["pastSessions"])

        if pct is not None and abs(pct) >= price_thresh:
            alerts.append({
                "ticker": s["ticker"],
                "type": "PRICE_MOVEMENT",
                "severity": "HIGH" if abs(pct) >= price_thresh * 1.5 else "MEDIUM",
                "provenance": s["provenance"],
            })

        if ratio is not None and not is_insuf and ratio >= vol_thresh:
            alerts.append({
                "ticker": s["ticker"],
                "type": "UNUSUAL_VOLUME",
                "severity": "HIGH" if ratio >= vol_thresh * 1.5 else "MEDIUM",
                "provenance": s["provenance"],
            })
    return alerts


class TestPortfolioAdapter(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw_stocks = parse_portfolio_raw_data()
        cls.snapshot = load_real_eod_json()

    def test_01_demo_mode_returns_all_original_records_with_demo_provenance(self):
        demo_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "DEMO")
        self.assertEqual(len(demo_stocks), len(self.raw_stocks))
        for s in demo_stocks:
            self.assertEqual(s["provenance"], "DEMO")
            self.assertIsNone(s["fallbackReason"])

    def test_02_real_eod_mode_preserves_all_positions(self):
        real_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "REAL_EOD")
        self.assertEqual(len(real_stocks), len(self.raw_stocks))
        # Ensure company metadata is preserved
        for orig, adapted in zip(self.raw_stocks, real_stocks):
            self.assertEqual(orig["ticker"], adapted["ticker"])
            self.assertEqual(orig["name"], adapted["name"])
            self.assertEqual(orig["isin"], adapted["isin"])
            self.assertEqual(orig["sector"], adapted["sector"])

    def test_03_available_real_records_have_real_eod_provenance(self):
        real_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "REAL_EOD")
        real_eod_list = [s for s in real_stocks if s["provenance"] == "REAL_EOD"]
        self.assertGreaterEqual(len(real_eod_list), 13)
        for s in real_eod_list:
            rec = self.snapshot["tickers"][s["ticker"]]
            self.assertEqual(rec["status"], "OK")
            self.assertGreaterEqual(len(rec["sessions"]), 21)

    def test_04_missing_tatamotors_uses_demo_fallback_and_retains_metadata(self):
        real_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "REAL_EOD")
        tm = next(s for s in real_stocks if s["ticker"] == "TATAMOTORS")
        self.assertEqual(tm["provenance"], "DEMO_FALLBACK")
        self.assertIn("demerged", tm["fallbackReason"])
        # Retained original demo values
        orig_tm = next(s for s in self.raw_stocks if s["ticker"] == "TATAMOTORS")
        self.assertEqual(tm["currentPrice"], orig_tm["currentPrice"])
        self.assertEqual(tm["name"], "Tata Motors Ltd.")

    def test_05_uncovered_positions_use_demo_fallback(self):
        real_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "REAL_EOD")
        uncovered = [s for s in real_stocks if s["ticker"] in ["HINDUNILVR", "TITAN", "NTPC", "TATASTEEL", "WIPRO", "IDEA"]]
        for s in uncovered:
            self.assertEqual(s["provenance"], "DEMO_FALLBACK")
            self.assertIn("not included", s["fallbackReason"])
            orig = next(o for o in self.raw_stocks if o["ticker"] == s["ticker"])
            self.assertEqual(s["currentPrice"], orig["currentPrice"])

    def test_06_real_ticker_current_price_equals_latest_close(self):
        real_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "REAL_EOD")
        for s in real_stocks:
            if s["provenance"] == "REAL_EOD":
                rec = self.snapshot["tickers"][s["ticker"]]
                expected_close = rec["sessions"][-1]["close"]
                self.assertEqual(s["currentPrice"], expected_close)

    def test_07_real_ticker_previous_close_equals_second_latest_close(self):
        real_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "REAL_EOD")
        for s in real_stocks:
            if s["provenance"] == "REAL_EOD":
                rec = self.snapshot["tickers"][s["ticker"]]
                expected_prev = rec["prevClose"] or rec["sessions"][-2]["close"]
                self.assertEqual(s["prevClose"], expected_prev)

    def test_08_real_ticker_current_volume_equals_latest_volume(self):
        real_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "REAL_EOD")
        for s in real_stocks:
            if s["provenance"] == "REAL_EOD":
                rec = self.snapshot["tickers"][s["ticker"]]
                expected_vol = rec["sessions"][-1]["volume"]
                self.assertEqual(s["currentVolume"], expected_vol)

    def test_09_baseline_excludes_latest_session(self):
        real_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "REAL_EOD")
        for s in real_stocks:
            if s["provenance"] == "REAL_EOD":
                rec = self.snapshot["tickers"][s["ticker"]]
                latest_session = rec["sessions"][-1]
                # pastSessions must NOT contain the latest session
                dates_in_past = [p["date"] for p in s["pastSessions"]]
                self.assertNotIn(latest_session["date"], dates_in_past)
                self.assertEqual(len(s["pastSessions"]), len(rec["sessions"]) - 1)

    def test_10_volume_ratio_and_price_movement_formulas_unchanged(self):
        # Test known numbers
        # Price: 1300 vs 1164.9 -> +135.10 (+11.60%)
        change, pct = calculate_price_movement(1300.0, 1164.9)
        self.assertEqual(change, 135.10)
        self.assertEqual(pct, 11.60)

        # Volume: 20 sessions of 1000, current = 2500 -> avg = 1000, ratio = 2.50
        sessions = [{"date": f"2026-10-{i:02d}", "volume": 1000} for i in range(1, 21)]
        avg, ratio, is_insuf = calculate_volume_ratio(2500, sessions)
        self.assertEqual(avg, 1000)
        self.assertEqual(ratio, 2.50)
        self.assertFalse(is_insuf)

    def test_11_insufficient_history_record_safely_falls_back(self):
        # Create synthetic snapshot with insufficient sessions (< 21)
        mock_snapshot = {
            "asOfDate": "2026-11-02",
            "tickers": {
                "RELIANCE": {
                    "ticker": "RELIANCE",
                    "status": "OK",
                    "sessions": [{"date": f"2026-10-{i:02d}", "close": 100.0, "volume": 1000} for i in range(1, 15)], # only 14 sessions
                }
            }
        }
        res = simulate_adapter(self.raw_stocks, mock_snapshot, "REAL_EOD")
        rel = next(s for s in res if s["ticker"] == "RELIANCE")
        self.assertEqual(rel["provenance"], "DEMO_FALLBACK")
        self.assertIn("Insufficient", rel["fallbackReason"])

    def test_12_alerts_inherit_stock_provenance(self):
        real_stocks = simulate_adapter(self.raw_stocks, self.snapshot, "REAL_EOD")
        alerts = derive_alerts(real_stocks, price_thresh=2.0, vol_thresh=1.5)
        self.assertGreater(len(alerts), 0)

        provenance_set = {a["provenance"] for a in alerts}
        self.assertTrue("REAL_EOD" in provenance_set or "DEMO_FALLBACK" in provenance_set)
        for a in alerts:
            source_stock = next(s for s in real_stocks if s["ticker"] == a["ticker"])
            self.assertEqual(a["provenance"], source_stock["provenance"])


if __name__ == "__main__":
    unittest.main()
