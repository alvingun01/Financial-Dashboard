import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

DB_PATH = 'portfolio.db'

def plot_portfolio_history():
    conn = sqlite3.connect(DB_PATH)
    query = "SELECT timestamp, total_usd_value FROM daily_history ORDER BY timestamp ASC"
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    if df.empty:
        print("No data found in daily_history.")
        return

    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Plotting
    plt.figure(figsize=(12, 6))
    plt.plot(df['timestamp'], df['total_usd_value'], marker='o', linestyle='-', color='#00aaff', linewidth=2)
    plt.fill_between(df['timestamp'], df['total_usd_value'], color='#00aaff', alpha=0.2)
    
    plt.title('Portfolio Growth Over Time', fontsize=16, fontweight='bold', pad=20)
    plt.xlabel('Date', fontsize=12)
    plt.ylabel('Total Value (USD)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    filename = 'portfolio_growth.png'
    plt.savefig(filename)
    print(f"Graph saved as {filename}")

if __name__ == "__main__":
    plot_portfolio_history()
