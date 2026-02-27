import { prisma } from "@/lib/db";
import { TransactionTable } from "@/components/transactions/transaction-table";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const chain = params.chain ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? "50", 10)));

  const where = chain ? { chain } : undefined;

  const [items, total] = await Promise.all([
    prisma.transferEvent.findMany({
      where,
      orderBy: { blockTimestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        txHash: true,
        sender: true,
        recipient: true,
        amount: true,
        blockTimestamp: true,
        chain: true,
      },
    }),
    prisma.transferEvent.count({ where }),
  ]);

  const rows = items.map((t) => ({
    ...t,
    blockTimestamp: t.blockTimestamp.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <div className="flex gap-2">
        <a
          href="/transactions?page=1&limit=50"
          className={`rounded-lg border px-4 py-2 text-sm font-medium ${
            !chain
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800"
          }`}
        >
          All
        </a>
        <a
          href="/transactions?chain=base&page=1&limit=50"
          className={`rounded-lg border px-4 py-2 text-sm font-medium ${
            chain === "base"
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800"
          }`}
        >
          Base
        </a>
      </div>
      <TransactionTable items={rows} page={page} limit={limit} total={total} chain={chain} />
    </div>
  );
}
