"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AgentItem {
  address: string;
  totalSpent: number;
  totalTxCount: number;
}

export function TopAgents({ items }: { items: AgentItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="font-semibold">Top Agents (消费)</h3>
        <Link href="/agents" className="text-sm text-zinc-500 hover:text-zinc-900">
          View All →
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.slice(0, 5).map((a, i) => (
            <li key={a.address} className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">#{i + 1}</span>
              <Link
                href={`/agents/${a.address}`}
                className="font-mono text-zinc-700 hover:underline dark:text-zinc-300"
              >
                {a.address.slice(0, 6)}...{a.address.slice(-4)}
              </Link>
              <span className="font-medium">${a.totalSpent.toFixed(2)}</span>
              <span className="text-zinc-500">{a.totalTxCount} tx</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
