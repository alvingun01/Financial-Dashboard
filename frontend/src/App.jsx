import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, RefreshCw, Wallet, PieChart, Activity, ExternalLink 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const API_BASE = "http://localhost:8000/api";

function App() {
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API_BASE}/etl/run`);
      await fetchData();
    } catch (error) {
      alert("Failed to sync ETL");
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

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
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="glass flex items-center gap-2 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync ETL Data"}
        </button>
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
                  <stop offset="5%" stopColor="#00aaff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00aaff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2ecc71" stopOpacity={0}/>
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
                tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
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
      <div className="glass overflow-hidden mb-10">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-white">Your Assets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4 text-right">Holdings</th>
                <th className="px-6 py-4 text-right">Avg Price</th>
                <th className="px-6 py-4 text-right">Market Price</th>
                <th className="px-6 py-4 text-right">Total Value</th>
                <th className="px-6 py-4 text-right">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {portfolio?.assets?.map((asset, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", 
                        asset.type === 'crypto' ? "bg-orange-500/20 text-orange-500" : "bg-blue-500/20 text-blue-500")}>
                        {asset.symbol[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{asset.symbol}</div>
                        <div className="text-xs text-[#94a3b8] capitalize">{asset.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-medium">{asset.amount}</td>
                  <td className="px-6 py-5 text-right text-[#94a3b8]">{formatCurrency(asset.buy_price)}</td>
                  <td className="px-6 py-5 text-right font-medium">{formatCurrency(asset.current_price)}</td>
                  <td className="px-6 py-5 text-right font-bold">{formatCurrency(asset.value_usd)}</td>
                  <td className={clsx("px-6 py-5 text-right font-bold", asset.pnl_usd >= 0 ? "text-[#2ecc71]" : "text-[#e74c3c]")}>
                    {asset.pnl_usd >= 0 ? "+" : ""}{formatCurrency(asset.pnl_usd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default App;
