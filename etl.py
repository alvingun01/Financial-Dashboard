import sqlite3
import requests
import json
import yfinance as yf
from datetime import datetime

# Configuration
DB_PATH = 'portfolio.db'
COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price"

def get_holdings():
    """Extract current holdings from the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT asset_id, symbol, amount, type FROM holdings")
    holdings = cursor.fetchall()
    conn.close()
    return holdings

def fetch_crypto_prices(asset_ids):
    """Extract current crypto prices from CoinGecko API."""
    if not asset_ids:
        return {}
    ids_query = ",".join(asset_ids)
    params = {
        'ids': ids_query,
        'vs_currencies': 'usd'
    }
    try:
        response = requests.get(COINGECKO_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        return {k: v['usd'] for k, v in data.items()}
    except Exception as e:
        print(f"Error fetching crypto prices: {e}")
        return {}

def fetch_stock_prices(tickers):
    """Extract current stock prices from Yahoo Finance via yfinance."""
    if not tickers:
        return {}
    try:
        # Fetching all tickers at once
        data = yf.download(tickers, period="1d", interval="1m", progress=False)['Close']
        prices = {}
        for ticker in tickers:
            try:
                # Handle potential case where data might be a Series (one ticker) or DataFrame (multiple)
                if len(tickers) == 1:
                    val = data.iloc[-1]
                else:
                    val = data[ticker].dropna().iloc[-1]
                
                if val is None or str(val) == 'nan':
                    print(f"Warning: Price for {ticker} is NaN.")
                    prices[ticker] = 0.0
                else:
                    prices[ticker] = float(val)
            except (IndexError, KeyError):
                print(f"Warning: No data found for {ticker}.")
                prices[ticker] = 0.0
        return prices
    except Exception as e:
        print(f"Error fetching stock prices: {e}")
        return {}

def transform_data(holdings, crypto_prices, stock_prices):
    """Calculate the total value and breakdown of the portfolio."""
    total_value = 0.0
    breakdown = []
    
    for asset_id, symbol, amount, asset_type in holdings:
        price = 0.0
        if asset_type == 'crypto':
            price = crypto_prices.get(asset_id, 0.0)
        elif asset_type == 'stock':
            price = stock_prices.get(asset_id, 0.0)
            
        asset_value = price * amount
        total_value += asset_value
        breakdown.append({
            'asset_id': asset_id,
            'symbol': symbol,
            'amount': amount,
            'type': asset_type,
            'price_usd': price,
            'value_usd': asset_value
        })
        
    return total_value, breakdown

def load_snapshot(total_value, breakdown):
    """Load the daily snapshot into the history table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    details_json = json.dumps(breakdown)
    cursor.execute(
        "INSERT INTO daily_history (total_usd_value, details) VALUES (?, ?)",
        (total_value, details_json)
    )
    
    conn.commit()
    conn.close()

def run_etl():
    print(f"[{datetime.now()}] Starting Personal Finance ETL...")
    
    # 1. Extract
    holdings = get_holdings()
    
    crypto_ids = [h[0] for h in holdings if h[3] == 'crypto']
    stock_tickers = [h[0] for h in holdings if h[3] == 'stock']
    
    print(f"Extracted {len(crypto_ids)} cryptos and {len(stock_tickers)} stocks from database.")
    
    crypto_prices = fetch_crypto_prices(crypto_ids)
    print(f"Fetched {len(crypto_prices)} crypto prices from CoinGecko.")
    
    stock_prices = fetch_stock_prices(stock_tickers)
    print(f"Fetched {len(stock_prices)} stock prices from Yahoo Finance.")
    
    # 2. Transform
    total_value, breakdown = transform_data(holdings, crypto_prices, stock_prices)
    print(f"Transformed data. Total Portfolio Value: ${total_value:,.2f}")
    
    # 3. Load
    load_snapshot(total_value, breakdown)
    print("Successfully loaded snapshot into history table.")
    print("ETL process complete.")

if __name__ == "__main__":
    run_etl()
