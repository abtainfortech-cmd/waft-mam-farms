import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma client for PostgreSQL (Neon / Supabase / Railway / etc.)
 *
 * In production (Vercel / Render / Railway), the connection pool is managed
 * by the database provider — no client-side configuration needed.
 *
 * In development, we cache the client on globalThis to avoid exhausting
 * connections during Next.js hot reload.
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * DATABASE_URL should be a pooled connection string (e.g. Neon's PgBouncer URL
 * ending in `?pgbouncer=true`). DIRECT_URL (optional) is used for migrations
 * and is a direct (non-pooled) connection.
 *
 * Example .env for production:
 *   DATABASE_URL="postgresql://user:pass@ep-pool.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"
 *   DIRECT_URL="postgresql://user:pass@ep-direct.region.aws.neon.tech/dbname?sslmode=require"
 */
