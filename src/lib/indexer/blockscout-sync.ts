import { prisma } from "@/lib/db";

/**
 * Blockscout API sync for x402 payments on Base.
 * Free, no API key needed. base.blockscout.com/api/v2
 *
 * x402 facilitators are EOAs that *submit* the settlement transaction
 * (tx.from) — the actual USDC payment is payer -> payee, and the
 * facilitator never appears as the token from/to. So instead of pulling
 * token-transfers where the facilitator is from/to, we pull the
 * facilitator's own transactions (filter=from) and, for each one, extract
 * the USDC transfer it caused. This matches how x402scan indexes payments
 * (Transfer events where transaction_from = facilitator).
 */

const BLOCKSCOUT_API = "https://base.blockscout.com/api/v2";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".toLowerCase();
const CURSOR_SOURCE_PREFIX = "blockscout-txfrom:base";

const SYNC_BACKFILL_HOURS = Number(process.env.SYNC_BACKFILL_HOURS ?? 24);
const SYNC_MAX_TX_LOOKUPS = Number(process.env.SYNC_MAX_TX_LOOKUPS ?? 300);
const SYNC_MAX_PAGES = Number(process.env.SYNC_MAX_PAGES ?? 20);
const SYNC_TIME_BUDGET_MS = Number(process.env.SYNC_TIME_BUDGET_MS ?? 240000);

const AUTHORIZATION_METHODS = new Set(["transferWithAuthorization", "receiveWithAuthorization"]);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface DecodedParam {
  name: string;
  type: string;
  value: string;
}

export interface BlockscoutTxItem {
  hash: string;
  block_number: number;
  timestamp: string;
  result: string;
  status?: string | null;
  method?: string | null;
  to: { hash: string } | null;
  decoded_input?: { parameters?: DecodedParam[] } | null;
}

interface BlockscoutTxListResponse {
  items: BlockscoutTxItem[];
  next_page_params: Record<string, string> | null;
}

interface BlockscoutTokenTransfer {
  from: { hash: string };
  to: { hash: string };
  total: { value: string; decimals: string };
  token: { address_hash: string };
  log_index: number;
}

interface BlockscoutTokenTransfersResponse {
  items: BlockscoutTokenTransfer[];
}

export interface TransferRow {
  txHash: string;
  logIndex: number;
  chain: string;
  tokenAddress: string;
  sender: string;
  recipient: string;
  amount: number;
  amountRaw: string;
  decimals: number;
  facilitatorId: string;
  txFrom: string;
  blockNumber: bigint;
  blockTimestamp: Date;
}

/** Fetch JSON from Blockscout with retry on 429/5xx and a 30s timeout. */
async function fetchBlockscoutJson<T>(url: string): Promise<T> {
  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      });
      if (resp.status === 429 || resp.status >= 500) {
        lastErr = new Error(`Blockscout ${resp.status}: ${await resp.text()}`);
        if (attempt < maxAttempts) {
          await sleep(500 * attempt);
          continue;
        }
        throw lastErr;
      }
      if (!resp.ok) {
        throw new Error(`Blockscout ${resp.status}: ${await resp.text()}`);
      }
      return (await resp.json()) as T;
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await sleep(500 * attempt);
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

async function fetchTransactionsFrom(
  address: string,
  nextPageParams?: Record<string, string> | null
): Promise<BlockscoutTxListResponse> {
  let url = `${BLOCKSCOUT_API}/addresses/${address}/transactions?filter=from`;
  if (nextPageParams) {
    url += `&${new URLSearchParams(nextPageParams).toString()}`;
  }
  return fetchBlockscoutJson<BlockscoutTxListResponse>(url);
}

async function fetchTokenTransfersForTx(hash: string): Promise<BlockscoutTokenTransfersResponse> {
  const url = `${BLOCKSCOUT_API}/transactions/${hash}/token-transfers?type=ERC-20`;
  return fetchBlockscoutJson<BlockscoutTokenTransfersResponse>(url);
}

function findParam(params: DecodedParam[] | undefined, name: string): string | undefined {
  return params?.find((p) => p.name === name)?.value;
}

/**
 * Build a TransferEvent row from a `transferWithAuthorization` /
 * `receiveWithAuthorization` transaction where `to` is the USDC contract.
 * Returns null if the tx doesn't match (wrong method, not USDC, missing
 * decoded params, etc).
 */
export function buildRowFromAuthorizationTx(
  tx: BlockscoutTxItem,
  facilitatorId: string,
  facilitatorAddress: string
): TransferRow | null {
  if (!tx.to || tx.to.hash.toLowerCase() !== USDC_ADDRESS) return null;
  if (!tx.method || !AUTHORIZATION_METHODS.has(tx.method)) return null;

  const params = tx.decoded_input?.parameters;
  const from = findParam(params, "from");
  const to = findParam(params, "to");
  const value = findParam(params, "value");
  if (!from || !to || value === undefined) return null;

  const decimals = 6;
  const amountRaw = value;
  const amount = Number(amountRaw) / Math.pow(10, decimals);

  return {
    txHash: tx.hash.toLowerCase(),
    logIndex: 0,
    chain: "base",
    tokenAddress: USDC_ADDRESS,
    sender: from.toLowerCase(),
    recipient: to.toLowerCase(),
    amount,
    amountRaw,
    decimals,
    facilitatorId,
    txFrom: facilitatorAddress.toLowerCase(),
    blockNumber: BigInt(tx.block_number),
    blockTimestamp: new Date(tx.timestamp),
  };
}

/** Build rows from a tx's token-transfers (for txs that don't go through an authorization method). */
function buildRowsFromTokenTransfers(
  tx: BlockscoutTxItem,
  transfers: BlockscoutTokenTransfer[],
  facilitatorId: string,
  facilitatorAddress: string
): TransferRow[] {
  const rows: TransferRow[] = [];
  for (const t of transfers) {
    if (t.token.address_hash.toLowerCase() !== USDC_ADDRESS) continue;
    const decimals = parseInt(t.total.decimals || "6", 10);
    rows.push({
      txHash: tx.hash.toLowerCase(),
      logIndex: t.log_index ?? 0,
      chain: "base",
      tokenAddress: USDC_ADDRESS,
      sender: t.from.hash.toLowerCase(),
      recipient: t.to.hash.toLowerCase(),
      amount: Number(t.total.value) / Math.pow(10, decimals),
      amountRaw: t.total.value,
      decimals,
      facilitatorId,
      txFrom: facilitatorAddress.toLowerCase(),
      blockNumber: BigInt(tx.block_number),
      blockTimestamp: new Date(tx.timestamp),
    });
  }
  return rows;
}

interface AddressSyncResult {
  inserted: number;
  truncated: boolean;
  newestBlockSeen: bigint | null;
}

interface SyncContext {
  lookupsRemaining: number;
  deadline: number;
}

async function syncOneAddress(
  facilitatorId: string,
  address: string,
  cursorBlock: bigint | null,
  ctx: SyncContext
): Promise<AddressSyncResult> {
  const addr = address.toLowerCase();
  let inserted = 0;
  let truncated = false;
  let newestBlockSeen: bigint | null = null;
  let nextPageParams: Record<string, string> | null | undefined;
  let pages = 0;

  const cutoffTimestamp = cursorBlock === null ? Date.now() - SYNC_BACKFILL_HOURS * 60 * 60 * 1000 : null;

  outer: while (pages < SYNC_MAX_PAGES) {
    await sleep(200);
    const data = await fetchTransactionsFrom(addr, nextPageParams);
    pages++;
    if (!data.items || data.items.length === 0) break;

    const rows: TransferRow[] = [];

    for (const tx of data.items) {
      if (newestBlockSeen === null || BigInt(tx.block_number) > newestBlockSeen) {
        newestBlockSeen = BigInt(tx.block_number);
      }

      if (cursorBlock !== null && tx.block_number <= cursorBlock) {
        break outer;
      }
      if (cutoffTimestamp !== null && new Date(tx.timestamp).getTime() < cutoffTimestamp) {
        break outer;
      }

      if (tx.result !== "success") continue;

      const authRow = buildRowFromAuthorizationTx(tx, facilitatorId, addr);
      if (authRow) {
        rows.push(authRow);
        continue;
      }

      if (ctx.lookupsRemaining <= 0) {
        truncated = true;
        break outer;
      }
      ctx.lookupsRemaining--;
      await sleep(200);
      const transfersResp = await fetchTokenTransfersForTx(tx.hash);
      rows.push(...buildRowsFromTokenTransfers(tx, transfersResp.items ?? [], facilitatorId, addr));
    }

    if (rows.length > 0) {
      const result = await prisma.transferEvent.createMany({ data: rows, skipDuplicates: true });
      inserted += result.count;
    }

    nextPageParams = data.next_page_params;
    if (!nextPageParams) break;
    if (Date.now() > ctx.deadline) {
      truncated = true;
      break;
    }
  }

  if (pages >= SYNC_MAX_PAGES && nextPageParams) {
    truncated = true;
  }

  return { inserted, truncated, newestBlockSeen };
}

export async function syncAllFromBlockscout(): Promise<{
  total: number;
  errors: string[];
  facilitatorResults: Record<string, number>;
  truncated: string[];
  addressesVisited: number;
  addressesSkippedForTime: number;
}> {
  const addresses = await prisma.facilitatorAddress.findMany({
    where: { chain: "base", deprecated: false },
    orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
  });

  let total = 0;
  const errors: string[] = [];
  const facilitatorResults: Record<string, number> = {};
  const truncated: string[] = [];
  let addressesVisited = 0;
  let addressesSkippedForTime = 0;

  const deadline = Date.now() + SYNC_TIME_BUDGET_MS;
  const ctx: SyncContext = { lookupsRemaining: SYNC_MAX_TX_LOOKUPS, deadline };

  for (const addr of addresses) {
    if (Date.now() > deadline) {
      addressesSkippedForTime++;
      continue;
    }

    const addressLower = addr.address.toLowerCase();
    const cursorSource = `${CURSOR_SOURCE_PREFIX}:${addressLower}`;

    try {
      addressesVisited++;
      const cursor = await prisma.syncCursor.findUnique({
        where: { source_chain: { source: cursorSource, chain: "base" } },
      });
      const cursorBlock = cursor?.lastBlockNumber ?? null;

      const { inserted, truncated: wasTruncated, newestBlockSeen } = await syncOneAddress(
        addr.facilitatorId,
        addressLower,
        cursorBlock,
        ctx
      );

      total += inserted;
      facilitatorResults[addr.facilitatorId] = (facilitatorResults[addr.facilitatorId] || 0) + inserted;

      if (inserted > 0) {
        console.log(`[${addr.facilitatorId}] ${addressLower.slice(0, 10)}... => ${inserted}`);
      }

      if (newestBlockSeen !== null) {
        const nextBlock =
          cursorBlock !== null && cursorBlock > newestBlockSeen ? cursorBlock : newestBlockSeen;
        await prisma.syncCursor.upsert({
          where: { source_chain: { source: cursorSource, chain: "base" } },
          update: { lastSyncedAt: new Date(), lastBlockNumber: nextBlock },
          create: { source: cursorSource, chain: "base", lastSyncedAt: new Date(), lastBlockNumber: nextBlock },
        });
      }

      if (wasTruncated) {
        truncated.push(addressLower);
      }

      await prisma.facilitatorAddress.update({ where: { id: addr.id }, data: { lastSyncedAt: new Date() } });
    } catch (err) {
      const msg = `${addr.facilitatorId}/${addressLower}: ${err}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return { total, errors, facilitatorResults, truncated, addressesVisited, addressesSkippedForTime };
}
