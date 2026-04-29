import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, Filter, TrendingUp, BarChart3, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const API_BASE = "http://localhost:9000/api";

function Discovery() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("SP500");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/market/rankings`, {
          params: { index: filter, limit: 1000 } // Fetch all by using a high limit
        });
        setStocks(res.data);
      } catch (err) {
        console.error("Error fetching market rankings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [filter]);

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container animate-fade-in py-10">
      <header className="mb-10">
        <h1 className="text-white mb-2">Market Explorer</h1>
        <p className="text-[#94a3b8]">Explore and rank stocks by their fundamental Health Score across major indices.</p>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-6 mb-10 items-center justify-between">
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 w-full md:w-auto">
          {["SP500", "NASDAQ100", "DOW"].map(idx => (
            <button
              key={idx}
              onClick={() => setFilter(idx)}
              className={clsx("px-6 py-2 rounded-lg text-sm font-bold transition-all",
                filter === idx ? "bg-[#00aaff] text-white shadow-lg shadow-[#00aaff]/20" : "text-[#94a3b8] hover:text-white"
              )}
            >
              {idx}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
          <input
            type="text"
            placeholder="Search symbol or company name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-[#00aaff]/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00aaff]"></div>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4 text-center">Health Score</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStocks.map((stock, i) => (
                  <tr key={stock.symbol} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5 font-mono text-[#94a3b8]">{i + 1}</td>
                    <td className="px-6 py-5">
                      <div>
                        <div className="font-bold text-white group-hover:text-[#00aaff] transition-colors">{stock.symbol}</div>
                        <div className="text-xs text-[#94a3b8] truncate max-w-[200px]">{stock.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-1">
                        <div className={clsx("text-lg font-bold",
                          stock.score >= 80 ? "text-[#2ecc71]" : stock.score >= 50 ? "text-[#00aaff]" : "text-[#e74c3c]"
                        )}>
                          {stock.score}
                        </div>
                        <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={clsx("h-full transition-all duration-1000", 
                              stock.score >= 80 ? "bg-[#2ecc71]" : stock.score >= 50 ? "bg-[#00aaff]" : "bg-[#e74c3c]"
                            )} 
                            style={{ width: `${stock.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#94a3b8]">
                      {new Date(stock.last_updated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link 
                        to={`/asset/stock/${stock.symbol}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#00aaff] hover:underline"
                      >
                        Deep Dive <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStocks.length === 0 && (
            <div className="py-20 text-center text-[#94a3b8]">
              No stocks found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Discovery;
