/**
 * Offline unit check: feeds a hand-written fake Blockscout tx item
 * (transferWithAuthorization) through buildRowFromAuthorizationTx and
 * prints the resulting row. No network, no DB.
 * Usage: pnpm exec tsx scripts/check-parse.ts
 */
import { buildRowFromAuthorizationTx, type BlockscoutTxItem } from "../src/lib/indexer/blockscout-sync";

const fakeTx: BlockscoutTxItem = {
  hash: "0xABCDEF0000000000000000000000000000000000000000000000000000001234",
  block_number: 12345678,
  timestamp: "2026-09-25T12:00:00.000000Z",
  result: "success",
  status: "ok",
  method: "transferWithAuthorization",
  to: { hash: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
  decoded_input: {
    parameters: [
      { name: "from", type: "address", value: "0x1111111111111111111111111111111111111111" },
      { name: "to", type: "address", value: "0x2222222222222222222222222222222222222222" },
      { name: "value", type: "uint256", value: "1500000" },
      { name: "validAfter", type: "uint256", value: "0" },
      { name: "validBefore", type: "uint256", value: "9999999999" },
      { name: "nonce", type: "bytes32", value: "0x00" },
      { name: "v", type: "uint8", value: "27" },
      { name: "r", type: "bytes32", value: "0x00" },
      { name: "s", type: "bytes32", value: "0x00" },
    ],
  },
};

const row = buildRowFromAuthorizationTx(fakeTx, "coinbase", "0x9999999999999999999999999999999999999999");

console.log("Row:", row);

if (!row) {
  console.error("FAIL: expected a row, got null");
  process.exit(1);
}

const checks: [string, boolean][] = [
  ["txHash lowercased", row.txHash === fakeTx.hash.toLowerCase()],
  ["sender from decoded 'from'", row.sender === "0x1111111111111111111111111111111111111111"],
  ["recipient from decoded 'to'", row.recipient === "0x2222222222222222222222222222222222222222"],
  ["amountRaw matches decoded value", row.amountRaw === "1500000"],
  ["amount = value / 1e6", row.amount === 1.5],
  ["logIndex is 0", row.logIndex === 0],
  ["txFrom is facilitator address (lowercase)", row.txFrom === "0x9999999999999999999999999999999999999999"],
  ["facilitatorId is set", row.facilitatorId === "coinbase"],
  ["tokenAddress is lowercased USDC", row.tokenAddress === "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"],
  ["blockNumber matches", row.blockNumber === BigInt(12345678)],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}

console.log("\nAll checks passed.");
