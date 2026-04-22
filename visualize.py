import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

DB_PATH = 'portfolio.db'

def plot_portfolio_history():
    conn = sqlite3.connect(DB_PATH)
    query = "SELECT timestamp, total_usd_value, total_pnl_usd FROM daily_history ORDER BY timestamp ASC"
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    if df.empty:
        print("No data found in daily_history.")
        return

    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Plotting Total Value and PnL
    fig, ax1 = plt.subplots(figsize=(12, 6))

    color_value = '#00aaff'
    ax1.set_xlabel('Date')
    ax1.set_ylabel('Total Value (USD)', color=color_value)
    ax1.plot(df['timestamp'], df['total_usd_value'], marker='o', linestyle='-', color=color_value, linewidth=2, label='Total Value')
    ax1.tick_params(axis='y', labelcolor=color_value)
    ax1.fill_between(df['timestamp'], df['total_usd_value'], color=color_value, alpha=0.1)

    ax2 = ax1.twinx()  # instantiate a second axes that shares the same x-axis
    color_pnl = '#2ecc71' # Green for profit
    ax2.set_ylabel('Total PnL (USD)', color=color_pnl)
    ax2.plot(df['timestamp'], df['total_pnl_usd'], marker='x', linestyle='--', color=color_pnl, linewidth=1.5, label='Total PnL')
    ax2.tick_params(axis='y', labelcolor=color_pnl)
    
    # Add a zero line for PnL
    ax2.axhline(0, color='red', linewidth=0.8, linestyle=':', alpha=0.5)

    plt.title('Portfolio Value & PnL Over Time', fontsize=16, fontweight='bold', pad=20)
    fig.tight_layout()
    
    filename = 'portfolio_pnl_growth.png'
    plt.savefig(filename)
    print(f"Graph saved as {filename}")

if __name__ == "__main__":
    plot_portfolio_history()
