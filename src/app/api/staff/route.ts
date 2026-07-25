import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all staff (CEO use)
export async function GET() {
  try {
    const staff = await db.staff.findMany({
      orderBy: { role: 'asc' },
    })
    return NextResponse.json(staff)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

// POST create staff (CEO use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const staff = await db.staff.create({ data: body })
    // Return without password
    const { password: _, ...safe } = staff
    return NextResponse.json(safe, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}

// PUT update staff (CEO reset password)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const staff = await db.staff.update({ where: { id }, data })
    const { password: _, ...safe } = staff
    return NextResponse.json(safe)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}

// DELETE deactivate staff
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    const staff = await db.staff.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json(staff)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to deactivate staff' }, { status: 500 })
  }
}
