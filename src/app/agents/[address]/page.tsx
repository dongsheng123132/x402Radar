import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const address = (await params).address?.toLowerCase();
  if (!address) notFound();

  const agent = await prisma.agent.findUnique({ where: { address } });
  if (!agent) notFound();

  const transactions = await prisma.transferEvent.findMany({
    where: { sender: address },
    orderBy: { blockTimestamp: "desc" },
    take: 30,
    include: { facilitator: { select: { id: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agent: {address.slice(0, 10)}...{address.slice(-8)}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 text-sm font-medium text-zinc-500">总花费</CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">${agent.totalSpent.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-sm font-medium text-zinc-500">交易数</CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{agent.totalTxCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-sm font-medium text-zinc-500">Score</CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{agent.score ?? "—"}</span>
          </CardContent>
        </Card>
      </div>
      <p className="text-sm text-zinc-500">
        First seen: {agent.firstSeenAt.toLocaleDateString()} · Last seen:{" "}
        {agent.lastSeenAt.toLocaleDateString()}
        {agent.label && ` · Label: ${agent.label}`}
      </p>
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Recent Transactions</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-2 text-left font-medium">Hash</th>
                  <th className="pb-2 text-left font-medium">To</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 text-right font-medium">Time</th>
                  <th className="pb-2 text-left font-medium">Facilitator</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.txHash} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="py-2">
                      <a
                        href={`https://basescan.org/tx/${t.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {t.txHash.slice(0, 10)}...
                      </a>
                    </td>
                    <td className="font-mono">
                      <Link href={`/sellers/${t.recipient}`} className="hover:underline">
                        {t.recipient.slice(0, 8)}...{t.recipient.slice(-6)}
                      </Link>
                    </td>
                    <td className="text-right font-medium">${t.amount.toFixed(2)}</td>
                    <td className="text-right text-zinc-500">
                      {t.blockTimestamp.toLocaleString()}
                    </td>
                    <td>{t.facilitator?.name ?? t.facilitatorId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
