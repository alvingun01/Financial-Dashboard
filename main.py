import yfinance
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
import os
from datetime import datetime
from etl import run_etl
import requests

app = FastAPI(title="Financial Tracker API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = 'portfolio.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/portfolio")
async def get_portfolio():
    """Fetch current portfolio holdings and latest values."""
    conn = get_db_connection()
    try:
        # Get the latest snapshot from history
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM daily_history ORDER BY timestamp DESC LIMIT 1")
        latest = cursor.fetchone()
        
        if not latest:
            return {"status": "empty", "message": "No data found. Please run ETL."}
        
        return {
            "timestamp": latest["timestamp"],
            "total_value": latest["total_usd_value"],
            "total_pnl": latest["total_pnl_usd"],
            "assets": json.loads(latest["details"])
        }
    finally:
        conn.close()

@app.get("/api/history")
async def get_history():
    """Fetch historical data for charts."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT snapshot_date, total_usd_value, total_pnl_usd FROM daily_history ORDER BY snapshot_date ASC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

class Holding(BaseModel):
    asset_id: str
    symbol: str
    amount: float
    type: str  # 'crypto' or 'stock'
    buy_price: float

@app.post("/api/holdings")
async def add_holding(holding: Holding):
    """Add a new asset to the portfolio."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO holdings (asset_id, symbol, amount, type, buy_price) 
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(asset_id, type) DO UPDATE SET
                 buy_price = (holdings.amount * holdings.buy_price + excluded.amount * excluded.buy_price) / (holdings.amount + excluded.amount),
                 amount = holdings.amount + excluded.amount""",
            (holding.asset_id, holding.symbol, holding.amount, holding.type, holding.buy_price)
        )
        conn.commit()
        # Automatically run ETL to update the dashboard values
        run_etl()
        return {"status": "success", "message": f"Added {holding.symbol} to portfolio."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/holdings/{asset_type}/{asset_id}")
async def get_asset_details(asset_type: str, asset_id: str):
    """Fetch full details for an asset, including metadata, history, and current position."""
    try:
        history_data = []
        if asset_type == "stock":
            ticker = yfinance.Ticker(asset_id)
            info = ticker.info
            # Fetch 1 month of history for the chart
            hist = ticker.history(period="1mo").reset_index()
            # Ensure Date is a string for JSON serialization
            if not hist.empty:
                hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%d')
                history_data = hist.to_dict(orient="records")
        else:
            # CoinGecko for Crypto
            url = f"https://api.coingecko.com/api/v3/coins/{asset_id}"
            info = requests.get(url).json()
            # Basic chart data from CoinGecko (30 days)
            chart_url = f"https://api.coingecko.com/api/v3/coins/{asset_id}/market_chart"
            chart_res = requests.get(chart_url, params={'vs_currency': 'usd', 'days': '30', 'interval': 'daily'})
            if chart_res.status_code == 200:
                # Format: [[timestamp, price], ...] -> [{"Date": "...", "Close": ...}, ...]
                prices = chart_res.json().get('prices', [])
                history_data = [
                    {
                        "Date": datetime.fromtimestamp(p[0]/1000).strftime('%Y-%m-%d'),
                        "Close": p[1]
                    } for p in prices
                ]

        # Fetch your specific holding from the database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM holdings WHERE asset_id = ? AND type = ?", (asset_id, asset_type))
        holding = cursor.fetchone()
        conn.close()

        return {
            "info": info,
            "history": history_data,
            "holding": dict(holding) if holding else None
        }
    except Exception as e:
        print(f"Error in get_asset_details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/holdings/{asset_type}/{asset_id}")
async def delete_holding(asset_type: str, asset_id: str):
    """Delete a holding from the portfolio."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM holdings WHERE asset_id = ? AND type = ?", (asset_id, asset_type))
        conn.commit()
        # Automatically run ETL to update the dashboard values
        run_etl()
        return {"status": "success", "message": f"Deleted {asset_id} from portfolio."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

class SellRequest(BaseModel):
    asset_id: str
    type: str
    amount: float

@app.post("/api/holdings/sell")
async def sell_holding(request: SellRequest):
    """Sell a portion of a holding."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Check current amount
        cursor.execute("SELECT amount FROM holdings WHERE asset_id = ? AND type = ?", (request.asset_id, request.type))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        current_amount = row["amount"]
        if request.amount > current_amount:
            raise HTTPException(status_code=400, detail="Insufficient balance to sell")
        
        new_amount = current_amount - request.amount
        
        if new_amount <= 0.00000001: # Handle precision
            cursor.execute("DELETE FROM holdings WHERE asset_id = ? AND type = ?", (request.asset_id, request.type))
        else:
            cursor.execute("UPDATE holdings SET amount = ? WHERE asset_id = ? AND type = ?", (new_amount, request.asset_id, request.type))
        
        conn.commit()
        run_etl()
        return {"status": "success", "message": f"Sold {request.amount} of {request.asset_id}."}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/etl/run")
async def trigger_etl():
    """Manually trigger the ETL process."""
    try:
        run_etl()
        return {"status": "success", "message": "ETL process completed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
