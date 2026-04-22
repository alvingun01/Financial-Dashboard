-- holdings table: stores mock crypto and stock holdings
CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT NOT NULL,         -- CoinGecko ID ('bitcoin') or Ticker ('AAPL')
    symbol TEXT NOT NULL,           -- Ticker (e.g., 'BTC' or 'AAPL')
    amount REAL NOT NULL,           -- Quantity held
    type TEXT NOT NULL,             -- 'crypto' or 'stock'
    buy_price REAL NOT NULL DEFAULT 0.0, -- Average purchase price
    UNIQUE(asset_id, type)
);

-- daily_history table: stores snapshots of portfolio value
CREATE TABLE IF NOT EXISTS daily_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_date DATE UNIQUE NOT NULL, -- Ensure only one entry per day
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_usd_value REAL NOT NULL,
    total_pnl_usd REAL NOT NULL DEFAULT 0.0, -- Total Profit/Loss in USD
    details TEXT NOT NULL           -- JSON string containing breakdown per asset
);
