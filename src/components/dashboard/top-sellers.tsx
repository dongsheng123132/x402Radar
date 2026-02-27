"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SellerItem {
  address: string;
  origin?: string | null;
  totalReceived: number;
  totalTxCount: number;
}

export function TopSellers({ items }: { items: SellerItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="font-semibold">Top Sellers (收入)</h3>
        <Link href="/sellers" className="text-sm text-zinc-500 hover:text-zinc-900">
          View All →
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.slice(0, 5).map((s, i) => (
            <li key={s.address} className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">#{i + 1}</span>
              <Link
                href={`/sellers/${s.address}`}
                className="font-mono text-zinc-700 hover:underline dark:text-zinc-300"
              >
                {s.origin ?? `${s.address.slice(0, 6)}...${s.address.slice(-4)}`}
              </Link>
              <span className="font-medium">${s.totalReceived.toFixed(2)}</span>
              <span className="text-zinc-500">{s.totalTxCount} tx</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
