import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const chain = searchParams.get("chain") ?? undefined;

    const where = chain ? { chain } : undefined;
    const [items, total] = await Promise.all([
      prisma.transferEvent.findMany({
        where,
        orderBy: { blockTimestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { facilitator: { select: { id: true, name: true } } },
      }),
      prisma.transferEvent.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((t) => ({
        txHash: t.txHash,
        sender: t.sender,
        recipient: t.recipient,
        amount: t.amount,
        blockTimestamp: t.blockTimestamp.toISOString(),
        chain: t.chain,
        facilitatorId: t.facilitator?.id,
        facilitatorName: t.facilitator?.name,
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
