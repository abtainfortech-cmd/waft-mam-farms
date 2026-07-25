import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all farms (includes inactive farms for CEO management)
export async function GET() {
  try {
    const farms = await db.farm.findMany({
      include: {
        flocks: { where: { isActive: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(farms)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch farms' }, { status: 500 })
  }
}

// POST create farm
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const farm = await db.farm.create({ data: body })
    return NextResponse.json(farm, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create farm' }, { status: 500 })
  }
}

// PUT update farm
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const farm = await db.farm.update({ where: { id }, data })
    return NextResponse.json(farm)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update farm' }, { status: 500 })
  }
}
