import pandas as pd
import yfinance as yf
import sqlite3
import json
from datetime import datetime
import time
import ssl

# Fix for macOS SSL certificate verification error
ssl._create_default_https_context = ssl._create_unverified_context

DB_PATH = 'portfolio.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_market_db():
    """Create the market scores table if it doesn't exist."""
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS market_index_scores (
            symbol TEXT PRIMARY KEY,
            name TEXT,
            index_name TEXT,
            score INTEGER,
            details TEXT,
            last_updated TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

import requests as req_lib
from bs4 import BeautifulSoup
import io

def get_tickers():
    """Fetch ticker lists for S&P 500, Dow Jones, and NASDAQ-100 from Wikipedia."""
    print("Fetching ticker lists from Wikipedia...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    def fetch_index_tickers(url, symbol_col):
        response = req_lib.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        tables = soup.find_all('table', {'class': 'wikitable'})
        
        for table in tables:
            df = pd.read_html(io.StringIO(str(table)))[0]
            if symbol_col in df.columns:
                return df[symbol_col].tolist()
        return []

    # S&P 500
    sp500_tickers = fetch_index_tickers('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', 'Symbol')
    
    # Dow Jones
    dow_tickers = fetch_index_tickers('https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average', 'Symbol')
    
    # NASDAQ-100
    nasdaq_tickers = fetch_index_tickers('https://en.wikipedia.org/wiki/Nasdaq-100', 'Ticker')
    
    return {
        'SP500': sp500_tickers,
        'DOW': dow_tickers,
        'NASDAQ100': nasdaq_tickers
    }

def get_linear_points(val, ideal, threshold, max_points=20):
    """Python implementation of the linear scoring logic."""
    if val is None or pd.isna(val):
        return 0
    
    lower_is_better = ideal < threshold
    
    if lower_is_better:
        if val <= ideal: return max_points
        if val >= threshold: return 0
        return round(max_points * (1 - (val - ideal) / (threshold - ideal)))
    else:
        if val >= ideal: return max_points
        if val <= threshold: return 0
        return round(max_points * (1 - (ideal - val) / (ideal - threshold)))

def calculate_score(info):
    """Calculate the 100-point Health Score based on fundamentals."""
    checks = [
        {"label": "Valuation (P/E)", "points": get_linear_points(info.get('trailingPE'), 10, 30, 20)},
        {"label": "Asset Value (P/B)", "points": get_linear_points(info.get('priceToBook'), 1.0, 4.0, 20)},
        {"label": "Profitability", "points": get_linear_points(info.get('profitMargins'), 0.25, 0.0, 20)},
        {"label": "Growth", "points": get_linear_points(info.get('revenueGrowth'), 0.20, 0.0, 20)},
        {"label": "Financial Health", "points": get_linear_points(info.get('debtToEquity'), 0.2, 1.5, 20)},
    ]
    total = sum(c['points'] for c in checks)
    return total, checks

def scan_market():
    init_market_db()
    ticker_groups = get_tickers()
    
    all_tickers = []
    ticker_to_index = {}
    for idx_name, tickers in ticker_groups.items():
        for t in tickers:
            t = t.replace('.', '-') # yfinance uses - for . (e.g. BRK.B -> BRK-B)
            all_tickers.append(t)
            ticker_to_index[t] = idx_name

    unique_tickers = list(set(all_tickers))
    print(f"Starting scan of {len(unique_tickers)} unique stocks...")

    conn = get_db_connection()
    
    # Process in small batches to avoid rate limits
    batch_size = 20
    for i in range(0, len(unique_tickers), batch_size):
        batch = unique_tickers[i:i+batch_size]
        print(f"Processing batch {i//batch_size + 1}/{(len(unique_tickers)//batch_size)+1}...")
        
        for symbol in batch:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                
                if not info or 'longName' not in info:
                    continue
                    
                score, breakdown = calculate_score(info)
                
                conn.execute('''
                    INSERT OR REPLACE INTO market_index_scores 
                    (symbol, name, index_name, score, details, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    symbol, 
                    info.get('longName'), 
                    ticker_to_index.get(symbol),
                    score,
                    json.dumps(breakdown),
                    datetime.now()
                ))
                conn.commit()
            except Exception as e:
                print(f"Error scanning {symbol}: {e}")
            
            # Tiny sleep to be polite to Yahoo
            time.sleep(0.1)
        
        print(f"Progress: {min(i+batch_size, len(unique_tickers))}/{len(unique_tickers)} stocks scanned.")

    conn.close()
    print("Market scan complete!")

if __name__ == "__main__":
    scan_market()
