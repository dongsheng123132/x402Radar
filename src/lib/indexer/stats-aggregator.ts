import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

function parsePeriod(period: string): number {
  const map: Record<string, number> = {
    "1d": 86400000,
    "7d": 604800000,
    "30d": 2592000000,
  };
  return map[period] ?? 0;
}

/**
 * Aggregate stats from transfer_events into agents, sellers,
 * facilitator_stats, and daily_stats.
 */
export async function aggregateStats(): Promise<void> {
  // 1. Agents (from sender)
  await prisma.$executeRaw`
    INSERT INTO agents (id, address, first_seen_at, last_seen_at, total_spent, total_tx_count, created_at)
    SELECT
      gen_random_uuid(),
      sender,
      MIN(block_timestamp),
      MAX(block_timestamp),
      SUM(amount),
      COUNT(*),
      NOW()
    FROM transfer_events
    GROUP BY sender
    ON CONFLICT (address) DO UPDATE SET
      last_seen_at = EXCLUDED.last_seen_at,
      total_spent = EXCLUDED.total_spent,
      total_tx_count = EXCLUDED.total_tx_count
  `;

  // 2. Sellers (from recipient)
  await prisma.$executeRaw`
    INSERT INTO sellers (id, address, first_seen_at, last_seen_at, total_received, total_tx_count, unique_agents, created_at)
    SELECT
      gen_random_uuid(),
      recipient,
      MIN(block_timestamp),
      MAX(block_timestamp),
      SUM(amount),
      COUNT(*),
      COUNT(DISTINCT sender),
      NOW()
    FROM transfer_events
    GROUP BY recipient
    ON CONFLICT (address) DO UPDATE SET
      last_seen_at = EXCLUDED.last_seen_at,
      total_received = EXCLUDED.total_received,
      total_tx_count = EXCLUDED.total_tx_count,
      unique_agents = EXCLUDED.unique_agents
  `;

  // 3. Facilitator stats by period
  const now = Date.now();
  for (const period of ["1d", "7d", "30d", "all"] as const) {
    const since = period === "all" ? new Date(0) : new Date(now - parsePeriod(period));
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO facilitator_stats (id, facilitator_id, chain, period, total_volume, total_tx_count, unique_buyers, unique_sellers, calculated_at)
        SELECT
          gen_random_uuid(),
          facilitator_id,
          chain,
          ${period},
          COALESCE(SUM(amount), 0),
          COUNT(*),
          COUNT(DISTINCT sender),
          COUNT(DISTINCT recipient),
          NOW()
        FROM transfer_events
        WHERE block_timestamp >= ${since}
        GROUP BY facilitator_id, chain
        ON CONFLICT (facilitator_id, chain, period) DO UPDATE SET
          total_volume = EXCLUDED.total_volume,
          total_tx_count = EXCLUDED.total_tx_count,
          unique_buyers = EXCLUDED.unique_buyers,
          unique_sellers = EXCLUDED.unique_sellers,
          calculated_at = EXCLUDED.calculated_at
      `
    );
  }

  // 4. Daily stats (last 30 days)
  await prisma.$executeRaw`
    INSERT INTO daily_stats (id, date, chain, total_volume, total_tx_count, unique_buyers, unique_sellers, new_agents, new_sellers, created_at)
    SELECT
      gen_random_uuid(),
      DATE(block_timestamp),
      chain,
      SUM(amount),
      COUNT(*),
      COUNT(DISTINCT sender),
      COUNT(DISTINCT recipient),
      0,
      0,
      NOW()
    FROM transfer_events
    WHERE block_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(block_timestamp), chain
    ON CONFLICT (date, chain) DO UPDATE SET
      total_volume = EXCLUDED.total_volume,
      total_tx_count = EXCLUDED.total_tx_count,
      unique_buyers = EXCLUDED.unique_buyers,
      unique_sellers = EXCLUDED.unique_sellers
  `;
}
