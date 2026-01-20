"use client";

import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    Brush,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
    t: number;
    p: number;
}

interface Poll {
    date: string;
    firm: string;
    description: string;
}

interface SingleChartProps {
    mode: "single";
    data: DataPoint[];
    question: string;
    polls?: Poll[];
}

interface MultiChartProps {
    mode: "multi";
    datasets: { id: string; name: string; data: DataPoint[] }[];
    polls?: Poll[];
}

type ChartProps = SingleChartProps | MultiChartProps;

const COLORS = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-lg text-sm">
                <p className="text-slate-300 mb-2 border-b border-slate-700 pb-1">
                    {format(new Date(label * 1000), "MMM d, HH:mm")}
                </p>
                {payload.length === 1 ? (
                    <p className="text-emerald-400 font-bold text-lg">
                        {(payload[0].value * 100).toFixed(1)}%
                    </p>
                ) : (
                    <div className="space-y-1 max-h-60 overflow-auto custom-scrollbar">
                        {payload.sort((a: any, b: any) => b.value - a.value).map((entry: any, idx: number) => (
                            <div key={idx} className="flex justify-between gap-4">
                                <span style={{ color: entry.color }} className="truncate max-w-[150px]">{entry.name}</span>
                                <span className="font-mono" style={{ color: entry.color }}>{(entry.value * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export default function ChartComponents(props: ChartProps) {
    const electionTimestamp = new Date("2026-01-18T00:00:00Z").getTime() / 1000;

    if (props.mode === "single") {
        const { data, question } = props;

        if (!data || data.length === 0) {
            return (
                <div className="w-full h-[600px] bg-slate-900 rounded-xl p-4 border border-slate-800 flex items-center justify-center">
                    <span className="text-slate-500">No data available</span>
                </div>
            );
        }

        const minPrice = Math.min(...data.map((d) => d.p));
        const maxPrice = Math.max(...data.map((d) => d.p));

        return (
            <div className="w-full bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl">
                <h2 className="text-xl font-bold text-slate-100 mb-4 truncate" title={question}>
                    {question}
                </h2>
                <LineChart width={900} height={500} data={data}>
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
                        domain={[Math.max(0, minPrice * 0.8), Math.min(1, maxPrice * 1.2)]}
                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                        stroke="#94a3b8"
                        fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={electionTimestamp} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Election', fill: '#ef4444', fontSize: 12 }} />
                    {props.polls?.map((poll, idx) => {
                        const pollTs = new Date(poll.date).getTime() / 1000;
                        return (
                            <ReferenceLine
                                key={idx}
                                x={pollTs}
                                stroke="#f59e0b"
                                strokeDasharray="3 3"
                                strokeOpacity={0.6}
                                label={{
                                    position: 'insideTopLeft',
                                    value: 'ℹ️',
                                    fontSize: 16,
                                    fill: '#f59e0b',
                                    className: "cursor-pointer"
                                }}
                            />
                        );
                    })}
                    <Line
                        type="monotone"
                        dataKey="p"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        animationDuration={300}
                    />
                    <Brush
                        dataKey="t"
                        height={30}
                        stroke="#334155"
                        fill="#1e293b"
                        tickFormatter={(unixTime) => format(new Date(unixTime * 1000), "d MMM")}
                    />
                </LineChart>
            </div>
        );
    }

    // Multi-chart mode
    const { datasets } = props;

    const mergedData = useMemo(() => {
        const mergedMap = new Map<number, any>();
        datasets.forEach((ds) => {
            ds.data.forEach((point) => {
                if (!mergedMap.has(point.t)) {
                    mergedMap.set(point.t, { t: point.t });
                }
                mergedMap.get(point.t)![ds.id] = point.p;
            });
        });
        return Array.from(mergedMap.values()).sort((a, b) => a.t - b.t);
    }, [datasets]);

    if (mergedData.length === 0) {
        return (
            <div className="w-full h-[600px] bg-slate-900 rounded-xl p-4 border border-slate-800 flex items-center justify-center">
                <span className="text-slate-500">No data available</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4">All Candidates Comparison</h2>
            <LineChart width={1000} height={550} data={mergedData}>
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
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                    formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
                <ReferenceLine x={electionTimestamp} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Election', fill: '#ef4444', fontSize: 12 }} />
                {props.polls?.map((poll, idx) => {
                    const pollTs = new Date(poll.date).getTime() / 1000;
                    return (
                        <ReferenceLine
                            key={idx}
                            x={pollTs}
                            stroke="#f59e0b"
                            strokeDasharray="3 3"
                            strokeOpacity={0.6}
                            label={{
                                position: 'insideTopLeft',
                                value: 'ℹ️',
                                fontSize: 16,
                                fill: '#f59e0b',
                            }}
                        />
                    );
                })}
                {datasets.map((ds, idx) => (
                    <Line
                        key={ds.id}
                        type="monotone"
                        dataKey={ds.id}
                        name={ds.name}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={300}
                        connectNulls
                    />
                ))}
                <Brush
                    dataKey="t"
                    height={30}
                    stroke="#334155"
                    fill="#1e293b"
                    tickFormatter={(unixTime) => format(new Date(unixTime * 1000), "d MMM")}
                />
            </LineChart>
        </div>
    );
}
