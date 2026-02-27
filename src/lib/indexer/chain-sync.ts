import { prisma } from "@/lib/db";
import { getUSDCAddress } from "@/lib/chains/config";
import { getAllFacilitatorAddressesByChain } from "@/lib/facilitators/addresses";

const CDP_API_BASE = "https://api.cdp.coinbase.com";

interface CDPTransferEvent {
  sender: string;
  recipient: string;
  amount: string;
  tx_hash: string;
  block_timestamp: string;
  transaction_from: string;
  log_index: number;
  block_number: string;
}

/**
 * Sync USDC Transfer events for one facilitator address from CDP API.
 * x402 transfers are identified by transaction_from = facilitator address.
 */
export async function syncTransfersFromCDP(
  facilitatorAddress: string,
  facilitatorId: string,
  chain: string,
  sinceTimestamp: Date
): Promise<number> {
  const usdcAddress = getUSDCAddress(chain);
  if (!usdcAddress) return 0;

  const addr = facilitatorAddress.toLowerCase();
  const query = `
    SELECT
      "from" as sender,
      "to" as recipient,
      value as amount,
      transaction_hash as tx_hash,
      block_timestamp,
      transaction_from,
      log_index,
      block_number
    FROM base.events
    WHERE
      event_signature = 'Transfer(address,address,uint256)'
      AND contract_address = '${usdcAddress}'
      AND transaction_from = '${addr}'
      AND block_timestamp > '${sinceTimestamp.toISOString()}'
    ORDER BY block_timestamp ASC
    LIMIT 1000
  `;

  const apiKey = process.env.CDP_API_KEY;
  if (!apiKey) {
    console.warn("CDP_API_KEY not set; skipping CDP sync.");
    return 0;
  }

  const response = await fetch(`${CDP_API_BASE}/platform/v2/data/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CDP API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as { results?: CDPTransferEvent[] };
  const events: CDPTransferEvent[] = data.results ?? [];

  if (events.length === 0) return 0;

  const usdc = usdcAddress.toLowerCase();
  const transfers = events.map((e) => ({
    txHash: e.tx_hash,
    logIndex: e.log_index,
    chain,
    tokenAddress: usdc,
    sender: String(e.sender).toLowerCase(),
    recipient: String(e.recipient).toLowerCase(),
    amount: Number(e.amount) / 1e6,
    amountRaw: String(e.amount),
    decimals: 6,
    facilitatorId,
    txFrom: String(e.transaction_from).toLowerCase(),
    blockNumber: BigInt(e.block_number),
    blockTimestamp: new Date(e.block_timestamp),
  }));

  const result = await prisma.transferEvent.createMany({
    data: transfers,
    skipDuplicates: true,
  });

  const lastEvent = events[events.length - 1];
  const source = `cdp:${chain}:${facilitatorId}`;
  await prisma.syncCursor.upsert({
    where: { source_chain: { source, chain } },
    update: { lastSyncedAt: new Date(lastEvent.block_timestamp) },
    create: {
      source,
      chain,
      lastSyncedAt: new Date(lastEvent.block_timestamp),
    },
  });

  return result.count;
}

const DEFAULT_SINCE_DAYS = 30;

function getSinceTimestamp(chain: string, facilitatorId: string): Date {
  const since = new Date();
  since.setDate(since.getDate() - DEFAULT_SINCE_DAYS);
  return since;
}

/**
 * Run sync for all configured facilitator addresses (all chains).
 * Returns total number of new transfer events written.
 */
export async function runSyncTransfers(): Promise<{ count: number; errors: string[] }> {
  const byChain = getAllFacilitatorAddressesByChain();
  let total = 0;
  const errors: string[] = [];

  for (const [chain, entries] of byChain) {
    for (const entry of entries) {
      try {
        let since = new Date(0);
        const cursor = await prisma.syncCursor.findUnique({
          where: { source_chain: { source: `cdp:${chain}:${entry.facilitatorId}`, chain } },
        });
        if (cursor) since = cursor.lastSyncedAt;
        else since = getSinceTimestamp(chain, entry.facilitatorId);

        const count = await syncTransfersFromCDP(
          entry.address,
          entry.facilitatorId,
          chain,
          since
        );
        total += count;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${entry.facilitatorId}/${chain}: ${msg}`);
      }
    }
  }

  return { count: total, errors };
}
