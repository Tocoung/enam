#!/usr/bin/env python3
"""
FINN EOD Price & Volume Ingestion Script
Phase A1: Historical daily OHLCV ingestion for 15 NSE portfolio equities via Yahoo Finance.

Usage:
    python3 scripts/sync_eod_data.py [--output src/data/realEodData.json] [--period 60d] [--min-sessions 20]

Dependencies:
    pip install -r scripts/requirements.txt
"""

import argparse
import datetime
import json
import math
import os
import sys
import tempfile
from typing import Any, Dict, List, Optional, Tuple

# Mapping of canonical FINN portfolio symbols to Yahoo Finance symbols (.NS suffix)
PORTFOLIO_TICKERS: Dict[str, str] = {
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "INFY": "INFY.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "BHARTIARTL": "BHARTIARTL.NS",
    "SBIN": "SBIN.NS",
    "ITC": "ITC.NS",
    "LT": "LT.NS",
    "BAJFINANCE": "BAJFINANCE.NS",
    "MARUTI": "MARUTI.NS",
    "TATAMOTORS": "TATAMOTORS.NS",
    "SUNPHARMA": "SUNPHARMA.NS",
    "DRREDDY": "DRREDDY.NS",
    "SWIGGY": "SWIGGY.NS",
}

# Indian Standard Time (IST) is UTC + 5:30
IST_OFFSET = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
# Official NSE settlement / Bhavcopy publication threshold time
NSE_SETTLEMENT_TIME = datetime.time(16, 0)


def is_in_progress_session(session_date_str: str, now_utc: datetime.datetime) -> bool:
    """
    Determines whether a daily bar represents an incomplete/in-progress trading session.
    
    Rule:
    If the session date matches today's date in Indian Standard Time (IST) and the
    current IST time is before 16:00 IST (official market settlement threshold),
    the session is treated as in-progress and must be excluded from completed EOD datasets.
    """
    try:
        session_date = datetime.date.fromisoformat(session_date_str)
    except ValueError:
        return False

    now_ist = now_utc.astimezone(IST_OFFSET)
    today_ist = now_ist.date()

    if session_date == today_ist:
        return now_ist.time() < NSE_SETTLEMENT_TIME

    # If session date is in the future relative to IST today, it's invalid/in-progress
    if session_date > today_ist:
        return True

    return False


def validate_and_sanitize_session(
    raw: Dict[str, Any],
    now_utc: datetime.datetime
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Validates a single daily OHLCV session observation.
    
    Returns:
        (sanitized_session_dict, None) if valid.
        (None, reason_string) if rejected or excluded.
    """
    date_val = raw.get("date")
    if not isinstance(date_val, str) or len(date_val) != 10:
        return None, f"Invalid date string: {date_val}"

    try:
        datetime.date.fromisoformat(date_val)
    except ValueError:
        return None, f"Malformed calendar date: {date_val}"

    # Filter out in-progress / unfinalized sessions
    if is_in_progress_session(date_val, now_utc):
        return None, f"In-progress session on {date_val} excluded (before NSE 16:00 IST settlement)"

    # Numeric validation
    try:
        close = float(raw["close"])
        open_p = float(raw["open"])
        high = float(raw["high"])
        low = float(raw["low"])
        volume = int(raw["volume"])
    except (KeyError, ValueError, TypeError) as e:
        return None, f"Non-numeric OHLCV value on {date_val}: {e}"

    for name, val in [("close", close), ("open", open_p), ("high", high), ("low", low)]:
        if not math.isfinite(val) or val <= 0:
            return None, f"Invalid non-positive or non-finite {name} on {date_val}: {val}"

    if not math.isfinite(volume) or volume < 0:
        return None, f"Invalid negative or non-finite volume on {date_val}: {volume}"

    # Sanity checks on price relationships
    if high < low or high < close or high < open_p or low > close or low > open_p:
        return None, f"Inconsistent OHLC bounds (high < low or close outside high/low) on {date_val}"

    # Store strictly as JSON numbers (float rounded to 2 decimal places, int for volume)
    return {
        "date": date_val,
        "open": round(open_p, 2),
        "high": round(high, 2),
        "low": round(low, 2),
        "close": round(close, 2),
        "volume": volume,
    }, None


def validate_session_series(
    raw_sessions: List[Dict[str, Any]],
    now_utc: datetime.datetime
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Validates, filters, deduplicates, and chronologically sorts a list of raw sessions.
    """
    validated: List[Dict[str, Any]] = []
    warnings: List[str] = []
    seen_dates = set()

    for raw in raw_sessions:
        cleaned, reason = validate_and_sanitize_session(raw, now_utc)
        if cleaned is not None:
            if cleaned["date"] in seen_dates:
                warnings.append(f"Duplicate date {cleaned['date']} encountered; skipping duplicate")
                continue
            seen_dates.add(cleaned["date"])
            validated.append(cleaned)
        elif reason:
            warnings.append(reason)

    # Enforce strict chronological ordering (oldest first)
    validated.sort(key=lambda s: s["date"])

    return validated, warnings


def fetch_yahoo_history(
    yahoo_symbol: str,
    period: str = "60d",
    max_retries: int = 2
) -> List[Dict[str, Any]]:
    """
    Fetches daily OHLCV history from Yahoo Finance using yfinance.
    Includes retry logic to handle transient HTTP/network fluctuations gracefully.
    """
    try:
        import yfinance as yf
    except ImportError:
        raise RuntimeError(
            "The 'yfinance' library is not installed.\n"
            "Please install it using: pip install -r scripts/requirements.txt"
        )

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            ticker_obj = yf.Ticker(yahoo_symbol)
            # auto_adjust=False keeps nominal market close prices
            df = ticker_obj.history(period=period, interval="1d", auto_adjust=False)

            if df is None or df.empty:
                return []

            raw_sessions: List[Dict[str, Any]] = []
            for dt_index, row in df.iterrows():
                # Date conversion from pandas Timestamp
                if hasattr(dt_index, "strftime"):
                    date_str = dt_index.strftime("%Y-%m-%d")
                else:
                    date_str = str(dt_index)[:10]

                try:
                    raw_sessions.append({
                        "date": date_str,
                        "open": row.get("Open"),
                        "high": row.get("High"),
                        "low": row.get("Low"),
                        "close": row.get("Close"),
                        "volume": row.get("Volume"),
                    })
                except Exception:
                    continue

            return raw_sessions
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                import time
                time.sleep(1.0)
                continue
            raise last_error

    return []


def write_atomic_json(filepath: str, payload: Dict[str, Any]) -> None:
    """
    Writes JSON data atomically using a temporary file in the destination directory
    and atomic file replacement to prevent corrupt or truncated output on interruption.
    """
    dir_name = os.path.dirname(filepath)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    temp_file = tempfile.NamedTemporaryFile("w", dir=dir_name, delete=False, encoding="utf-8")
    try:
        json.dump(payload, temp_file, indent=2, sort_keys=False)
        temp_file.flush()
        os.fsync(temp_file.fileno())
        temp_file.close()
        os.replace(temp_file.name, filepath)
    except Exception:
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)
        raise


def run_eod_sync(
    output_path: str = "src/data/realEodData.json",
    period: str = "60d",
    min_sessions: int = 20,
    mock_provider: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    verbose: bool = False
) -> Tuple[bool, Dict[str, Any]]:
    """
    Executes the EOD synchronization pipeline.
    
    Returns:
        (is_success, snapshot_payload)
    """
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    retrieved_at_iso = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    tickers_output: Dict[str, Any] = {}
    successful_count = 0
    incomplete_count = 0
    failed_count = 0
    max_date_found = ""

    print(f"=== FINN EOD Data Ingestion ===")
    print(f"Retrieval timestamp (UTC): {retrieved_at_iso}")
    print(f"Target tickers: {len(PORTFOLIO_TICKERS)}")
    print(f"Required minimum completed sessions: {min_sessions}")
    print(f"History window requested: {period}\n")

    for canonical_ticker, yahoo_symbol in PORTFOLIO_TICKERS.items():
        try:
            if mock_provider is not None:
                raw_sessions = mock_provider.get(canonical_ticker, [])
            else:
                raw_sessions = fetch_yahoo_history(yahoo_symbol, period=period)

            if not raw_sessions:
                print(f"[-] {canonical_ticker:12} ({yahoo_symbol:14}): No data returned from provider")
                tickers_output[canonical_ticker] = {
                    "ticker": canonical_ticker,
                    "yahooSymbol": yahoo_symbol,
                    "currency": "INR",
                    "status": "NO_DATA",
                    "sessionCount": 0,
                    "hasMinimumSessions": False,
                    "error": "No trading data returned for symbol",
                    "sessions": [],
                }
                failed_count += 1
                continue

            valid_sessions, warnings = validate_session_series(raw_sessions, now_utc)

            if verbose and warnings:
                for w in warnings:
                    print(f"    [WARN] {canonical_ticker}: {w}")

            session_count = len(valid_sessions)
            has_min = session_count >= min_sessions

            if session_count == 0:
                print(f"[-] {canonical_ticker:12} ({yahoo_symbol:14}): 0 valid sessions after validation")
                tickers_output[canonical_ticker] = {
                    "ticker": canonical_ticker,
                    "yahooSymbol": yahoo_symbol,
                    "currency": "INR",
                    "status": "VALIDATION_FAILED",
                    "sessionCount": 0,
                    "hasMinimumSessions": False,
                    "error": "All observations failed validation checks",
                    "sessions": [],
                }
                failed_count += 1
                continue

            latest_date = valid_sessions[-1]["date"]
            if not max_date_found or latest_date > max_date_found:
                max_date_found = latest_date

            current_price = valid_sessions[-1]["close"]
            current_volume = valid_sessions[-1]["volume"]
            prev_close = valid_sessions[-2]["close"] if session_count >= 2 else None

            status_label = "OK" if has_min else "INCOMPLETE"
            if has_min:
                successful_count += 1
                print(f"[+] {canonical_ticker:12} ({yahoo_symbol:14}): {session_count:2d} sessions | Latest: {latest_date} | Close: ₹{current_price:,.2f}")
            else:
                incomplete_count += 1
                print(f"[!] {canonical_ticker:12} ({yahoo_symbol:14}): {session_count:2d} sessions (< {min_sessions} required) | Latest: {latest_date} [INCOMPLETE]")

            tickers_output[canonical_ticker] = {
                "ticker": canonical_ticker,
                "yahooSymbol": yahoo_symbol,
                "currency": "INR",
                "status": status_label,
                "sessionCount": session_count,
                "hasMinimumSessions": has_min,
                "latestDate": latest_date,
                "currentPrice": current_price,
                "prevClose": prev_close,
                "currentVolume": current_volume,
                "sessions": valid_sessions,
            }

        except Exception as e:
            print(f"[ERR] {canonical_ticker:10} ({yahoo_symbol:14}): Exception during fetch: {e}")
            tickers_output[canonical_ticker] = {
                "ticker": canonical_ticker,
                "yahooSymbol": yahoo_symbol,
                "currency": "INR",
                "status": "ERROR",
                "sessionCount": 0,
                "hasMinimumSessions": False,
                "error": str(e),
                "sessions": [],
            }
            failed_count += 1

    snapshot = {
        "schemaVersion": "1.0.0",
        "provider": "Yahoo Finance",
        "retrievedAt": retrieved_at_iso,
        "asOfDate": max_date_found or None,
        "eodPolicy": "Settled daily bars only; current-day sessions excluded prior to 16:00 IST market settlement",
        "totalTickers": len(PORTFOLIO_TICKERS),
        "successfulTickers": successful_count,
        "incompleteTickers": incomplete_count,
        "failedTickers": failed_count,
        "tickers": tickers_output,
    }

    # Atomically persist output
    write_atomic_json(output_path, snapshot)
    print(f"\nSaved atomic snapshot to: {output_path}")

    print("\n--- INGESTION SUMMARY ---")
    print(f"Total tickers configured:   {len(PORTFOLIO_TICKERS)}")
    print(f"Completed (>= {min_sessions} sessions): {successful_count}")
    print(f"Incomplete (< {min_sessions} sessions): {incomplete_count}")
    print(f"Failed / No data:           {failed_count}")
    print(f"As-of latest trading date:  {max_date_found or 'None'}")

    all_complete = (successful_count == len(PORTFOLIO_TICKERS))
    return all_complete, snapshot


def main() -> None:
    parser = argparse.ArgumentParser(description="Synchronize FINN portfolio historical EOD prices from Yahoo Finance.")
    parser.add_argument("--output", "-o", default="src/data/realEodData.json", help="Destination JSON filepath")
    parser.add_argument("--period", "-p", default="60d", help="History window (e.g. 45d, 60d, 3mo)")
    parser.add_argument("--min-sessions", "-m", type=int, default=20, help="Minimum completed sessions required")
    parser.add_argument("--verbose", "-v", action="store_true", help="Print individual validation warnings")

    args = parser.parse_args()

    success, _ = run_eod_sync(
        output_path=args.output,
        period=args.period,
        min_sessions=args.min_sessions,
        verbose=args.verbose,
    )

    if not success:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
