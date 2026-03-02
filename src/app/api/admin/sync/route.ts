import { NextResponse } from "next/server";
import { syncAllFromBlockscout } from "@/lib/indexer/blockscout-sync";
import { aggregateStats } from "@/lib/indexer/stats-aggregator";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { total, errors, facilitatorResults } = await syncAllFromBlockscout();

    if (total > 0) {
      await aggregateStats();
    }

    return NextResponse.json({ ok: true, total, errors, facilitatorResults });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
