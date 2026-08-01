import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDbSchema } from '@/lib/db-setup'

export async function GET(request: NextRequest) {
  const farmId = request.nextUrl.searchParams.get('farmId')
  const dateFrom = request.nextUrl.searchParams.get('dateFrom')
  const dateTo = request.nextUrl.searchParams.get('dateTo')

  const where: Record<string, unknown> = {}
  if (farmId) where.farmId = farmId
  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo)
  }

  try {
    const records = await db.birdMortality.findMany({
      where,
      include: { flock: true, farm: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch mortality records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbSchema()
    const body = await request.json()
    if (body.date) body.date = normalizeDate(body.date)

    // Decrement flock birdCount by mortality count
    if (body.flockId && body.count) {
      const flock = await db.birdFlock.findUnique({ where: { id: body.flockId } })
      if (flock) {
        const newCount = Math.max(0, flock.birdCount - body.count)
        await db.birdFlock.update({ where: { id: body.flockId }, data: { birdCount: newCount } })
      }
    }

    const record = await db.birdMortality.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    console.error('Mortality POST error:', error.message)
    return NextResponse.json({ error: 'Failed to create mortality record', detail: error.message }, { status: 500 })
  }
}

function normalizeDate(val: unknown): Date | undefined {
  if (!val) return undefined
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val + 'T00:00:00.000Z')
  if (val instanceof Date) return val
  return new Date(val as string)
}
