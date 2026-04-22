import sqlite3
from datetime import datetime, timedelta
import random

DB_PATH = 'portfolio.db'

def seed_mock_history():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing history for a clean demo graph
    cursor.execute("DELETE FROM daily_history")
    
    base_value = 85000.0
    now = datetime.now()
    
    for i in range(30, -1, -1):
        timestamp = (now - timedelta(days=i)).strftime('%Y-%m-%d %H:%M:%S')
        # Simulate some random growth/decrease
        change = random.uniform(-1000, 1500)
        base_value += change
        
        cursor.execute(
            "INSERT INTO daily_history (timestamp, total_usd_value, details) VALUES (?, ?, ?)",
            (timestamp, base_value, "{}")
        )
    
    conn.commit()
    conn.close()
    print("Seeded 30 days of mock portfolio history.")

if __name__ == "__main__":
    seed_mock_history()
