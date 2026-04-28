import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, RefreshCw, Wallet, PieChart, Activity, Plus, X
} from 'lucide-react';
import { clsx } from 'clsx';
import AssetList from './Component/AssetList.jsx';
import { formatCurrency } from './Utils.js';


const API_BASE = "http://localhost:9000/api";

function App() {
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellAsset, setSellAsset] = useState(null);
  const [sellAmount, setSellAmount] = useState('');
  const [newAsset, setNewAsset] = useState({
    asset_id: '',
    symbol: '',
    amount: '',
    type: 'crypto',
    buy_price: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [portRes, histRes] = await Promise.all([
        axios.get(`${API_BASE}/portfolio`),
        axios.get(`${API_BASE}/history`)
      ]);
      setPortfolio(portRes.data);
      setHistory(histRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initFetch = async () => {
      // Defer execution to avoid synchronous state updates during the render phase
      await new Promise(resolve => setTimeout(resolve, 0));
      fetchData();
    };
    initFetch();
  }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API_BASE}/etl/run`);
      await fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to sync ETL");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/holdings`, {
        ...newAsset,
        amount: parseFloat(newAsset.amount),
        buy_price: parseFloat(newAsset.buy_price)
      });
      setIsModalOpen(false);
      setNewAsset({ asset_id: '', symbol: '', amount: '', type: 'crypto', buy_price: '' });
      await fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to add asset. Check Asset ID and try again.");
    }
  };

  const handleDeleteAsset = async (assetType, assetId) => {
    if (!window.confirm(`Are you sure you want to delete ${assetId}?`)) return;
    try {
      await axios.delete(`${API_BASE}/holdings/${assetType}/${assetId}`);
      await fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete asset.");
    }
  };

  const handleSellAsset = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/holdings/sell`, {
        asset_id: sellAsset.asset_id,
        type: sellAsset.type,
        amount: parseFloat(sellAmount)
      });
      setIsSellModalOpen(false);
      setSellAmount('');
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to sell asset.");
    }
  };


  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#05070a]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00aaff]"></div>
    </div>
  );

  const pnlPercent = portfolio ? (portfolio.total_pnl / (portfolio.total_value - portfolio.total_pnl)) * 100 : 0;

  return (
    <div className="container animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-white">Portfolio Dashboard</h1>
          <p className="text-[#94a3b8] flex items-center gap-2">
            <Activity size={16} className="text-[#00aaff]" />
            Real-time analytics for your financial assets
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="glass flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-[#00aaff] text-white hover:bg-[#0099ee] transition-all"
          >
            <Plus size={18} />
            Add Asset
          </button>
          <button
            onClick={fetchData}
            className="glass flex items-center gap-2 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-all"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="glass flex items-center gap-2 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <Activity size={18} className={syncing ? "animate-spin text-[#00aaff]" : "text-[#00aaff]"} />
            {syncing ? "Syncing..." : "Run ETL Sync"}
          </button>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-[#00aaff]/10 group-hover:text-[#00aaff]/20 transition-colors">
            <Wallet size={80} />
          </div>
          <h2 className="mb-2">Net Worth</h2>
          <div className="text-4xl font-bold tracking-tight">
            {formatCurrency(portfolio?.total_value || 0)}
          </div>
        </div>

        <div className="glass p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-[#2ecc71]/10 group-hover:text-[#2ecc71]/20 transition-colors">
            {portfolio?.total_pnl >= 0 ? <TrendingUp size={80} /> : <TrendingDown size={80} />}
          </div>
          <h2 className="mb-2">Total Profit/Loss</h2>
          <div className={clsx("text-4xl font-bold tracking-tight", portfolio?.total_pnl >= 0 ? "text-[#2ecc71]" : "text-[#e74c3c]")}>
            {portfolio?.total_pnl >= 0 ? "+" : ""}{formatCurrency(portfolio?.total_pnl || 0)}
          </div>
          <div className="text-sm mt-1 opacity-70">
            {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}% all time
          </div>
        </div>

        <div className="glass p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
            <PieChart size={80} />
          </div>
          <h2 className="mb-2">Active Assets</h2>
          <div className="text-4xl font-bold tracking-tight">
            {portfolio?.assets?.length || 0}
          </div>
          <p className="text-sm text-[#94a3b8] mt-1">Diversified portfolio</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass p-8 mb-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white">Performance Trend</h2>
          <div className="flex gap-4 text-xs font-medium text-[#94a3b8]">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#00aaff]"></div> Value</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#2ecc71]"></div> PnL</span>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00aaff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00aaff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2ecc71" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="snapshot_date"
                stroke="#475569"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
              />
              <YAxis
                stroke="#475569"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="total_usd_value"
                stroke="#00aaff"
                fillOpacity={1}
                fill="url(#colorValue)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="total_pnl_usd"
                stroke="#2ecc71"
                fillOpacity={1}
                fill="url(#colorPnl)"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assets Table */}
      <AssetList portfolio={portfolio} setSellAsset={setSellAsset} setIsSellModalOpen={setIsSellModalOpen} handleDeleteAsset={handleDeleteAsset} />

      {/* Add Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass w-full max-w-md p-8 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-white"
            >
              <X size={24} />
            </button>
            <h2 className="text-white mb-6">Add New Asset</h2>
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1 uppercase">Asset Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['crypto', 'stock'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewAsset({ ...newAsset, type })}
                      className={clsx("py-2 text-sm font-medium rounded-lg border transition-all",
                        newAsset.type === type ? "bg-[#00aaff]/10 border-[#00aaff] text-[#00aaff]" : "bg-white/5 border-white/10 text-[#94a3b8]")}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1 uppercase">
                  {newAsset.type === 'crypto' ? 'CoinGecko ID (e.g. bitcoin)' : 'Ticker (e.g. MSFT)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newAsset.type === 'crypto' ? 'bitcoin' : 'MSFT'}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00aaff]/50"
                  value={newAsset.asset_id}
                  onChange={e => setNewAsset({ ...newAsset, asset_id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1 uppercase">Display Symbol</label>
                <input
                  type="text"
                  required
                  placeholder="BTC"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00aaff]/50"
                  value={newAsset.symbol}
                  onChange={e => setNewAsset({ ...newAsset, symbol: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1 uppercase">Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00aaff]/50"
                    value={newAsset.amount}
                    onChange={e => setNewAsset({ ...newAsset, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1 uppercase">Buy Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00aaff]/50"
                    value={newAsset.buy_price}
                    onChange={e => setNewAsset({ ...newAsset, buy_price: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#00aaff] text-white font-bold py-4 rounded-lg mt-4 hover:bg-[#0099ee] shadow-lg shadow-[#00aaff]/20 transition-all"
              >
                Save Asset
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sell Asset Modal */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass w-full max-w-md p-8 relative">
            <button
              onClick={() => setIsSellModalOpen(false)}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-white"
            >
              <X size={24} />
            </button>
            <h2 className="text-white mb-2">Sell {sellAsset?.symbol}</h2>
            <p className="text-[#94a3b8] mb-6 text-sm">
              Current Balance: <span className="text-white font-bold">{sellAsset?.amount} {sellAsset?.symbol}</span>
            </p>
            <form onSubmit={handleSellAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1 uppercase">Amount to Sell</label>
                <input
                  type="number"
                  step="any"
                  required
                  max={sellAsset?.amount}
                  placeholder="0.0"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00aaff]/50"
                  value={sellAmount}
                  onChange={e => setSellAmount(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#e74c3c] text-white font-bold py-4 rounded-lg mt-4 hover:bg-[#c0392b] shadow-lg shadow-[#e74c3c]/20 transition-all"
              >
                Confirm Sale
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
