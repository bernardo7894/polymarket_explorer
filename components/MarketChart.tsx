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
            <ResponsiveContainer width="100%" height="90%">
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
                        domain={[Math.max(0, minPrice * 0.9), Math.min(1, maxPrice * 1.1)]} // Add some padding, keep within 0-1
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
