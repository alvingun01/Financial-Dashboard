-- holdings table: stores mock crypto and stock holdings
CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT NOT NULL,         -- CoinGecko ID ('bitcoin') or Ticker ('AAPL')
    symbol TEXT NOT NULL,           -- Ticker (e.g., 'BTC' or 'AAPL')
    amount REAL NOT NULL,           -- Quantity held
    type TEXT NOT NULL,             -- 'crypto' or 'stock'
    UNIQUE(asset_id, type)
);

-- daily_history table: stores snapshots of portfolio value
CREATE TABLE IF NOT EXISTS daily_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_usd_value REAL NOT NULL,
    details TEXT NOT NULL           -- JSON string containing breakdown per asset
);
