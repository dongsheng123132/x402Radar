import { prisma } from "@/lib/db";
import { AgentTable } from "@/components/agents/agent-table";

export const dynamic = "force-dynamic";

const PERIODS = ["1d", "7d", "30d", "all"] as const;

export default async function AgentsPage({
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
    prisma.agent.findMany({
      where,
      orderBy: { totalSpent: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.agent.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agent Leaderboard</h1>
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <a
            key={p}
            href={`/agents?period=${p}&page=1&limit=${limit}`}
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
      <AgentTable items={items} page={page} limit={limit} total={total} period={period} />
    </div>
  );
}
