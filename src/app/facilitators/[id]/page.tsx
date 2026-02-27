import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function FacilitatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const facilitator = await prisma.facilitator.findUnique({
    where: { id },
    include: { stats: true },
  });
  if (!facilitator) notFound();

  const byPeriod = facilitator.stats.reduce(
    (acc, s) => {
      acc[s.period] = s;
      return acc;
    },
    {} as Record<string, (typeof facilitator.stats)[0]>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{facilitator.name}</h1>
      <p className="text-sm text-zinc-500">ID: {facilitator.id}</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(["1d", "7d", "30d", "all"] as const).map((period) => {
          const s = byPeriod[period];
          return (
            <Card key={period}>
              <CardHeader className="pb-2 text-sm font-medium text-zinc-500">
                {period.toUpperCase()}
              </CardHeader>
              <CardContent>
                {s ? (
                  <>
                    <p className="font-semibold">${s.totalVolume.toFixed(2)}</p>
                    <p className="text-sm text-zinc-600">
                      {s.totalTxCount} tx · {s.uniqueBuyers} buyers · {s.uniqueSellers} sellers
                    </p>
                  </>
                ) : (
                  <p className="text-zinc-500">—</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
