import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const facilitators = await prisma.facilitator.findMany({
      include: {
        stats: true,
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      items: facilitators.map((f) => ({
        id: f.id,
        name: f.name,
        imageUrl: f.imageUrl,
        docsUrl: f.docsUrl,
        color: f.color,
        stats: f.stats.map((s) => ({
          chain: s.chain,
          period: s.period,
          totalVolume: s.totalVolume,
          totalTxCount: s.totalTxCount,
          uniqueBuyers: s.uniqueBuyers,
          uniqueSellers: s.uniqueSellers,
          calculatedAt: s.calculatedAt.toISOString(),
        })),
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
