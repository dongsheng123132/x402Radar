"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface StatsCardsProps {
  totalVolume: number;
  totalTransactions: number;
  activeAgents: number;
  activeSellers: number;
  volumeChange24h: number;
}

function formatUsd(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export function StatsCards({
  totalVolume,
  totalTransactions,
  activeAgents,
  activeSellers,
  volumeChange24h,
}: StatsCardsProps) {
  const cards = [
    {
      title: "总交易量",
      value: formatUsd(totalVolume),
      sub: volumeChange24h !== 0 && (
        <span className={cn("text-sm", volumeChange24h >= 0 ? "text-green-600" : "text-red-600")}>
          {volumeChange24h >= 0 ? "+" : ""}
          {volumeChange24h.toFixed(1)}% 24h
        </span>
      ),
    },
    { title: "总交易数", value: totalTransactions.toLocaleString(), sub: null },
    { title: "活跃 Agents", value: activeAgents.toLocaleString(), sub: null },
    { title: "活跃 Sellers", value: activeSellers.toLocaleString(), sub: null },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-zinc-500">{c.title}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
            {c.sub}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
