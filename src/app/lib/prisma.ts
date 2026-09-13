import { PrismaClient } from "@prisma/client";

// Single client shared across hot-reloads (dev) and route modules.
// Without this, every HMR cycle leaks connections until Postgres
// refuses with "too many clients already".
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
