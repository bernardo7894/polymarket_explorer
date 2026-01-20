"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Brush,
    Legend,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
    t: number;
    p: number;
}

interface ChartProps {
    data: DataPoint[];
    question: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 p-4 rounded shadow-lg">
                <p className="text-slate-300 mb-2">
                    {format(new Date(label * 1000), "PPpp")}
                </p>
                <p className="text-emerald-400 font-bold text-lg">
                    {(payload[0].value * 100).toFixed(1)}%
                </p>
            </div>
        );
    }
    return null;
};

export default function MarketChart({ data, question }: ChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[600px] bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl flex items-center justify-center">
                <span className="text-slate-500">No data available</span>
            </div>
        );
    }

    // Find min and max price to adjust Y-axis
    const minPrice = Math.min(...data.map((d) => d.p));
    const maxPrice = Math.max(...data.map((d) => d.p));

    // Election date mark (Example: Jan 18 2026)
    const electionTimestamp = new Date("2026-01-18T00:00:00Z").getTime() / 1000;

    return (
        <div className="w-full h-[600px] bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4 truncate" title={question}>
                {question}
            </h2>
            <ResponsiveContainer width="100%" height="90%" minWidth={300} minHeight={400}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="t"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(unixTime) => format(new Date(unixTime * 1000), "d MMM")}
                        stroke="#94a3b8"
                        fontSize={12}
                    />
                    <YAxis
                        domain={[Math.max(0, minPrice * 0.9), Math.min(1, maxPrice * 1.1)]}
                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                        stroke="#94a3b8"
                        fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={electionTimestamp} stroke="#ef4444" label="Election" strokeDasharray="3 3" />
                    <Line
                        type="monotone"
                        dataKey="p"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        animationDuration={500}
                    />
                    <Brush
                        dataKey="t"
                        height={30}
                        stroke="#334155"
                        tickFormatter={(unixTime) => format(new Date(unixTime * 1000), "d MMM")}
                        fill="#1e293b"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// Colors for multi-line chart
const COLORS = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
];

interface MultiChartProps {
    datasets: { id: string; name: string; data: DataPoint[] }[];
}

const MultiTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 p-4 rounded shadow-lg max-h-80 overflow-auto">
                <p className="text-slate-300 mb-2 font-semibold border-b border-slate-700 pb-2">
                    {format(new Date(label * 1000), "PPpp")}
                </p>
                <div className="space-y-1">
                    {payload.sort((a: any, b: any) => b.value - a.value).map((entry: any, idx: number) => (
                        <div key={idx} className="flex justify-between gap-4 text-sm">
                            <span style={{ color: entry.color }} className="truncate max-w-[200px]">{entry.name}</span>
                            <span className="font-mono" style={{ color: entry.color }}>{(entry.value * 100).toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export function MultiMarketChart({ datasets }: MultiChartProps) {
    if (!datasets || datasets.length === 0) {
        return (
            <div className="w-full h-[700px] bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl flex items-center justify-center">
                <span className="text-slate-500">No data available. Try lowering volume threshold.</span>
            </div>
        );
    }

    // Merge all data points by timestamp
    const mergedMap = new Map<number, any>();
    datasets.forEach((ds) => {
        ds.data.forEach((point) => {
            if (!mergedMap.has(point.t)) {
                mergedMap.set(point.t, { t: point.t });
            }
            mergedMap.get(point.t)![ds.id] = point.p;
        });
    });

    const mergedData = Array.from(mergedMap.values()).sort((a, b) => a.t - b.t);

    const electionTimestamp = new Date("2026-01-18T00:00:00Z").getTime() / 1000;

    return (
        <div className="w-full h-[700px] bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4">All Candidates Comparison</h2>
            <ResponsiveContainer width="100%" height="90%" minWidth={300} minHeight={500}>
                <LineChart data={mergedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="t"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(unixTime) => format(new Date(unixTime * 1000), "d MMM HH:mm")}
                        stroke="#94a3b8"
                        fontSize={11}
                    />
                    <YAxis
                        domain={[0, 'auto']}
                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                        stroke="#94a3b8"
                        fontSize={12}
                    />
                    <Tooltip content={<MultiTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: 10 }}
                        formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                    />
                    <ReferenceLine x={electionTimestamp} stroke="#ef4444" label="Election" strokeDasharray="3 3" />
                    {datasets.map((ds, idx) => (
                        <Line
                            key={ds.id}
                            type="monotone"
                            dataKey={ds.id}
                            name={ds.name}
                            stroke={COLORS[idx % COLORS.length]}
                            strokeWidth={2}
                            dot={false}
                            animationDuration={500}
                        />
                    ))}
                    <Brush
                        dataKey="t"
                        height={30}
                        stroke="#334155"
                        tickFormatter={(unixTime) => format(new Date(unixTime * 1000), "d MMM")}
                        fill="#1e293b"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
