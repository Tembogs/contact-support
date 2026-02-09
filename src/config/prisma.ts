import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


if (
  process.env.NODE_ENV === "test" &&
  process.env.DATABASE_URL?.includes("render.com")
) {
  throw new Error("🚨 TEST ENV CONNECTING TO PROD DB — ABORTED");
}

const url = process.env.DATABASE_URL!;

if (process.env.NODE_ENV === "test" && !url.includes("contact_support_test")) {
  throw new Error("🚨 DATABASE_URL is not test database!");
}

const adapter = new PrismaPg({
  connectionString: url,
});


const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
