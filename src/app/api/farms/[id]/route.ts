import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE /api/farms/[id] - Soft delete a farm (CEO only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { role } = await request.json()

    if (role !== 'CEO') {
      return NextResponse.json({ error: 'Only CEO can manage farms' }, { status: 403 })
    }

    const farm = await db.farm.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Farm removed', farm })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete farm' }, { status: 500 })
  }
}

// PATCH /api/farms/[id] - Rename or update a farm (CEO only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.role !== 'CEO') {
      return NextResponse.json({ error: 'Only CEO can manage farms' }, { status: 403 })
    }

    const { name, location, address, phone, isActive } = body
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (location !== undefined) updateData.location = location
    if (address !== undefined) updateData.address = address
    if (phone !== undefined) updateData.phone = phone
    if (isActive !== undefined) updateData.isActive = isActive

    const farm = await db.farm.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ message: 'Farm updated', farm })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update farm' }, { status: 500 })
  }
}
