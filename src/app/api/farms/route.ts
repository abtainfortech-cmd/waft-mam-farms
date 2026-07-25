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

// PUT update farm (rename, soft-delete, re-activate, or update details)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Farm id is required' }, { status: 400 })
    }

    // Handle soft-delete action
    if (action === 'delete') {
      const farm = await db.farm.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: 'Farm removed', farm })
    }

    // Handle re-activate action
    if (action === 'restore') {
      const farm = await db.farm.update({ where: { id }, data: { isActive: true } })
      return NextResponse.json({ message: 'Farm restored', farm })
    }

    // Default: update fields
    const farm = await db.farm.update({ where: { id }, data })
    return NextResponse.json(farm)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update farm' }, { status: 500 })
  }
}
