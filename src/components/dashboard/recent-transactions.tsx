"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface TxItem {
  txHash: string;
  sender: string;
  recipient: string;
  amount: number;
  blockTimestamp: string;
}

export function RecentTransactions({ items }: { items: TxItem[] }) {
  function formatTime(iso: string) {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 60000;
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="font-semibold">Latest Transactions</h3>
        <Link href="/transactions" className="text-sm text-zinc-500 hover:text-zinc-900">
          View All →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="pb-2 text-left font-medium">Hash</th>
                <th className="pb-2 text-left font-medium">From</th>
                <th className="pb-2 text-left font-medium">To</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="pb-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.txHash} className="border-b border-zinc-100 dark:border-zinc-800/50">
                  <td className="py-2">
                    <a
                      href={`https://basescan.org/tx/${t.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {t.txHash.slice(0, 10)}...
                    </a>
                  </td>
                  <td className="font-mono text-zinc-600">
                    <Link href={`/agents/${t.sender}`} className="hover:underline">
                      {t.sender.slice(0, 6)}...{t.sender.slice(-4)}
                    </Link>
                  </td>
                  <td className="font-mono text-zinc-600">
                    <Link href={`/sellers/${t.recipient}`} className="hover:underline">
                      {t.recipient.slice(0, 6)}...{t.recipient.slice(-4)}
                    </Link>
                  </td>
                  <td className="text-right font-medium">${t.amount.toFixed(2)}</td>
                  <td className="text-right text-zinc-500">{formatTime(t.blockTimestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
