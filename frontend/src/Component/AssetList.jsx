import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { TrendingDown, X, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../Utils.js';

function AssetList({ portfolio, setSellAsset, setIsSellModalOpen, handleDeleteAsset }) {
    return (
        <>
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
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {portfolio?.assets?.map((asset, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-5">
                                            <Link 
                                                to={`/asset/${asset.type}/${asset.asset_id}`}
                                                className="hover:opacity-70 transition-opacity group flex items-center gap-3"
                                            >
                                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                    asset.type === 'crypto' ? "bg-orange-500/20 text-orange-500" : "bg-blue-500/20 text-blue-500")}>
                                                    {asset.symbol[0]}
                                                </div>
                                                <div>
                                                    <div className="font-semibold flex items-center gap-1">
                                                        {asset.symbol}
                                                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="text-xs text-[#94a3b8] capitalize">{asset.type}</div>
                                                </div>
                                            </Link>
                                    </td>
                                    <td className="px-6 py-5 text-right font-medium">{asset.amount}</td>
                                    <td className="px-6 py-5 text-right text-[#94a3b8]">{formatCurrency(asset.buy_price)}</td>
                                    <td className="px-6 py-5 text-right font-medium">{formatCurrency(asset.current_price)}</td>
                                    <td className="px-6 py-5 text-right font-bold">{formatCurrency(asset.value_usd)}</td>
                                    <td className={clsx("px-6 py-5 text-right font-bold", asset.pnl_usd >= 0 ? "text-[#2ecc71]" : "text-[#e74c3c]")}>
                                        {asset.pnl_usd >= 0 ? "+" : ""}{formatCurrency(asset.pnl_usd)}
                                    </td>
                                    <td className="px-6 py-5 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setSellAsset(asset);
                                                setIsSellModalOpen(true);
                                            }}
                                            className="text-[#94a3b8] hover:text-[#00aaff] transition-colors p-2"
                                            title="Sell Portion"
                                        >
                                            <TrendingDown size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAsset(asset.type, asset.asset_id)}
                                            className="text-[#94a3b8] hover:text-[#e74c3c] transition-colors p-2"
                                            title="Delete Entire Holding"
                                        >
                                            <X size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default AssetList;