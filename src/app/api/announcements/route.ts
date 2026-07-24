import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all active announcements
export async function GET() {
  try {
    const announcements = await db.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(announcements)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

// POST create announcement (CEO only, checked client-side)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const announcement = await db.announcement.create({ data: body })
    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}

// PUT update (toggle active, edit)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const announcement = await db.announcement.update({ where: { id }, data })
    return NextResponse.json(announcement)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

// DELETE (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    const announcement = await db.announcement.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json(announcement)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
