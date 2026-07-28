import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL ?? "file:./dev.db";
  const bundledDb = path.join(process.cwd(), "prisma", "demo.db");

  if (!fs.existsSync(bundledDb)) {
    return configured;
  }

  const bundledUrl = `file:${bundledDb}`;

  if (process.env.VERCEL !== "1") {
    return configured.includes("demo.db") ? bundledUrl : configured;
  }

  const runtimeDb = path.join("/tmp", "lee-g-pizza.db");

  try {
    if (!fs.existsSync(runtimeDb)) {
      fs.copyFileSync(bundledDb, runtimeDb);
    }
    return `file:${runtimeDb}`;
  } catch {
    return bundledUrl;
  }
}

const databaseUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
