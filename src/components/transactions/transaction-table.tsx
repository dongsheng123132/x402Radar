"use client";

import Link from "next/link";

interface TxRow {
  txHash: string;
  sender: string;
  recipient: string;
  amount: number;
  blockTimestamp: string;
  chain: string;
}

export function TransactionTable({
  items,
  page,
  limit,
  total,
  chain,
}: {
  items: TxRow[];
  page: number;
  limit: number;
  total: number;
  chain: string;
}) {
  const totalPages = Math.ceil(total / limit) || 1;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString();
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-medium">Hash</th>
              <th className="px-4 py-3 text-left font-medium">From</th>
              <th className="px-4 py-3 text-left font-medium">To</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-right font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Chain</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr
                key={t.txHash}
                className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
              >
                <td className="px-4 py-3 font-mono">
                  <a
                    href={`https://basescan.org/tx/${t.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t.txHash.slice(0, 14)}...
                  </a>
                </td>
                <td className="px-4 py-3 font-mono">
                  <Link href={`/agents/${t.sender}`} className="text-blue-600 hover:underline">
                    {t.sender.slice(0, 8)}...{t.sender.slice(-6)}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono">
                  <Link href={`/sellers/${t.recipient}`} className="text-blue-600 hover:underline">
                    {t.recipient.slice(0, 8)}...{t.recipient.slice(-6)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-medium">${t.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-zinc-600">{formatTime(t.blockTimestamp)}</td>
                <td className="px-4 py-3">{t.chain}</td>
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
              href={`/transactions?chain=${chain || ""}&page=${page - 1}&limit=${limit}`}
              className="rounded border px-3 py-1 hover:bg-zinc-100"
            >
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/transactions?chain=${chain || ""}&page=${page + 1}&limit=${limit}`}
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
