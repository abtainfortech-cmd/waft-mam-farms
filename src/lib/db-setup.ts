/**
 * Self-migrating database setup for Neon PostgreSQL.
 * Safely adds new columns/relations if they don't exist yet.
 * Called once on app startup via /api/db-setup.
 */
import { db } from './db'

let setupDone = false

export async function ensureDbSchema() {
  if (setupDone) return
  setupDone = true

  try {
    // 1. Add initialBirdCount column to BirdFlock (default 0)
    const colCheck = await db.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'BirdFlock' AND column_name = 'initialBirdCount'
    `)
    if (!(colCheck as any[]).length) {
      await db.$executeRawUnsafe(`
        ALTER TABLE "BirdFlock" ADD COLUMN "initialBirdCount" INTEGER NOT NULL DEFAULT 0;
      `)
      console.log('[db-setup] Added BirdFlock.initialBirdCount')
    }

    // 2. Add flockId column to BirdSale (nullable)
    const flockColCheck = await db.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'BirdSale' AND column_name = 'flockId'
    `)
    if (!(flockColCheck as any[]).length) {
      await db.$executeRawUnsafe(`
        ALTER TABLE "BirdSale" ADD COLUMN "flockId" TEXT;
      `)
      console.log('[db-setup] Added BirdSale.flockId')
    }

    // 3. Add foreign key for BirdSale.flockId → BirdFlock.id
    // Check if FK already exists
    const fkCheck = await db.$queryRawUnsafe(`
      SELECT constraint_name FROM information_schema.table_constraints 
      WHERE table_name = 'BirdSale' AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%BirdSale_flockId_fkey%'
    `)
    if (!(fkCheck as any[]).length && (flockColCheck as any[]).length) {
      await db.$executeRawUnsafe(`
        ALTER TABLE "BirdSale" ADD CONSTRAINT "BirdSale_flockId_fkey" 
        FOREIGN KEY ("flockId") REFERENCES "BirdFlock"("id") ON DELETE SET NULL;
      `)
      console.log('[db-setup] Added BirdSale.flockId FK')
    }

    console.log('[db-setup] Schema verification complete')
  } catch (error: any) {
    console.error('[db-setup] Error:', error.message)
    // Don't throw — the app can still work, just without the new columns
  }
}
