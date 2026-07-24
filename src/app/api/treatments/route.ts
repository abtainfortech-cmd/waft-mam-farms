import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const farmId = request.nextUrl.searchParams.get('farmId')
  const flockId = request.nextUrl.searchParams.get('flockId')

  const where: Record<string, unknown> = {}
  if (farmId) where.farmId = farmId
  if (flockId) where.flockId = flockId

  try {
    const treatments = await db.treatment.findMany({
      where,
      include: { flock: true, farm: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(treatments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch treatments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const treatment = await db.treatment.create({ data: body })
    return NextResponse.json(treatment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create treatment' }, { status: 500 })
  }
}
