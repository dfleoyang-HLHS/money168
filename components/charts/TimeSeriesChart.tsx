"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TimeRange } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";

interface TimeSeriesChartProps {
  data: Array<{ date: string; value: number }>;
  unit?: string;
  defaultRange?: TimeRange;
  referenceLine?: number;
  referenceLabel?: string;
  color?: string;
}

const RANGES: TimeRange[] = ["1M", "3M", "6M", "1Y", "3Y", "5Y", "MAX"];

function filterRange(data: Array<{ date: string; value: number }>, range: TimeRange) {
  if (range === "MAX" || !data.length) return data;
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latest = new Date(sorted[sorted.length - 1].date);
  const months: Record<TimeRange, number> = {
    "1M": 1,
    "3M": 3,
    "6M": 6,
    "1Y": 12,
    "3Y": 36,
    "5Y": 60,
    MAX: 9999,
  };
  const cutoff = new Date(latest);
  cutoff.setMonth(cutoff.getMonth() - months[range]);
  return sorted.filter((d) => new Date(d.date) >= cutoff);
}

export default function TimeSeriesChart({
  data,
  unit = "",
  defaultRange = "1Y",
  referenceLine,
  referenceLabel,
  color = "#3b82f6",
}: TimeSeriesChartProps) {
  const [range, setRange] = useState<TimeRange>(defaultRange);

  const chartData = useMemo(() => filterRange(data, range), [data, range]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              range === r
                ? "bg-accent text-white"
                : "bg-surface text-slate-400 hover:bg-surface-raised hover:text-white"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDate(v)}
              minTickGap={40}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(v) => formatNumber(v, 1)}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: "#1a2332",
                border: "1px solid #2d3a4f",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(v) => formatDate(String(v))}
              formatter={(value: number) => [`${formatNumber(value)} ${unit}`, "數值"]}
            />
            {referenceLine != null && (
              <ReferenceLine
                y={referenceLine}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: referenceLabel || String(referenceLine),
                  position: "insideTopRight",
                  fill: "#94a3b8",
                  fontSize: 11,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
