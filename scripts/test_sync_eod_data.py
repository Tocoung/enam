#!/usr/bin/env python3
"""
Unit tests for FINN EOD Data Ingestion Pipeline.
Uses Python built-in unittest module (no external dependencies required).
"""

import datetime
import json
import os
import tempfile
import unittest

from sync_eod_data import (
    PORTFOLIO_TICKERS,
    is_in_progress_session,
    validate_and_sanitize_session,
    validate_session_series,
    write_atomic_json,
    run_eod_sync,
)


class TestEODDataIngestion(unittest.TestCase):
    def setUp(self):
        # Fixed reference UTC time: 2026-11-01 12:00:00 UTC (17:30 IST, post-market)
        self.ref_now_post_market = datetime.datetime(2026, 11, 1, 12, 0, 0, tzinfo=datetime.timezone.utc)
        # Reference UTC time during market hours: 2026-11-02 05:00:00 UTC (10:30 IST, in-progress)
        self.ref_now_in_progress = datetime.datetime(2026, 11, 2, 5, 0, 0, tzinfo=datetime.timezone.utc)

    def test_valid_session(self):
        raw = {
            "date": "2026-10-30",
            "open": 2720.55,
            "high": 2750.12,
            "low": 2715.0,
            "close": 2740.80,
            "volume": 8450123,
        }
        cleaned, reason = validate_and_sanitize_session(raw, self.ref_now_post_market)
        self.assertIsNotNone(cleaned)
        self.assertIsNone(reason)
        self.assertEqual(cleaned["date"], "2026-10-30")
        self.assertEqual(cleaned["open"], 2720.55)
        self.assertEqual(cleaned["high"], 2750.12)
        self.assertEqual(cleaned["low"], 2715.0)
        self.assertEqual(cleaned["close"], 2740.80)
        self.assertEqual(cleaned["volume"], 8450123)
        # Ensure numbers are JSON numbers (float/int), not strings
        self.assertIsInstance(cleaned["close"], float)
        self.assertIsInstance(cleaned["volume"], int)

    def test_reject_negative_or_zero_close(self):
        for bad_close in [0.0, -10.5, float("nan"), float("inf")]:
            raw = {
                "date": "2026-10-30",
                "open": 2720.0,
                "high": 2750.0,
                "low": 2710.0,
                "close": bad_close,
                "volume": 1000,
            }
            cleaned, reason = validate_and_sanitize_session(raw, self.ref_now_post_market)
            self.assertIsNone(cleaned)
            self.assertIn("non-positive or non-finite", reason)

    def test_reject_negative_volume(self):
        raw = {
            "date": "2026-10-30",
            "open": 2720.0,
            "high": 2750.0,
            "low": 2710.0,
            "close": 2730.0,
            "volume": -500,
        }
        cleaned, reason = validate_and_sanitize_session(raw, self.ref_now_post_market)
        self.assertIsNone(cleaned)
        self.assertIn("Invalid negative or non-finite volume", reason)

    def test_reject_inconsistent_ohlc_bounds(self):
        # High lower than Low
        raw_bad_high = {
            "date": "2026-10-30",
            "open": 2720.0,
            "high": 2700.0,
            "low": 2710.0,
            "close": 2715.0,
            "volume": 1000,
        }
        cleaned, reason = validate_and_sanitize_session(raw_bad_high, self.ref_now_post_market)
        self.assertIsNone(cleaned)
        self.assertIn("Inconsistent OHLC bounds", reason)

        # Close higher than High
        raw_bad_close = {
            "date": "2026-10-30",
            "open": 2720.0,
            "high": 2750.0,
            "low": 2710.0,
            "close": 2780.0,
            "volume": 1000,
        }
        cleaned, reason = validate_and_sanitize_session(raw_bad_close, self.ref_now_post_market)
        self.assertIsNone(cleaned)
        self.assertIn("Inconsistent OHLC bounds", reason)

    def test_in_progress_session_handling(self):
        # Date is 2026-11-02. If current time is 10:30 IST on 2026-11-02, must be excluded.
        self.assertTrue(is_in_progress_session("2026-11-02", self.ref_now_in_progress))

        # Date is 2026-11-02. If time is 17:30 IST on 2026-11-02, it is completed.
        now_post_market_today = datetime.datetime(2026, 11, 2, 12, 0, 0, tzinfo=datetime.timezone.utc)
        self.assertFalse(is_in_progress_session("2026-11-02", now_post_market_today))

        # Yesterday's date is never in-progress
        self.assertFalse(is_in_progress_session("2026-10-30", self.ref_now_in_progress))

    def test_chronological_ordering_and_deduplication(self):
        raw_sessions = [
            {"date": "2026-10-25", "open": 100, "high": 105, "low": 98, "close": 102, "volume": 1000},
            {"date": "2026-10-20", "open": 95, "high": 100, "low": 94, "close": 98, "volume": 1200},
            {"date": "2026-10-22", "open": 98, "high": 102, "low": 97, "close": 101, "volume": 1100},
            {"date": "2026-10-20", "open": 95, "high": 100, "low": 94, "close": 98, "volume": 1200}, # duplicate
        ]
        series, warnings = validate_session_series(raw_sessions, self.ref_now_post_market)
        self.assertEqual(len(series), 3)
        self.assertEqual([s["date"] for s in series], ["2026-10-20", "2026-10-22", "2026-10-25"])
        self.assertTrue(any("Duplicate date 2026-10-20" in w for w in warnings))

    def test_atomic_write(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            target_file = os.path.join(tmpdir, "test_output.json")
            sample_payload = {"testKey": "testVal", "nested": {"num": 42}}

            write_atomic_json(target_file, sample_payload)

            self.assertTrue(os.path.exists(target_file))
            with open(target_file, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            self.assertEqual(loaded, sample_payload)

    def test_full_pipeline_with_mock_provider(self):
        # Generate 25 sessions for 14 tickers, and 12 sessions for DRREDDY to test incomplete detection
        mock_data = {}
        base_date = datetime.date(2026, 10, 1)

        for ticker in PORTFOLIO_TICKERS.keys():
            session_count = 12 if ticker == "DRREDDY" else 25
            sessions = []
            curr_date = base_date
            for i in range(session_count):
                while curr_date.weekday() >= 5: # skip weekend
                    curr_date += datetime.timedelta(days=1)
                sessions.append({
                    "date": curr_date.isoformat(),
                    "open": 1000.0 + i * 2,
                    "high": 1010.0 + i * 2,
                    "low": 995.0 + i * 2,
                    "close": 1005.0 + i * 2,
                    "volume": 500000 + i * 1000,
                })
                curr_date += datetime.timedelta(days=1)
            mock_data[ticker] = sessions

        with tempfile.TemporaryDirectory() as tmpdir:
            test_json = os.path.join(tmpdir, "snapshot.json")
            success, snapshot = run_eod_sync(
                output_path=test_json,
                min_sessions=20,
                mock_provider=mock_data,
                verbose=False
            )

            # DRREDDY has only 12 sessions, so pipeline accurately reports incomplete (success=False)
            self.assertFalse(success)
            self.assertEqual(snapshot["totalTickers"], 15)
            self.assertEqual(snapshot["successfulTickers"], 14)
            self.assertEqual(snapshot["incompleteTickers"], 1)
            self.assertEqual(snapshot["failedTickers"], 0)
            self.assertFalse(snapshot["tickers"]["DRREDDY"]["hasMinimumSessions"])
            self.assertTrue(snapshot["tickers"]["RELIANCE"]["hasMinimumSessions"])

            # Verify saved JSON
            with open(test_json, "r", encoding="utf-8") as f:
                saved = json.load(f)
            self.assertEqual(saved["schemaVersion"], "1.0.0")
            self.assertEqual(saved["provider"], "Yahoo Finance")
            self.assertEqual(len(saved["tickers"]), 15)


if __name__ == "__main__":
    unittest.main()
