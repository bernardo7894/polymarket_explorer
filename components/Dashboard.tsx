"use client";

import { useState, useEffect, useMemo } from "react";
import MarketChart, { MultiMarketChart } from "./MarketChart";

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

// Determine base path: empty for local dev, /polymarket_explorer for GitHub Pages
const BASE_PATH = typeof window !== 'undefined' && window.location.hostname.includes('github.io')
    ? '/polymarket_explorer'
    : '';

export default function Dashboard({ summary }: { summary: Market[] }) {
    const [volumeThreshold, setVolumeThreshold] = useState(100000); // $100k minimum volume
    const [viewMode, setViewMode] = useState<'individual' | 'overlay'>('individual');

    // Sort and filter summary by volume descending
    const sortedSummary = useMemo(() => {
        return [...summary]
            .filter(m => m.points > 0 && parseFloat(m.volume) >= volumeThreshold)
            .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));
    }, [summary, volumeThreshold]);

    const [selectedId, setSelectedId] = useState<string>("");
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(false);

    // For overlay mode: load all charts
    const [allChartData, setAllChartData] = useState<{ id: string; name: string; data: DataPoint[] }[]>([]);
    const [overlayLoading, setOverlayLoading] = useState(false);

    // Set initial selection when data changes
    useEffect(() => {
        if (sortedSummary.length > 0 && !sortedSummary.find(m => m.id === selectedId)) {
            setSelectedId(sortedSummary[0].id);
        }
    }, [sortedSummary, selectedId]);

    // Fetch individual chart data
    useEffect(() => {
        if (selectedId && viewMode === 'individual') {
            setLoading(true);
            fetch(`${BASE_PATH}/data/history_${selectedId}.json`)
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
    }, [selectedId, viewMode]);

    // Fetch all data for overlay mode
    useEffect(() => {
        if (viewMode === 'overlay' && sortedSummary.length > 0) {
            setOverlayLoading(true);
            const fetchPromises = sortedSummary.slice(0, 10).map(market => // Limit to top 10
                fetch(`${BASE_PATH}/data/history_${market.id}.json`)
                    .then(res => res.ok ? res.json() : { history: [] })
                    .then(data => ({
                        id: market.id,
                        name: market.question.replace(/Will |win the 2026 Portugal presidential election\?/g, '').trim(),
                        data: data.history || []
                    }))
                    .catch(() => ({ id: market.id, name: market.question, data: [] }))
            );

            Promise.all(fetchPromises).then(results => {
                setAllChartData(results.filter(r => r.data.length > 0));
                setOverlayLoading(false);
            });
        }
    }, [viewMode, sortedSummary]);

    const selectedMarket = sortedSummary.find((m) => m.id === selectedId);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200">
            {/* Sidebar List */}
            <div className="w-1/4 min-w-[320px] border-r border-slate-800 overflow-y-auto p-4 custom-scrollbar flex flex-col">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
                    Market Scanner
                </h1>

                {/* Controls */}
                <div className="mb-4 space-y-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Minimum Volume</label>
                        <select
                            value={volumeThreshold}
                            onChange={(e) => setVolumeThreshold(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={0}>Show All</option>
                            <option value={100000}>$100k+</option>
                            <option value={500000}>$500k+</option>
                            <option value={1000000}>$1M+</option>
                            <option value={5000000}>$5M+</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">View Mode</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('individual')}
                                className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${viewMode === 'individual'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                Individual
                            </button>
                            <button
                                onClick={() => setViewMode('overlay')}
                                className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${viewMode === 'overlay'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                Overlay
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-slate-500 mb-2">Showing {sortedSummary.length} markets</p>

                <div className="space-y-2 flex-1 overflow-y-auto">
                    {sortedSummary.map((market) => (
                        <button
                            key={market.id}
                            onClick={() => { setSelectedId(market.id); setViewMode('individual'); }}
                            className={`w-full text-left p-3 rounded-lg transition-all duration-200 border ${selectedId === market.id && viewMode === 'individual'
                                    ? "bg-slate-800 border-blue-500 text-white shadow-md shadow-blue-900/20"
                                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                }`}
                        >
                            <div className="text-sm font-medium line-clamp-2">{market.question}</div>
                            <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                <span className="font-mono">Vol: ${(parseFloat(market.volume)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <span className="text-emerald-500">{market.points.toLocaleString()} pts</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {viewMode === 'overlay' ? (
                    <div className="max-w-6xl mx-auto space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">All Candidates Overlay</h2>
                            <p className="text-slate-400">Comparing top {allChartData.length} candidates by volume. Use the slider to zoom.</p>
                        </div>
                        {overlayLoading ? (
                            <div className="h-[700px] flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse">
                                <span className="text-slate-500">Loading all market data...</span>
                            </div>
                        ) : (
                            <MultiMarketChart datasets={allChartData} />
                        )}
                    </div>
                ) : selectedMarket ? (
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
                                <p className="text-2xl font-mono text-emerald-400">${parseFloat(selectedMarket.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-[600px] flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse">
                                <span className="text-slate-500">Loading market data...</span>
                            </div>
                        ) : (
                            <MarketChart data={chartData} question={selectedMarket.question} />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                                <h3 className="text-lg font-semibold text-slate-200 mb-4">Investigation Notes</h3>
                                <ul className="list-disc list-inside text-slate-400 space-y-2 text-sm">
                                    <li>Look for sharp vertical moves before Jan 16 (Polls).</li>
                                    <li>Check for sustained accumulation (steady rise).</li>
                                    <li>This chart has <span className="font-mono text-emerald-400">{chartData.length.toLocaleString()}</span> minute-level data points.</li>
                                    <li>Use the brush below the chart to zoom into timeframes.</li>
                                </ul>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                                <h3 className="text-lg font-semibold text-slate-200 mb-4">Key Dates</h3>
                                <ul className="text-slate-400 space-y-2 text-sm">
                                    <li><span className="text-slate-300 font-semibold">Jan 16:</span> Final polls released</li>
                                    <li><span className="text-slate-300 font-semibold">Jan 18:</span> Election Day (1st Round)</li>
                                    <li><span className="text-slate-300 font-semibold">Feb 8:</span> Runoff (if needed)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        {sortedSummary.length === 0 ? "No markets with enough volume. Lower threshold." : "Select a market to investigate"}
                    </div>
                )}
            </div>
        </div>
    );
}
