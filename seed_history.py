import sqlite3
from datetime import datetime, timedelta
import random
import json

DB_PATH = 'portfolio.db'

def seed_mock_history():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get actual cost basis from holdings to ensure continuity
    cursor.execute("SELECT SUM(amount * buy_price) FROM holdings")
    actual_cost_basis = cursor.fetchone()[0] or 0.0
    
    # Clear existing history for a clean demo graph
    cursor.execute("DELETE FROM daily_history")
    
    # Start the simulation relative to the actual cost basis
    base_value = actual_cost_basis * 1.1 # Start 10% up
    now = datetime.now()
    
    print(f"Seeding 30 days of history using actual cost basis: ${actual_cost_basis:,.2f}")
    
    for i in range(30, 0, -1):
        date_obj = now - timedelta(days=i)
        snapshot_date = date_obj.strftime('%Y-%m-%d')
        timestamp = date_obj.strftime('%Y-%m-%d %H:%M:%S')
        
        # Simulate some random growth/decrease
        change = random.uniform(-800, 1200)
        base_value += change
        
        # Calculate PnL based on the REAL cost basis
        total_pnl = base_value - actual_cost_basis
        
        cursor.execute(
            """INSERT INTO daily_history (snapshot_date, timestamp, total_usd_value, total_pnl_usd, details) 
               VALUES (?, ?, ?, ?, ?)""",
            (snapshot_date, timestamp, base_value, total_pnl, "{}")
        )
    
    conn.commit()
    conn.close()
    print("Success: Seeded 30 days of history with consistent PnL data.")

if __name__ == "__main__":
    seed_mock_history()
