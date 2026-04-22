-- Populate holdings with mixed assets and cost basis (buy_price)
-- Cryptos
INSERT OR REPLACE INTO holdings (asset_id, symbol, amount, type, buy_price) VALUES ('bitcoin', 'BTC', 0.5, 'crypto', 45000.0);
INSERT OR REPLACE INTO holdings (asset_id, symbol, amount, type, buy_price) VALUES ('ethereum', 'ETH', 5.0, 'crypto', 2200.0);
INSERT OR REPLACE INTO holdings (asset_id, symbol, amount, type, buy_price) VALUES ('solana', 'SOL', 100.0, 'crypto', 80.0);

-- Stocks
INSERT OR REPLACE INTO holdings (asset_id, symbol, amount, type, buy_price) VALUES ('AAPL', 'AAPL', 10.0, 'stock', 150.0);
INSERT OR REPLACE INTO holdings (asset_id, symbol, amount, type, buy_price) VALUES ('TSLA', 'TSLA', 20.0, 'stock', 180.0);
INSERT OR REPLACE INTO holdings (asset_id, symbol, amount, type, buy_price) VALUES ('NVDA', 'NVDA', 50.0, 'stock', 400.0);
INSERT OR REPLACE INTO holdings (asset_id, symbol, amount, type, buy_price) VALUES ('MSFT', 'MSFT', 15.0, 'stock', 300.0);
