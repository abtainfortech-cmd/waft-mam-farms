import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDbSchema } from '@/lib/db-setup'

export async function GET(request: NextRequest) {
  await ensureDbSchema()
  const farmId = request.nextUrl.searchParams.get('farmId')
  try {
    const flocks = await db.birdFlock.findMany({
      where: farmId ? { farmId, isActive: true } : { isActive: true },
      include: { farm: true },
      orderBy: { dateArrival: 'desc' },
    })
    // Compute current age from dateArrival
    const now = new Date()
    const enriched = flocks.map(f => {
      const ageMs = now.getTime() - new Date(f.dateArrival).getTime()
      const currentAgeWeeks = Math.max(0, Math.floor(ageMs / (7 * 86400000)))
      const losses = (f.initialBirdCount || f.birdCount) - f.birdCount
      return {
        ...f,
        currentAgeWeeks,
        losses: Math.max(0, losses),
        lossPercent: (f.initialBirdCount || f.birdCount) > 0
          ? Math.round((losses / (f.initialBirdCount || f.birdCount)) * 10000) / 100
          : 0,
      }
    })
    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch flocks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbSchema()
    const body = await request.json()
    // Set initialBirdCount to birdCount if not provided
    if (!body.initialBirdCount && body.birdCount) {
      body.initialBirdCount = body.birdCount
    }
    // Auto-calculate ageWeeks from dateArrival if not provided
    if (body.dateArrival && !body.ageWeeks) {
      const ageMs = Date.now() - new Date(body.dateArrival).getTime()
      body.ageWeeks = Math.max(0, Math.floor(ageMs / (7 * 86400000)))
    }
    const flock = await db.birdFlock.create({ data: body })
    return NextResponse.json(flock, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create flock', detail: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    // Don't allow direct birdCount override — it's managed by mortality/sales
    delete (data as any).birdCount
    const flock = await db.birdFlock.update({ where: { id }, data })
    return NextResponse.json(flock)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update flock' }, { status: 500 })
  }
}
