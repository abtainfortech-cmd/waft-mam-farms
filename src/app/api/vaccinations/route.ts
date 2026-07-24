import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const farmId = request.nextUrl.searchParams.get('farmId')
  const status = request.nextUrl.searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (farmId) where.farmId = farmId
  if (status) where.status = status

  try {
    const vaccinations = await db.vaccination.findMany({
      where,
      include: { flock: true, farm: true },
      orderBy: { scheduledDate: 'asc' },
    })
    return NextResponse.json(vaccinations)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vaccinations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const vaccination = await db.vaccination.create({ data: body })
    return NextResponse.json(vaccination, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create vaccination' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const vaccination = await db.vaccination.update({ where: { id }, data })
    return NextResponse.json(vaccination)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update vaccination' }, { status: 500 })
  }
}
