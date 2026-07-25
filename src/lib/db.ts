import { PrismaClient } from '@prisma/client'
import 'better-sqlite3'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean
}

// Auto-configure SQLite for production use
async function initDb(prisma: PrismaClient) {
  if (globalForPrisma.dbInitialized) return
  try {
    // Run raw SQL via Prisma's internal engine connection
    const url = process.env.DATABASE_URL || 'file:./db/custom.db'
    const dbPath = url.replace('file:', '').split('?')[0]
    const Database = require('better-sqlite3')
    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('busy_timeout = 5000')
    sqlite.pragma('synchronous = NORMAL')
    sqlite.pragma('cache_size = -8000') // 8MB cache
    sqlite.pragma('foreign_keys = ON')
    const mode = sqlite.pragma('journal_mode')
    console.log(`[DB] SQLite configured: WAL=${mode[0]?.journal_mode || mode}, busy_timeout=5000`)
    sqlite.close()
    globalForPrisma.dbInitialized = true
  } catch (e) {
    console.warn('[DB] SQLite pragma config failed (non-critical):', e)
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Initialize DB settings on first import
initDb(db).catch(() => {})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Database is configured with SQLite WAL (Write-Ahead Logging) mode for
 * concurrent multi-user access. WAL mode allows simultaneous readers
 * without blocking writers, and vice versa.
 *
 * Key settings applied to the SQLite database:
 * - journal_mode = WAL (concurrent read/write support)
 * - busy_timeout = 5000 (retry for 5s on lock contention)
 * - synchronous = NORMAL (safe with WAL, better performance)
 *
 * WAL mode is enabled via the DATABASE_URL in .env:
 *   DATABASE_URL="file:./db/custom.db?connection_limit=1"
 *
 * Prisma automatically uses WAL for SQLite. The busy_timeout and
 * synchronous settings are applied at the database level to handle
 * concurrent access from multiple API requests.
 *
 * All users connect through the same web app API routes, so the
 * database is inherently shared — changes made by any user are
 * immediately visible to all other users on their next data fetch.
 */
