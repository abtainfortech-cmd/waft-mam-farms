import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const records = await db.dailyEggCollection.findMany({
      where,
      include: { farm: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch egg collections' }, { status: 500 })
  }
}

// Normalize date strings (YYYY-MM-DD) to ISO DateTime for Prisma
function normalizeDate(val: unknown): Date | undefined {
  if (!val) return undefined
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val + 'T00:00:00.000Z')
  if (val instanceof Date) return val
  return new Date(val as string)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (body.date) body.date = normalizeDate(body.date)
    const record = await db.dailyEggCollection.create({ data: body })
    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    console.error('Egg POST error:', error.message)
    return NextResponse.json({ error: 'Failed to create egg collection record', detail: error.message }, { status: 500 })
  }
}
