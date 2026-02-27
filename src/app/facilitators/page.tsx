import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function FacilitatorsPage() {
  const facilitators = await prisma.facilitator.findMany({
    include: { stats: true },
    orderBy: { id: "asc" },
  });

  const allStats = facilitators.flatMap((f) =>
    f.stats.map((s) => ({ ...s, facilitatorName: f.name }))
  );
  const byFacilitator = facilitators.map((f) => {
    const all = f.stats.find((s) => s.period === "all");
    return {
      id: f.id,
      name: f.name,
      imageUrl: f.imageUrl,
      totalVolume: all?.totalVolume ?? 0,
      totalTxCount: all?.totalTxCount ?? 0,
      uniqueBuyers: all?.uniqueBuyers ?? 0,
      uniqueSellers: all?.uniqueSellers ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Facilitators</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {byFacilitator.map((f) => (
          <Link key={f.id} href={`/facilitators/${f.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <h3 className="font-semibold">{f.name}</h3>
                <p className="text-sm text-zinc-500">{f.id}</p>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Volume: ${f.totalVolume.toFixed(2)}</p>
                <p>Txns: {f.totalTxCount}</p>
                <p>Buyers: {f.uniqueBuyers} · Sellers: {f.uniqueSellers}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {allStats.length === 0 && facilitators.length > 0 && (
        <p className="text-sm text-zinc-500">
          No stats yet. Run the aggregate-stats cron or wait for sync.
        </p>
      )}
    </div>
  );
}
