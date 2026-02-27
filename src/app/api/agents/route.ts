import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") ?? "spent";
    const period = searchParams.get("period") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const periodMs: Record<string, number> = {
      "1d": 86400000,
      "7d": 604800000,
      "30d": 2592000000,
    };
    const since =
      period === "all" ? new Date(0) : new Date(Date.now() - (periodMs[period] ?? 0));

    const orderBy = sort === "txCount" ? { totalTxCount: "desc" as const } : { totalSpent: "desc" as const };

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where: period === "all" ? undefined : { lastSeenAt: { gte: since } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agent.count({
        where: period === "all" ? undefined : { lastSeenAt: { gte: since } },
      }),
    ]);

    return NextResponse.json({
      items: agents.map((a) => ({
        address: a.address,
        label: a.label,
        totalSpent: a.totalSpent,
        totalTxCount: a.totalTxCount,
        score: a.score,
        firstSeenAt: a.firstSeenAt.toISOString(),
        lastSeenAt: a.lastSeenAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
