import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    ReferenceArea,
} from "recharts";
import { format } from "date-fns";

// ... (interfaces remain the same: DataPoint, Poll, SingleChartProps, MultiChartProps, ChartProps)
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
    // ... (same as before)
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

    // Zoom state
    const [left, setLeft] = useState<string | number | null>("dataMin");
    const [right, setRight] = useState<string | number | null>("dataMax");
    const [refAreaLeft, setRefAreaLeft] = useState<string | number | null>(null);
    const [refAreaRight, setRefAreaRight] = useState<string | number | null>(null);

    const zoom = () => {
        if (refAreaLeft === refAreaRight || refAreaRight === null) {
            setRefAreaLeft(null);
            setRefAreaRight(null);
            return;
        }

        // Ensure left is smaller than right
        let l = refAreaLeft;
        let r = refAreaRight;
        if ((l as number) > (r as number)) [l, r] = [r, l];

        setRefAreaLeft(null);
        setRefAreaRight(null);
        setLeft(l);
        setRight(r);
    };

    const zoomOut = () => {
        setLeft("dataMin");
        setRight("dataMax");
    };

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
            <div className="w-full bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl select-none">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-100 truncate flex-1" title={question}>
                        {question}
                    </h2>
                    <button
                        onClick={zoomOut}
                        disabled={left === "dataMin" && right === "dataMax"}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${left !== "dataMin" || right !== "dataMax"
                            ? "bg-blue-600 text-white hover:bg-blue-500"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                            }`}
                    >
                        Reset Zoom
                    </button>
                    <span className="text-xs text-slate-500 ml-3">Drag to zoom</span>
                </div>
                <LineChart
                    width={900}
                    height={500}
                    data={data}
                    onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel as string)}
                    onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel as string)}
                    onMouseUp={zoom}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="t"
                        type="number"
                        domain={[left || 'dataMin', right || 'dataMax']}
                        tickFormatter={(unixTime) => format(new Date(unixTime * 1000), "d MMM")}
                        stroke="#94a3b8"
                        fontSize={12}
                        allowDataOverflow
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
                        // Only render if within current domain (optional optimization, but simple check)
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

                    {/* Selection Area */}
                    {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#3b82f6" fillOpacity={0.3} />
                    ) : null}

                    <Line
                        type="monotone"
                        dataKey="p"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        animationDuration={left === "dataMin" ? 300 : 0}
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
        <div className="w-full bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl select-none">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-100">All Candidates Comparison</h2>
                <button
                    onClick={zoomOut}
                    disabled={left === "dataMin" && right === "dataMax"}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${left !== "dataMin" || right !== "dataMax"
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        }`}
                >
                    Reset Zoom
                </button>
                <span className="text-xs text-slate-500 ml-3">Drag to zoom</span>
            </div>
            <LineChart
                width={1000}
                height={550}
                data={mergedData}
                onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel as string)}
                onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel as string)}
                onMouseUp={zoom}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                    dataKey="t"
                    type="number"
                    domain={[left || 'dataMin', right || 'dataMax']}
                    tickFormatter={(unixTime) => format(new Date(unixTime * 1000), "d MMM HH:mm")}
                    stroke="#94a3b8"
                    fontSize={11}
                    allowDataOverflow
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

                {/* Selection Area */}
                {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#3b82f6" fillOpacity={0.3} />
                ) : null}

                {datasets.map((ds, idx) => (
                    <Line
                        key={ds.id}
                        type="monotone"
                        dataKey={ds.id}
                        name={ds.name}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={left === "dataMin" ? 300 : 0}
                        connectNulls
                    />
                ))}
            </LineChart>
        </div>
    );
}
