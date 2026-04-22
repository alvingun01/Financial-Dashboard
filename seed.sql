-- Populate holdings with mixed assets
-- Cryptos
INSERT OR IGNORE INTO holdings (asset_id, symbol, amount, type) VALUES ('bitcoin', 'BTC', 0.5, 'crypto');
INSERT OR IGNORE INTO holdings (asset_id, symbol, amount, type) VALUES ('ethereum', 'ETH', 5.0, 'crypto');
INSERT OR IGNORE INTO holdings (asset_id, symbol, amount, type) VALUES ('solana', 'SOL', 100.0, 'crypto');

-- Stocks
INSERT OR IGNORE INTO holdings (asset_id, symbol, amount, type) VALUES ('AAPL', 'AAPL', 10.0, 'stock');
INSERT OR IGNORE INTO holdings (asset_id, symbol, amount, type) VALUES ('TSLA', 'TSLA', 20.0, 'stock');
INSERT OR IGNORE INTO holdings (asset_id, symbol, amount, type) VALUES ('NVDA', 'NVDA', 50.0, 'stock');
INSERT OR IGNORE INTO holdings (asset_id, symbol, amount, type) VALUES ('MSFT', 'MSFT', 15.0, 'stock');
