"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface DailyVolume {
  date: string;
  volume: number;
  txCount: number;
}

export function VolumeChart({ data }: { data: DailyVolume[] }) {
  const chartData = data.map((d) => ({
    ...d,
    volumeLabel: d.volume >= 1e3 ? `$${(d.volume / 1e3).toFixed(1)}K` : `$${d.volume.toFixed(0)}`,
  }));

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">交易量趋势 (30 天)</h3>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Volume"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="hsl(221 83% 53%)"
                fill="hsl(221 83% 53% / 0.2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
