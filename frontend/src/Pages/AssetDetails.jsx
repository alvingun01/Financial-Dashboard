import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart3, 
  PieChart, Activity, ShieldCheck, ExternalLink, Info, CheckCircle2, XCircle 
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatCurrency } from '../Utils.js';

const API_BASE = "http://localhost:9000/api";

function AssetDetails() {
  const { type, id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/holdings/${type}/${id}`);
        setData(res.data);
      } catch (err) {
        setError("Failed to load asset details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [type, id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#05070a]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00aaff]"></div>
    </div>
  );

  if (error || !data) return (
    <div className="container py-20 text-center">
      <h2 className="text-white mb-4">{error || "Asset not found"}</h2>
      <Link to="/" className="text-[#00aaff] hover:underline">Back to Dashboard</Link>
    </div>
  );

  const { info, history, holding } = data;
  const isStock = type === 'stock';

  // Safely find the current price across different data sources
  const safePrice = isStock 
    ? (info.currentPrice || info.regularMarketPrice || (history.length > 0 ? history[history.length - 1].Close : 0))
    : (info.market_data?.current_price?.usd || 0);

  // Helper to calculate points linearly between an ideal and a threshold
  const getLinearPoints = (val, ideal, threshold, maxPoints = 20) => {
    if (val === null || val === undefined) return 0;
    const lowerIsBetter = ideal < threshold;
    
    if (lowerIsBetter) {
      if (val <= ideal) return maxPoints;
      if (val >= threshold) return 0;
      return Math.round(maxPoints * (1 - (val - ideal) / (threshold - ideal)));
    } else {
      if (val >= ideal) return maxPoints;
      if (val <= threshold) return 0;
      return Math.round(maxPoints * (1 - (ideal - val) / (ideal - threshold)));
    }
  };

  // Calculate a "Fundamental Score" with a detailed linear breakdown
  const calculateScore = () => {
    if (!isStock) {
        const mcapFdv = info.market_data?.market_cap?.usd / info.market_data?.fully_diluted_valuation?.usd;
        const checks = [
            { label: "Token Dilution", points: getLinearPoints(mcapFdv, 1.0, 0.5, 40) },
            { label: "Momentum", points: getLinearPoints(info.market_data?.price_change_percentage_24h, 10, -10, 30) },
            { label: "Liquidity", points: getLinearPoints(info.market_data?.total_volume?.usd / info.market_data?.market_cap?.usd, 0.1, 0.01, 30) }
        ];
        const total = checks.reduce((sum, c) => sum + c.points, 0);
        return { total, checks };
    }
    
    const checks = [
      { label: "Valuation (P/E)", points: getLinearPoints(info.trailingPE, 10, 30, 20) },
      { label: "Asset Value (P/B)", points: getLinearPoints(info.priceToBook, 1.0, 4.0, 20) },
      { label: "Profitability", points: getLinearPoints(info.profitMargins, 0.25, 0.0, 20) },
      { label: "Growth", points: getLinearPoints(info.revenueGrowth, 0.20, 0.0, 20) },
      { label: "Financial Health", points: getLinearPoints(info.debtToEquity, 0.2, 1.5, 20) },
    ];
    
    const total = checks.reduce((sum, c) => sum + c.points, 0);
    return { total, checks };
  };

  const { total: score, checks: scoreBreakdown } = calculateScore();
  
  const getScoreLabel = (s) => {
    if (s >= 80) return { text: "Strong Buy", color: "text-[#2ecc71]", bg: "bg-[#2ecc71]/10" };
    if (s >= 60) return { text: "Buy", color: "text-[#00aaff]", bg: "bg-[#00aaff]/10" };
    if (s >= 40) return { text: "Neutral", color: "text-[#94a3b8]", bg: "bg-white/5" };
    return { text: "Avoid", color: "text-[#e74c3c]", bg: "bg-[#e74c3c]/10" };
  };
  const label = getScoreLabel(score);

  // Helper to format values (handle large numbers and percentages)
  const formatStat = (val, isPercent = false, isDollar = false) => {
    if (val === null || val === undefined) return "N/A";
    if (isPercent) return `${(val * 100).toFixed(2)}%`;
    if (isDollar) return formatCurrency(val);
    if (typeof val === 'number' && val > 1e12) return `${(val / 1e12).toFixed(2)}T`;
    if (typeof val === 'number' && val > 1e9) return `${(val / 1e9).toFixed(2)}B`;
    return val.toString();
  };

  const statSections = isStock ? [
    {
      title: "Valuation",
      icon: <DollarSign className="text-purple-500" size={18} />,
      stats: [
        { label: "Trailing P/E", value: formatStat(info.trailingPE) },
        { label: "Forward P/E", value: formatStat(info.forwardPE) },
        { label: "Price to Book", value: formatStat(info.priceToBook) },
        { label: "Market Cap", value: formatStat(info.marketCap) },
        { label: "Enterprise Value", value: formatStat(info.enterpriseValue) }
      ]
    },
    {
      title: "Profitability",
      icon: <PieChart className="text-[#2ecc71]" size={18} />,
      stats: [
        { label: "Profit Margin", value: formatStat(info.profitMargins, true) },
        { label: "Return on Equity", value: formatStat(info.returnOnEquity, true) },
        { label: "Operating Margin", value: formatStat(info.operatingMargins, true) }
      ]
    },
    {
      title: "Growth & Dividends",
      icon: <TrendingUp className="text-[#00aaff]" size={18} />,
      stats: [
        { label: "Revenue Growth", value: formatStat(info.revenueGrowth, true) },
        { label: "Dividend Yield", value: formatStat(info.dividendYield, true) },
        { label: "Payout Ratio", value: formatStat(info.payoutRatio, true) }
      ]
    },
    {
      title: "Financial Health",
      icon: <ShieldCheck className="text-orange-500" size={18} />,
      stats: [
        { label: "Total Cash", value: formatStat(info.totalCash, false, true) },
        { label: "Total Debt", value: formatStat(info.totalDebt, false, true) },
        { label: "Debt to Equity", value: formatStat(info.debtToEquity) }
      ]
    }
  ] : [
    {
      title: "Market Metrics",
      icon: <Activity className="text-orange-500" size={18} />,
      stats: [
        { label: "Market Cap", value: formatStat(info.market_data?.market_cap?.usd, false, true) },
        { label: "FDV", value: formatStat(info.market_data?.fully_diluted_valuation?.usd, false, true) },
        { label: "Circulating Supply", value: formatStat(info.market_data?.circulating_supply) },
        { label: "Max Supply", value: formatStat(info.market_data?.max_supply) }
      ]
    }
  ];

  return (
    <div className="container animate-fade-in py-10 pb-20">
      {/* Navigation */}
      <Link to="/" className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-white mb-8 transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      {/* Hero Header */}
      <div className="glass p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
            {isStock ? (
                <div className="text-3xl font-bold text-[#00aaff]">{id[0]}</div>
            ) : (
                <img src={info.image?.large} alt={info.name} className="w-12 h-12" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">{isStock ? info.longName : info.name}</h1>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-[#94a3b8] tracking-widest">{id.toUpperCase()}</span>
            </div>
            <p className="text-[#94a3b8] flex items-center gap-2">
              {isStock ? info.industry : 'Cryptocurrency'} • {isStock ? info.sector : info.asset_platform_id || 'Blockchain'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-4xl font-bold text-white mb-1">
            {formatCurrency(safePrice)}
          </div>
          <div className={clsx("flex items-center justify-end gap-1 font-semibold", 
            (isStock ? info.regularMarketChangePercent : info.market_data?.price_change_percentage_24h) >= 0 ? "text-[#2ecc71]" : "text-[#e74c3c]"
          )}>
            {(isStock ? info.regularMarketChangePercent : info.market_data?.price_change_percentage_24h) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(isStock ? info.regularMarketChangePercent : info.market_data?.price_change_percentage_24h).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Chart & Summary */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chart Card */}
          <div className="glass p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-white">Price History (30D)</h2>
              <div className="text-xs text-[#94a3b8] uppercase font-bold tracking-widest">Live from {isStock ? 'Yahoo Finance' : 'CoinGecko'}</div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00aaff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00aaff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="Date" 
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
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={isStock ? "Close" : "Close"} 
                    stroke="#00aaff" 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    strokeWidth={3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Description Card */}
          <div className="glass p-8">
            <h2 className="text-white mb-4 flex items-center gap-2">
              <Info size={20} className="text-[#00aaff]" />
              About {isStock ? info.longName : info.name}
            </h2>
            <p className="text-[#94a3b8] leading-relaxed text-sm">
              {isStock ? info.longBusinessSummary : (
                <div dangerouslySetInnerHTML={{ __html: info.description?.en }} />
              )}
            </p>
          </div>
        </div>

        {/* Right Column: Score & Holdings & Fundamentals */}
        <div className="space-y-8">
          {/* Fundamental Score Card */}
          <div className="glass p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-[#00aaff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-white mb-6 text-sm font-bold uppercase tracking-widest">Health Score</h2>
            
            <div className="relative inline-flex items-center justify-center mb-6">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * score) / 100}
                  strokeLinecap="round"
                  className={clsx("transition-all duration-1000", 
                    score >= 80 ? "text-[#2ecc71]" : score >= 50 ? "text-[#00aaff]" : "text-[#e74c3c]"
                  )}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{score}</span>
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-tighter">/ 100</span>
              </div>
            </div>

            <div className={clsx("px-4 py-2 rounded-lg font-bold text-sm inline-block mb-6", label.bg, label.color)}>
              {label.text}
            </div>
            
            <div className="text-left space-y-3 border-t border-white/5 pt-6">
              {scoreBreakdown.map((check, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    {check.points > 0 ? (
                      <CheckCircle2 size={16} className={clsx(
                        check.points >= 15 ? "text-[#2ecc71]" : "text-[#00aaff]"
                      )} />
                    ) : (
                      <XCircle size={16} className="text-[#e74c3c] opacity-50" />
                    )}
                    <span className={clsx("text-xs transition-colors", 
                      check.points > 0 ? "text-white" : "text-[#94a3b8]"
                    )}>
                      {check.label}
                    </span>
                  </div>
                  <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded", 
                    check.points >= 15 ? "bg-[#2ecc71]/10 text-[#2ecc71]" : 
                    check.points > 0 ? "bg-[#00aaff]/10 text-[#00aaff]" : 
                    "bg-white/5 text-[#94a3b8] opacity-50"
                  )}>
                    +{check.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Your Position Card */}
          <div className="glass p-8 relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 text-[#00aaff]/5 group-hover:text-[#00aaff]/10 transition-colors">
                <BarChart3 size={120} />
             </div>
             <h2 className="text-white mb-6">Your Position</h2>
             {holding ? (
               <div className="space-y-6">
                 <div>
                   <div className="text-[#94a3b8] text-xs font-bold uppercase mb-1">Total Value</div>
                   <div className="text-3xl font-bold text-white">
                     {formatCurrency(holding.amount * safePrice)}
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <div className="text-[#94a3b8] text-xs font-bold uppercase mb-1">Avg Cost</div>
                     <div className="text-white font-medium">{formatCurrency(holding.buy_price)}</div>
                   </div>
                   <div>
                     <div className="text-[#94a3b8] text-xs font-bold uppercase mb-1">Holdings</div>
                     <div className="text-white font-medium">{holding.amount} {holding.symbol}</div>
                   </div>
                 </div>
                 <div className={clsx("p-4 rounded-xl border", 
                   (holding.amount * safePrice - holding.amount * holding.buy_price) >= 0 
                   ? "bg-[#2ecc71]/5 border-[#2ecc71]/20" : "bg-[#e74c3c]/5 border-[#e74c3c]/20"
                 )}>
                   <div className="text-xs font-bold uppercase opacity-60 mb-1">Total Profit/Loss</div>
                   <div className={clsx("text-xl font-bold", 
                     (holding.amount * safePrice - holding.amount * holding.buy_price) >= 0 ? "text-[#2ecc71]" : "text-[#e74c3c]"
                   )}>
                     {(holding.amount * safePrice - holding.amount * holding.buy_price) >= 0 ? "+" : ""}
                     {formatCurrency(holding.amount * safePrice - holding.amount * holding.buy_price)}
                   </div>
                 </div>
               </div>
             ) : (
               <div className="text-center py-4">
                 <p className="text-[#94a3b8] text-sm italic">You don't own this asset yet.</p>
               </div>
             )}
          </div>

          {/* Fundamentals Grid */}
          {statSections.map((section, idx) => (
            <div key={idx} className="glass p-6">
              <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                {section.icon}
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.stats.map((stat, sIdx) => (
                  <div key={sIdx} className="flex justify-between items-center group">
                    <span className="text-[#94a3b8] text-sm group-hover:text-white transition-colors">{stat.label}</span>
                    <span className="text-white font-semibold text-sm">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* External Links */}
          <div className="flex gap-4">
            <a 
              href={isStock ? info.website : info.links?.homepage[0]} 
              target="_blank" 
              rel="noreferrer"
              className="flex-1 glass p-4 text-center text-xs font-bold text-[#94a3b8] hover:text-[#00aaff] transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} /> Website
            </a>
            {isStock && (
              <a 
                href={`https://finance.yahoo.com/quote/${id}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 glass p-4 text-center text-xs font-bold text-[#94a3b8] hover:text-[#00aaff] transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={14} /> Yahoo Finance
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetDetails;
