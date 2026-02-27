import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const address = (await params).address?.toLowerCase();
    if (!address) return NextResponse.json({ error: "Missing address" }, { status: 400 });

    const agent = await prisma.agent.findUnique({
      where: { address },
    });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const transactions = await prisma.transferEvent.findMany({
      where: { sender: address },
      orderBy: { blockTimestamp: "desc" },
      take: 50,
      include: { facilitator: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      agent: {
        address: agent.address,
        label: agent.label,
        totalSpent: agent.totalSpent,
        totalTxCount: agent.totalTxCount,
        score: agent.score,
        firstSeenAt: agent.firstSeenAt.toISOString(),
        lastSeenAt: agent.lastSeenAt.toISOString(),
      },
      transactions: transactions.map((t) => ({
        txHash: t.txHash,
        recipient: t.recipient,
        amount: t.amount,
        blockTimestamp: t.blockTimestamp.toISOString(),
        chain: t.chain,
        facilitatorId: t.facilitator?.id,
        facilitatorName: t.facilitator?.name,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
