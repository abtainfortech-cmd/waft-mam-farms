import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const farmId = request.nextUrl.searchParams.get('farmId')
  try {
    const flocks = await db.birdFlock.findMany({
      where: farmId ? { farmId, isActive: true } : { isActive: true },
      include: { farm: true },
      orderBy: { dateArrival: 'desc' },
    })
    return NextResponse.json(flocks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch flocks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const flock = await db.birdFlock.create({ data: body })
    return NextResponse.json(flock, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create flock' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const flock = await db.birdFlock.update({ where: { id }, data })
    return NextResponse.json(flock)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update flock' }, { status: 500 })
  }
}
