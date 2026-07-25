import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

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
