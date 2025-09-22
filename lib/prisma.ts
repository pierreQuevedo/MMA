// lib/prisma.ts
import { PrismaClient } from "./generated/prisma"; // <- ton output custom

declare global {
  // Evite plusieurs instances en dev (hot reload Next.js)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // tu peux ajouter "query" en dev
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;