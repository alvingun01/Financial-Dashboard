import sqlite3
import requests
import json
import yfinance as yf
from datetime import datetime

# Configuration
DB_PATH = 'portfolio.db'
COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price"

def get_holdings():
    """Extract current holdings and cost basis from the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT asset_id, symbol, amount, type, buy_price FROM holdings")
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
    """Calculate the total value, PnL, and breakdown of the portfolio."""
    total_value = 0.0
    total_pnl = 0.0
    breakdown = []
    
    for asset_id, symbol, amount, asset_type, buy_price in holdings:
        price = 0.0
        if asset_type == 'crypto':
            price = crypto_prices.get(asset_id, 0.0)
        elif asset_type == 'stock':
            price = stock_prices.get(asset_id, 0.0)
            
        asset_value = price * amount
        cost_basis = buy_price * amount
        asset_pnl = asset_value - cost_basis
        
        total_value += asset_value
        total_pnl += asset_pnl
        
        breakdown.append({
            'asset_id': asset_id,
            'symbol': symbol,
            'amount': amount,
            'type': asset_type,
            'buy_price': buy_price,
            'current_price': price,
            'value_usd': asset_value,
            'pnl_usd': asset_pnl
        })
        
    return total_value, total_pnl, breakdown

def load_snapshot(total_value, total_pnl, breakdown):
    """Load the daily snapshot into the history table, updating if today's entry exists."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    today = datetime.now().strftime('%Y-%m-%d')
    details_json = json.dumps(breakdown)
    
    # Using INSERT OR REPLACE (Upsert) to handle duplicates
    cursor.execute(
        "INSERT OR REPLACE INTO daily_history (snapshot_date, total_usd_value, total_pnl_usd, details) VALUES (?, ?, ?, ?)",
        (today, total_value, total_pnl, details_json)
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
    total_value, total_pnl, breakdown = transform_data(holdings, crypto_prices, stock_prices)
    print(f"Transformed data. Total Portfolio Value: ${total_value:,.2f} (PnL: ${total_pnl:,.2f})")
    
    # 3. Load
    load_snapshot(total_value, total_pnl, breakdown)
    print("Successfully loaded snapshot into history table.")
    print("ETL process complete.")

if __name__ == "__main__":
    run_etl()
