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
    detailLevel?: number;
}

interface MultiChartProps {
    mode: "multi";
    datasets: { id: string; name: string; data: DataPoint[] }[];
    polls?: Poll[];
    detailLevel?: number;
}

type ChartProps = SingleChartProps | MultiChartProps;

const COLORS = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
];

const PollLabel = (props: any) => {
    const { viewBox, poll } = props;
    const { x, y } = viewBox;
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={10} y={20} fontSize={16} fill="#f59e0b" className="cursor-pointer" style={{ pointerEvents: 'all' }}>
                ℹ️
                <title>{`${poll.firm} (${format(new Date(poll.date), "MMM d, HH:mm")}): ${poll.description}`}</title>
            </text>
        </g>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    // ... (same as before)
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-700/50 p-3 rounded shadow-lg text-sm">
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

// Helper to downsample data by visual density (target points in view)
const downsample = (data: any[], left: number | string | null, right: number | string | null, targetPoints: number) => {
    if (!data || data.length === 0) return [];

    // Identify range indices
    const startIdx = typeof left === 'number' ? data.findIndex(d => d.t >= left) : 0;
    const endIdx = typeof right === 'number' ? data.findIndex(d => d.t > right) : data.length;

    const sliceStart = startIdx === -1 ? 0 : startIdx;
    const sliceEnd = endIdx === -1 ? data.length : endIdx;
    const sliceLength = sliceEnd - sliceStart;

    // IF visible points < targetPoints, show all of them (auto-scaling resolution)
    if (sliceLength <= targetPoints) {
        return data.slice(sliceStart, sliceEnd);
    }

    // Otherwise stride to maintain target density
    const stride = Math.ceil(sliceLength / targetPoints);
    const result = [];

    for (let i = sliceStart; i < sliceEnd; i += stride) {
        result.push(data[i]);
    }

    // Always include the last point of the slice to prevent gaps at right edge
    if (sliceLength > 0 && (result.length === 0 || result[result.length - 1] !== data[sliceEnd - 1])) {
        result.push(data[sliceEnd - 1]);
    }

    return result;
};

// Re-use zoom logic hook to avoid duplication
const useChartZoom = (initialLeft: string | number | null = "dataMin", initialRight: string | number | null = "dataMax") => {
    const [left, setLeft] = useState<string | number | null>(initialLeft);
    const [right, setRight] = useState<string | number | null>(initialRight);
    const [refAreaLeft, setRefAreaLeft] = useState<string | number | null>(null);
    const [refAreaRight, setRefAreaRight] = useState<string | number | null>(null);

    const zoom = () => {
        if (refAreaLeft === refAreaRight || refAreaRight === null) {
            setRefAreaLeft(null);
            setRefAreaRight(null);
            return;
        }
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

    return { left, right, refAreaLeft, refAreaRight, setRefAreaLeft, setRefAreaRight, zoom, zoomOut };
};

const SingleChart = (props: SingleChartProps) => {
    const { data, question, polls, detailLevel } = props;
    const { left, right, refAreaLeft, refAreaRight, setRefAreaLeft, setRefAreaRight, zoom, zoomOut } = useChartZoom();

    // Election Day Markers
    const electionDayStart = new Date("2026-01-18T08:00:00Z").getTime() / 1000;
    const electionDayEnd = new Date("2026-01-18T19:00:00Z").getTime() / 1000;

    // Create display data - always call hooks unconditionally
    const displayData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const fullDurationMinutes = (data[data.length - 1].t - data[0].t) / 60;
        const desiredResMinutes = detailLevel || 30;

        const targetVisualPoints = desiredResMinutes <= 1
            ? Infinity
            : Math.ceil(fullDurationMinutes / desiredResMinutes);

        return downsample(data, left, right, targetVisualPoints);
    }, [data, left, right, detailLevel]);

    const infoString = useMemo(() => {
        if (!displayData || displayData.length < 2) return "";
        const avgInterval = (displayData[displayData.length - 1].t - displayData[0].t) / displayData.length;
        const mins = Math.max(1, Math.round(avgInterval / 60));
        return `Showing ${displayData.length} pts (~1pt/${mins}m)`;
    }, [displayData]);

    const range = useMemo(() => {
        if (!data || !data.length) return { min: 0, max: 1 };
        const minPrice = Math.min(...data.map((d) => d.p));
        const maxPrice = Math.max(...data.map((d) => d.p));
        return { min: minPrice, max: maxPrice };
    }, [data]);

    // Conditional rendering AFTER hooks
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[600px] bg-slate-900 rounded-xl p-4 border border-slate-800 flex items-center justify-center">
                <span className="text-slate-500">No data available</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl select-none">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-100 truncate flex-1" title={question}>
                    {question}
                    <span className="ml-3 text-xs font-normal text-slate-500">{infoString}</span>
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
                data={displayData}
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
                    domain={[Math.max(0, range.min * 0.8), Math.min(1, range.max * 1.2)]}
                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                    stroke="#94a3b8"
                    fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={electionDayStart} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Polls Open', fill: '#ef4444', fontSize: 12 }} />
                <ReferenceLine x={electionDayEnd} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Polls Close', fill: '#ef4444', fontSize: 12 }} />
                {polls?.map((poll, idx) => {
                    const pollTs = new Date(poll.date).getTime() / 1000;
                    return (
                        <ReferenceLine
                            key={idx}
                            x={pollTs}
                            stroke="#f59e0b"
                            strokeDasharray="3 3"
                            strokeOpacity={0.6}
                            label={<PollLabel poll={poll} />}
                        />
                    );
                })}
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
};

const MultiChart = (props: MultiChartProps) => {
    const { datasets, polls, detailLevel } = props;
    const { left, right, refAreaLeft, refAreaRight, setRefAreaLeft, setRefAreaRight, zoom, zoomOut } = useChartZoom();

    // Election Day Markers
    const electionDayStart = new Date("2026-01-18T08:00:00Z").getTime() / 1000;
    const electionDayEnd = new Date("2026-01-18T19:00:00Z").getTime() / 1000;

    // Merge data with Forward Fill
    // This ensures that at any timestamp T, we have values for ALL candidates (carrying over their last known price).
    // Without this, the Tooltip only shows candidates that traded strictly at timestamp T.
    const mergedData = useMemo(() => {
        const allPoints: { t: number; id: string; p: number }[] = [];
        datasets.forEach(ds => {
            ds.data.forEach(pt => {
                allPoints.push({ t: pt.t, id: ds.id, p: pt.p });
            });
        });

        // Sort chronologically
        allPoints.sort((a, b) => a.t - b.t);

        const result: any[] = [];
        const lastKnownValues: Record<string, number> = {};

        let currentTimestamp = -1;
        let currentObj: any = null;

        for (const point of allPoints) {
            if (point.t !== currentTimestamp) {
                // Finished collecting updates for the previous timestamp, push it
                if (currentObj) {
                    result.push(currentObj);
                }

                // Start a new row for this new timestamp
                currentTimestamp = point.t;
                // Pre-fill with all last known values (Forward Fill)
                currentObj = { t: currentTimestamp, ...lastKnownValues };
            }

            // Update the value for this specific market at this timestamp
            currentObj[point.id] = point.p;
            // Update our persistent state
            lastKnownValues[point.id] = point.p;
        }

        // Push the final pending object
        if (currentObj) {
            result.push(currentObj);
        }

        return result;
    }, [datasets]);

    // Downsample - Hook always called
    const displayData = useMemo(() => {
        if (!mergedData.length) return [];
        const fullDurationMinutes = (mergedData[mergedData.length - 1].t - mergedData[0].t) / 60;
        const desiredResMinutes = detailLevel || 30;

        const targetVisualPoints = desiredResMinutes <= 1
            ? Infinity
            : Math.ceil(fullDurationMinutes / desiredResMinutes);

        return downsample(mergedData, left, right, targetVisualPoints);
    }, [mergedData, left, right, detailLevel]);

    const infoString = useMemo(() => {
        if (!displayData || displayData.length < 2) return "";
        const avgInterval = (displayData[displayData.length - 1].t - displayData[0].t) / displayData.length;
        const mins = Math.max(1, Math.round(avgInterval / 60));
        return `Showing ${displayData.length} pts (~1pt/${mins}m)`;
    }, [displayData]);

    if (displayData.length === 0) {
        return (
            <div className="w-full h-[600px] bg-slate-900 rounded-xl p-4 border border-slate-800 flex items-center justify-center">
                <span className="text-slate-500">No data available</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xl select-none">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-100">
                    All Candidates Comparison
                    <span className="ml-3 text-xs font-normal text-slate-500">{infoString}</span>
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
                width={1000}
                height={550}
                data={displayData}
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
                <ReferenceLine x={electionDayStart} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Polls Open', fill: '#ef4444', fontSize: 12 }} />
                <ReferenceLine x={electionDayEnd} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Polls Close', fill: '#ef4444', fontSize: 12 }} />
                {polls?.map((poll, idx) => {
                    const pollTs = new Date(poll.date).getTime() / 1000;
                    return (
                        <ReferenceLine
                            key={idx}
                            x={pollTs}
                            stroke="#f59e0b"
                            strokeDasharray="3 3"
                            strokeOpacity={0.6}
                            label={<PollLabel poll={poll} />}
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
};

export default function ChartComponents(props: ChartProps) {
    if (props.mode === "single") {
        return <SingleChart {...props} />;
    }
    return <MultiChart {...props} />;
}
