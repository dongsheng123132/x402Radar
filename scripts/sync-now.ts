/**
 * Manual sync script — run locally to populate data via Blockscout API.
 * Usage: npx tsx scripts/sync-now.ts
 *
 * If running locally behind a proxy, set NODE_USE_ENV_PROXY=1 so Node's
 * fetch honors HTTP_PROXY/HTTPS_PROXY when talking to Blockscout.
 */
import { syncAllFromBlockscout } from "../src/lib/indexer/blockscout-sync";
import { aggregateStats } from "../src/lib/indexer/stats-aggregator";

async function main() {
  console.log("=== Starting Blockscout sync ===");
  const start = Date.now();

  const { total, errors, facilitatorResults, truncated, addressesVisited, addressesSkippedForTime } =
    await syncAllFromBlockscout();

  console.log(`\n=== Sync complete: ${total} new transfers in ${((Date.now() - start) / 1000).toFixed(1)}s ===`);
  console.log(`Addresses visited: ${addressesVisited}, skipped for time budget: ${addressesSkippedForTime}`);

  if (Object.keys(facilitatorResults).length > 0) {
    console.log("\nPer facilitator:");
    for (const [fac, count] of Object.entries(facilitatorResults).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${fac}: ${count}`);
    }
  }

  if (truncated.length > 0) {
    console.log(`\n${truncated.length} address(es) truncated (known gap — will continue from cursor next run):`);
    truncated.forEach((a) => console.log(`  - ${a}`));
  }

  if (errors.length > 0) {
    console.log(`\n${errors.length} errors:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  if (total > 0) {
    console.log("\n=== Aggregating stats ===");
    await aggregateStats();
    console.log("Stats aggregated.");
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
