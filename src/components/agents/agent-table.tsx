"use client";

import Link from "next/link";

interface AgentRow {
  address: string;
  label?: string | null;
  totalSpent: number;
  totalTxCount: number;
  score?: number | null;
}

export function AgentTable({
  items,
  page,
  limit,
  total,
  period,
}: {
  items: AgentRow[];
  page: number;
  limit: number;
  total: number;
  period: string;
}) {
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-medium">Rank</th>
              <th className="px-4 py-3 text-left font-medium">Address</th>
              <th className="px-4 py-3 text-left font-medium">Label</th>
              <th className="px-4 py-3 text-right font-medium">Spent</th>
              <th className="px-4 py-3 text-right font-medium">Txns</th>
              <th className="px-4 py-3 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a, i) => (
              <tr
                key={a.address}
                className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
              >
                <td className="px-4 py-3 text-zinc-500">#{(page - 1) * limit + i + 1}</td>
                <td className="px-4 py-3 font-mono">
                  <Link href={`/agents/${a.address}`} className="text-blue-600 hover:underline">
                    {a.address.slice(0, 10)}...{a.address.slice(-8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600">{a.label ?? "—"}</td>
                <td className="px-4 py-3 text-right font-medium">${a.totalSpent.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{a.totalTxCount}</td>
                <td className="px-4 py-3 text-right">{a.score != null ? a.score : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/agents?period=${period}&page=${page - 1}&limit=${limit}`}
              className="rounded border px-3 py-1 hover:bg-zinc-100"
            >
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/agents?period=${period}&page=${page + 1}&limit=${limit}`}
              className="rounded border px-3 py-1 hover:bg-zinc-100"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
