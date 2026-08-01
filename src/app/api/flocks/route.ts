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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch egg collections for lay rate calculation
    const eggCollections = await db.dailyEggCollection.findMany({
      where: { date: { gte: monthAgo } },
    })

    // Group eggs by farmId and by day
    const eggsByFarmToday: Record<string, number> = {}
    const eggsByFarmMonth: Record<string, number> = {}
    for (const ec of eggCollections) {
      const totalEggs = ec.crateCount * ec.eggsPerCrate
      const d = new Date(ec.date)
      if (d >= today) {
        eggsByFarmToday[ec.farmId] = (eggsByFarmToday[ec.farmId] || 0) + totalEggs
      }
      eggsByFarmMonth[ec.farmId] = (eggsByFarmMonth[ec.farmId] || 0) + totalEggs
    }

    // Per-farm layer bird counts
    const farmLayerCounts: Record<string, number> = {}
    for (const f of flocks) {
      if (f.birdType === 'Layer' && f.birdCount > 0) {
        farmLayerCounts[f.farmId] = (farmLayerCounts[f.farmId] || 0) + f.birdCount
      }
    }

    // Days in current period for monthly avg
    const daysInPeriod = Math.max(1, Math.ceil((now.getTime() - monthAgo.getTime()) / (24 * 60 * 60 * 1000)))

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

    // Compute per-farm lay rates
    const farmLayRates: Record<string, { todayLayRate: number; monthLayRate: number; todayEggs: number; monthAvgDailyEggs: number }> = {}
    for (const fid of Object.keys(farmLayerCounts)) {
      const layerBirds = farmLayerCounts[fid]
      const todayEggs = eggsByFarmToday[fid] || 0
      const monthTotalEggs = eggsByFarmMonth[fid] || 0
      const monthAvg = monthTotalEggs / daysInPeriod
      farmLayRates[fid] = {
        todayLayRate: layerBirds > 0 ? Math.round((todayEggs / layerBirds) * 10000) / 100 : 0,
        monthLayRate: layerBirds > 0 ? Math.round((monthAvg / layerBirds) * 10000) / 100 : 0,
        todayEggs,
        monthAvgDailyEggs: Math.round(monthAvg),
      }
    }

    return NextResponse.json({ flocks: enriched, farmLayRates })
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
  await ensureDbSchema()
  try {
    const body = await request.json()
    const { id, updateBirdCount, notes, ...rest } = body
    const data: any = {}
    // If CEO sends updateBirdCount, allow overriding birdCount (e.g. adding birds to existing flock)
    if (updateBirdCount !== undefined) {
      data.birdCount = Math.max(0, parseInt(updateBirdCount) || 0)
      // Also bump initialBirdCount if new count is higher
      const existing = await db.birdFlock.findUnique({ where: { id } })
      if (existing && data.birdCount > existing.initialBirdCount) {
        data.initialBirdCount = data.birdCount
      }
    }
    if (notes !== undefined) data.notes = notes
    if (rest.name) data.name = rest.name
    if (rest.birdType) data.birdType = rest.birdType
    if (rest.breed) data.breed = rest.breed
    if (rest.isActive !== undefined) data.isActive = rest.isActive
    console.log('[PUT /api/flocks] id:', id, 'updateBirdCount:', updateBirdCount, 'data:', JSON.stringify(data))
    const flock = await db.birdFlock.update({ where: { id }, data })
    return NextResponse.json(flock)
  } catch (error: any) {
    console.error('[PUT /api/flocks] ERROR:', error.message)
    return NextResponse.json({ error: 'Failed to update flock', detail: error.message }, { status: 500 })
  }
}
