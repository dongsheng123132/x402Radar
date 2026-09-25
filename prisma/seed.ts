import { prisma } from "../src/lib/db";
import { FACILITATORS } from "../src/lib/facilitators";
import { getFacilitatorAddresses } from "../src/lib/facilitators/addresses";

async function main() {
  const chain = "base";

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
  for (const e of entries) {
    await prisma.facilitatorAddress.upsert({
      where: {
        chain_address_tokenAddress: {
          chain,
          address: e.address,
          tokenAddress: e.tokenAddress,
        },
      },
      update: { deprecated: e.deprecated, firstSeenAt: e.firstSeenAt },
      create: {
        facilitatorId: e.facilitatorId,
        chain: e.chain,
        address: e.address,
        tokenAddress: e.tokenAddress,
        tokenSymbol: e.tokenSymbol,
        tokenDecimals: e.tokenDecimals,
        deprecated: e.deprecated,
        firstSeenAt: e.firstSeenAt,
        lastSyncedAt: null,
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
