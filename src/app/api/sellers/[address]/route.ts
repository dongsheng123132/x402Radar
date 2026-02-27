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

    const seller = await prisma.seller.findUnique({
      where: { address },
    });
    if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });

    const transactions = await prisma.transferEvent.findMany({
      where: { recipient: address },
      orderBy: { blockTimestamp: "desc" },
      take: 50,
      include: { facilitator: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      seller: {
        address: seller.address,
        label: seller.label,
        origin: seller.origin,
        totalReceived: seller.totalReceived,
        totalTxCount: seller.totalTxCount,
        uniqueAgents: seller.uniqueAgents,
        firstSeenAt: seller.firstSeenAt.toISOString(),
        lastSeenAt: seller.lastSeenAt.toISOString(),
      },
      transactions: transactions.map((t) => ({
        txHash: t.txHash,
        sender: t.sender,
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
