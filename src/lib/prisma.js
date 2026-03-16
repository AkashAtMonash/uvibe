import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis;

function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({}, {
  get(_, prop) {
    return getPrisma()[prop];
  }
});
