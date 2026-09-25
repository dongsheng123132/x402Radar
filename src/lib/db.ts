import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * DATABASE_SCHEMA (optional) selects a Postgres schema without editing the
 * credential-bearing DATABASE_URL, e.g. DATABASE_SCHEMA=radar_v2.
 */
function datasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  const schema = process.env.DATABASE_SCHEMA;
  if (!url || !schema) return url;
  const u = new URL(url);
  u.searchParams.set("schema", schema);
  return u.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: datasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
