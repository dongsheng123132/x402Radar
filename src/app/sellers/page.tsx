import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PERIODS = ["1d", "7d", "30d", "all"] as const;

export default async function SellersPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const period = (params.period ?? "all") as string;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? "20", 10)));

  const periodMs: Record<string, number> = {
    "1d": 86400000,
    "7d": 604800000,
    "30d": 2592000000,
  };
  const since =
    period === "all" ? new Date(0) : new Date(Date.now() - (periodMs[period] ?? 0));

  const where = period === "all" ? undefined : { lastSeenAt: { gte: since } };

  const [items, total] = await Promise.all([
    prisma.seller.findMany({
      where,
      orderBy: { totalReceived: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.seller.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Seller Leaderboard</h1>
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <a
            key={p}
            href={`/sellers?period=${p}&page=1&limit=${limit}`}
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
              period === p
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            }`}
          >
            {p.toUpperCase()}
          </a>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-medium">Rank</th>
              <th className="px-4 py-3 text-left font-medium">Address</th>
              <th className="px-4 py-3 text-left font-medium">Origin</th>
              <th className="px-4 py-3 text-right font-medium">Received</th>
              <th className="px-4 py-3 text-right font-medium">Txns</th>
              <th className="px-4 py-3 text-right font-medium">Unique Agents</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, i) => (
              <tr
                key={s.address}
                className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
              >
                <td className="px-4 py-3 text-zinc-500">#{(page - 1) * limit + i + 1}</td>
                <td className="px-4 py-3 font-mono">
                  <Link href={`/sellers/${s.address}`} className="text-blue-600 hover:underline">
                    {s.address.slice(0, 10)}...{s.address.slice(-8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600">{s.origin ?? "—"}</td>
                <td className="px-4 py-3 text-right font-medium">${s.totalReceived.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{s.totalTxCount}</td>
                <td className="px-4 py-3 text-right">{s.uniqueAgents}</td>
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
              href={`/sellers?period=${period}&page=${page - 1}&limit=${limit}`}
              className="rounded border px-3 py-1 hover:bg-zinc-100"
            >
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/sellers?period=${period}&page=${page + 1}&limit=${limit}`}
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
