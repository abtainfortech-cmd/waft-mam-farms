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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const check = await db.healthCheck.create({ data: body })
    return NextResponse.json(check, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create health check' }, { status: 500 })
  }
}
