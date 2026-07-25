import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const farmId = request.nextUrl.searchParams.get('farmId')
  const flockId = request.nextUrl.searchParams.get('flockId')

  const where: Record<string, unknown> = {}
  if (farmId) where.farmId = farmId
  if (flockId) where.flockId = flockId

  try {
    const checks = await db.healthCheck.findMany({
      where,
      include: { flock: true, farm: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(checks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch health checks' }, { status: 500 })
  }
}

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
    const check = await db.healthCheck.create({ data: body })
    return NextResponse.json(check, { status: 201 })
  } catch (error: any) {
    console.error('Health POST error:', error.message)
    return NextResponse.json({ error: 'Failed to create health check', detail: error.message }, { status: 500 })
  }
}
