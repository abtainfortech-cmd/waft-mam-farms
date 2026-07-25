import { db } from '@/lib/db'

interface ConflictCheckOptions {
  model: any // Prisma model (e.g., db.eggSale)
  id: string
  expectedUpdatedAt: string // ISO date string the client last saw
  data: any
}

/**
 * Safely update a record with optimistic concurrency control.
 * If the record has been modified since the client last fetched it,
 * returns 409 Conflict with the current version.
 * Otherwise, performs the update and returns 200 with the updated record.
 */
export async function safeUpdate({ model, id, expectedUpdatedAt, data }: ConflictCheckOptions) {
  const current = await model.findUnique({ where: { id } })

  if (!current) {
    return { ok: false, status: 404, error: 'Record not found' }
  }

  // Compare timestamps - allow 2-second tolerance for clock skew
  const currentTime = new Date(current.updatedAt as Date).getTime()
  const expectedTime = new Date(expectedUpdatedAt).getTime()

  if (Math.abs(currentTime - expectedTime) > 2000) {
    return {
      ok: false,
      status: 409,
      error: 'CONFLICT',
      currentData: current,
      message: 'This record was modified by another user. Please review the latest version before saving.',
      modifiedBy: (current as any).recordedBy || 'another staff member',
      modifiedAt: current.updatedAt,
    }
  }

  // Safe to update
  const updated = await model.update({ where: { id }, data })
  return { ok: true, status: 200, data: updated }
}
