import { prisma } from "@/lib/db";

export async function getStatsData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const twentyFourHoursAgo = new Date(now.getTime() - 86400000);
  const fortyEightHoursAgo = new Date(now.getTime() - 2 * 86400000);

  const [totalAgg, activeAgentsCount, activeSellersCount, dailyRows, prevDayVolume, volumeLast24h] =
    await Promise.all([
      prisma.transferEvent.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.agent.count({ where: { lastSeenAt: { gte: thirtyDaysAgo } } }),
      prisma.seller.count({ where: { lastSeenAt: { gte: thirtyDaysAgo } } }),
      prisma.dailyStats.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: "asc" },
      }),
      prisma.transferEvent.aggregate({
        _sum: { amount: true },
        where: { blockTimestamp: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo } },
      }),
      prisma.transferEvent.aggregate({
        _sum: { amount: true },
        where: { blockTimestamp: { gte: twentyFourHoursAgo } },
      }),
    ]);

  const totalVolume = totalAgg._sum.amount ?? 0;
  const totalTransactions = totalAgg._count;
  const volume24hAgo = prevDayVolume._sum.amount ?? 0;
  const current24h = volumeLast24h._sum.amount ?? 0;
  const volumeChange24h = volume24hAgo > 0 ? ((current24h - volume24hAgo) / volume24hAgo) * 100 : 0;

  const dailyVolumes = dailyRows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    volume: r.totalVolume,
    txCount: r.totalTxCount,
  }));

  return {
    totalVolume,
    totalTransactions,
    activeAgents: activeAgentsCount,
    activeSellers: activeSellersCount,
    volumeChange24h,
    dailyVolumes,
  };
}
