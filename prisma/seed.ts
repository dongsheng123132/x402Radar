import { prisma } from "../src/lib/db";
import { FACILITATORS } from "../src/lib/facilitators";
import { getFacilitatorAddresses } from "../src/lib/facilitators/addresses";

async function main() {
  const chain = "base";
  const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".toLowerCase();

  for (const f of FACILITATORS) {
    await prisma.facilitator.upsert({
      where: { id: f.id },
      update: { name: f.name, imageUrl: f.imageUrl ?? null, docsUrl: f.docsUrl ?? null, color: f.color ?? null },
      create: {
        id: f.id,
        name: f.name,
        imageUrl: f.imageUrl ?? null,
        docsUrl: f.docsUrl ?? null,
        color: f.color ?? null,
      },
    });
  }

  const entries = getFacilitatorAddresses(chain);
  const now = new Date();
  for (const e of entries) {
    await prisma.facilitatorAddress.upsert({
      where: {
        chain_address_tokenAddress: {
          chain,
          address: e.address,
          tokenAddress: e.tokenAddress,
        },
      },
      update: { lastSyncedAt: now },
      create: {
        facilitatorId: e.facilitatorId,
        chain: e.chain,
        address: e.address,
        tokenAddress: e.tokenAddress,
        tokenSymbol: e.tokenSymbol,
        tokenDecimals: e.tokenDecimals,
        firstSeenAt: now,
        lastSyncedAt: now,
      },
    });
  }

  console.log("Seed: facilitators and addresses upserted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
