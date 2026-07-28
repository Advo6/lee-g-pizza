import { prisma } from "@/lib/prisma";

export interface StoreStatus {
  isOpen: boolean;
  updatedAt: string;
}

async function ensureStoreStatusTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS StoreStatus (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      isOpen INTEGER NOT NULL DEFAULT 1,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await prisma.$executeRawUnsafe(`
    INSERT OR IGNORE INTO StoreStatus (id, isOpen, updatedAt)
    VALUES (1, 1, datetime('now'))
  `);
}

export async function getStoreStatus(): Promise<StoreStatus> {
  await ensureStoreStatusTable();

  const rows = await prisma.$queryRaw<Array<{ isOpen: number; updatedAt: string }>>`
    SELECT isOpen, updatedAt FROM StoreStatus WHERE id = 1
  `;

  const status = rows[0];

  return {
    isOpen: status?.isOpen !== 0,
    updatedAt: status?.updatedAt || new Date().toISOString(),
  };
}

export async function setStoreStatus(isOpen: boolean): Promise<StoreStatus> {
  await ensureStoreStatusTable();

  await prisma.$executeRaw`
    UPDATE StoreStatus
    SET isOpen = ${isOpen ? 1 : 0}, updatedAt = datetime('now')
    WHERE id = 1
  `;

  return getStoreStatus();
}
