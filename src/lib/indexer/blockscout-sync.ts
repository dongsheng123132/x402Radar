import { prisma } from "@/lib/db";

/**
 * Blockscout API sync for x402 payments on Base.
 * Free, no API key needed. base.blockscout.com/api/v2
 */

const BLOCKSCOUT_API = "https://base.blockscout.com/api/v2";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

interface BlockscoutTransfer {
  block_number: number;
  timestamp: string;
  transaction_hash: string;
  log_index: number;
  from: { hash: string };
  to: { hash: string };
  total: { value: string; decimals: string };
  token: { address_hash: string; symbol: string; decimals: string };
}

interface BlockscoutResponse {
  items: BlockscoutTransfer[];
  next_page_params: Record<string, string> | null;
}

async function fetchTransfers(
  address: string,
  nextPageParams?: Record<string, string> | null
): Promise<BlockscoutResponse> {
  let url = `${BLOCKSCOUT_API}/addresses/${address}/token-transfers?type=ERC-20&token=${USDC_ADDRESS}`;
  if (nextPageParams) {
    url += `&${new URLSearchParams(nextPageParams).toString()}`;
  }
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) throw new Error(`Blockscout ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

async function syncOneFacilitator(
  facilitatorId: string,
  address: string,
  sinceBlock: number
): Promise<number> {
  const addr = address.toLowerCase();
  let totalInserted = 0;
  let nextPageParams: Record<string, string> | null | undefined;
  let pages = 0;

  do {
    await new Promise((r) => setTimeout(r, 200));
    const data = await fetchTransfers(addr, nextPageParams);
    if (!data.items || data.items.length === 0) break;

    const fresh = data.items.filter((tx) => tx.block_number > sinceBlock);
    if (fresh.length === 0) break;

    const transfers = fresh
      .filter((tx) => tx.token.address_hash.toLowerCase() === USDC_ADDRESS.toLowerCase())
      .map((tx) => ({
        txHash: tx.transaction_hash.toLowerCase(),
        logIndex: tx.log_index ?? 0,
        chain: "base",
        tokenAddress: USDC_ADDRESS.toLowerCase(),
        sender: tx.from.hash.toLowerCase(),
        recipient: tx.to.hash.toLowerCase(),
        amount: parseInt(tx.total.value) / Math.pow(10, parseInt(tx.total.decimals || "6")),
        amountRaw: tx.total.value,
        decimals: parseInt(tx.total.decimals || "6"),
        facilitatorId,
        txFrom: addr,
        blockNumber: BigInt(tx.block_number),
        blockTimestamp: new Date(tx.timestamp),
      }));

    if (transfers.length > 0) {
      const result = await prisma.transferEvent.createMany({ data: transfers, skipDuplicates: true });
      totalInserted += result.count;
    }

    nextPageParams = data.next_page_params;
    pages++;
    if (Math.min(...fresh.map((t) => t.block_number)) <= sinceBlock) break;
  } while (nextPageParams && pages < 50);

  return totalInserted;
}

export async function syncAllFromBlockscout(): Promise<{
  total: number;
  errors: string[];
  facilitatorResults: Record<string, number>;
}> {
  const addresses = await prisma.facilitatorAddress.findMany({ where: { chain: "base" } });
  let total = 0;
  const errors: string[] = [];
  const facilitatorResults: Record<string, number> = {};

  for (const addr of addresses) {
    try {
      const cursor = await prisma.syncCursor.findUnique({
        where: { source_chain: { source: `blockscout:base:${addr.facilitatorId}:${addr.address}`, chain: "base" } },
      });
      const sinceBlock = cursor?.lastBlockNumber ? Number(cursor.lastBlockNumber) : 0;

      const count = await syncOneFacilitator(addr.facilitatorId, addr.address, sinceBlock);
      total += count;
      facilitatorResults[addr.facilitatorId] = (facilitatorResults[addr.facilitatorId] || 0) + count;

      if (count > 0) console.log(`[${addr.facilitatorId}] ${addr.address.slice(0, 10)}... => ${count}`);

      const latestTx = await prisma.transferEvent.findFirst({
        where: { facilitatorId: addr.facilitatorId, txFrom: addr.address.toLowerCase() },
        orderBy: { blockNumber: "desc" },
        select: { blockNumber: true },
      });

      await prisma.syncCursor.upsert({
        where: { source_chain: { source: `blockscout:base:${addr.facilitatorId}:${addr.address}`, chain: "base" } },
        update: { lastSyncedAt: new Date(), lastBlockNumber: latestTx?.blockNumber ?? cursor?.lastBlockNumber },
        create: { source: `blockscout:base:${addr.facilitatorId}:${addr.address}`, chain: "base", lastSyncedAt: new Date(), lastBlockNumber: latestTx?.blockNumber ?? BigInt(0) },
      });

      if (count > 0) await prisma.facilitatorAddress.update({ where: { id: addr.id }, data: { lastSyncedAt: new Date() } });
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      const msg = `${addr.facilitatorId}/${addr.address}: ${err}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return { total, errors, facilitatorResults };
}
