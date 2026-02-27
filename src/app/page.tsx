import { StatsCards } from "@/components/dashboard/stats-cards";

export const dynamic = "force-dynamic";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { TopAgents } from "@/components/dashboard/top-agents";
import { TopSellers } from "@/components/dashboard/top-sellers";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { getStatsData } from "@/lib/api/stats";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const [stats, agents, sellers, transactions] = await Promise.all([
    getStatsData(),
    prisma.agent.findMany({
      orderBy: { totalSpent: "desc" },
      take: 10,
      select: { address: true, totalSpent: true, totalTxCount: true },
    }),
    prisma.seller.findMany({
      orderBy: { totalReceived: "desc" },
      take: 10,
      select: { address: true, origin: true, totalReceived: true, totalTxCount: true },
    }),
    prisma.transferEvent.findMany({
      orderBy: { blockTimestamp: "desc" },
      take: 20,
      select: {
        txHash: true,
        sender: true,
        recipient: true,
        amount: true,
        blockTimestamp: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <StatsCards
        totalVolume={stats.totalVolume}
        totalTransactions={stats.totalTransactions}
        activeAgents={stats.activeAgents}
        activeSellers={stats.activeSellers}
        volumeChange24h={stats.volumeChange24h}
      />
      <VolumeChart data={stats.dailyVolumes} />
      <div className="grid gap-6 md:grid-cols-2">
        <TopAgents items={agents} />
        <TopSellers items={sellers} />
      </div>
      <RecentTransactions
        items={transactions.map((t) => ({
          ...t,
          blockTimestamp: t.blockTimestamp.toISOString(),
        }))}
      />
    </div>
  );
}
