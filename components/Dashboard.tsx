"use client";

import { useState, useEffect, useMemo } from "react";
import MarketChart from "./MarketChart";

interface Market {
    id: string;
    question: string;
    points: number;
    volume: string;
}

interface DataPoint {
    t: number;
    p: number;
}

export default function Dashboard({ summary }: { summary: Market[] }) {
    // Sort summary by volume descending
    const sortedSummary = useMemo(() => {
        return [...summary].filter(m => m.points > 0).sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));
    }, [summary]);

    const [selectedId, setSelectedId] = useState<string>(sortedSummary[0]?.id || "");
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedId) {
            setLoading(true);
            fetch(`/polymarket_explorer/data/history_${selectedId}.json`)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch");
                    return res.json();
                })
                .then((data) => {
                    setChartData(data.history || []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                    setChartData([]);
                });
        }
    }, [selectedId]);

    const selectedMarket = sortedSummary.find((m) => m.id === selectedId);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200">
            {/* Sidebar List */}
            <div className="w-1/4 min-w-[300px] border-r border-slate-800 overflow-y-auto p-4 custom-scrollbar">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6">
                    Market Scanner
                </h1>
                <div className="space-y-2">
                    {sortedSummary.map((market) => (
                        <button
                            key={market.id}
                            onClick={() => setSelectedId(market.id)}
                            className={`w-full text-left p-3 rounded-lg transition-all duration-200 border ${selectedId === market.id
                                ? "bg-slate-800 border-blue-500 text-white shadow-md shadow-blue-900/20"
                                : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                }`}
                        >
                            <div className="text-sm font-medium line-clamp-2">{market.question}</div>
                            <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                <span>Vol: ${parseInt(market.volume).toLocaleString()}</span>
                                <span className={market.points > 0 ? "text-emerald-500" : "text-red-500"}>
                                    {market.points > 0 ? "Data Ready" : "No Data"}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {selectedMarket ? (
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">{selectedMarket.question}</h2>
                                <p className="text-slate-400">
                                    Market ID: <span className="font-mono text-slate-300">{selectedMarket.id}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Total Volume</p>
                                <p className="text-2xl font-mono text-emerald-400">${parseInt(selectedMarket.volume).toLocaleString()}</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-[500px] flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse">
                                <span className="text-slate-500">Loading market data...</span>
                            </div>
                        ) : (
                            <>
                                {chartData.length > 0 ? (
                                    <MarketChart data={chartData} question={selectedMarket.question} />
                                ) : (
                                    <div className="h-[500px] flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
                                        <span className="text-slate-500">No chart data available</span>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                                <h3 className="text-lg font-semibold text-slate-200 mb-4">Investiation Notes</h3>
                                <ul className="list-disc list-inside text-slate-400 space-y-2 text-sm">
                                    <li>Look for sharp vertical moves before Jan 16 (Polls).</li>
                                    <li>Check for sustained accumulation (steady rise).</li>
                                    <li>This chart has {chartData.length} minute-level data points.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        Select a market to investigate
                    </div>
                )}
            </div>
        </div>
    );
}
