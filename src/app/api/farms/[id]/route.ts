import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH: update a single farm (rename, toggle active, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const farm = await db.farm.findUnique({ where: { id } })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.location !== undefined) updateData.location = body.location
    if (body.address !== undefined) updateData.address = body.address
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updated = await db.farm.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update farm' }, { status: 500 })
  }
}

// DELETE: soft-delete a farm (set isActive=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const farm = await db.farm.findUnique({ where: { id } })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    const updated = await db.farm.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete farm' }, { status: 500 })
  }
}
