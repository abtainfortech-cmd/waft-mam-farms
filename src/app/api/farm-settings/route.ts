import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/farm-settings - Read farm-wide settings (farm name)
export async function GET() {
  try {
    const settings = await db.farmSettings.findFirst()
    if (!settings) {
      // Create default settings if none exist
      const created = await db.farmSettings.create({
        data: { farmName: 'WAFT MAM Farms and Trading Hub' },
      })
      return NextResponse.json(created)
    }
    return NextResponse.json(settings)
  } catch (error: any) {
    // If table doesn't exist yet, return default
    return NextResponse.json({ id: '_default', farmName: 'WAFT MAM Farms and Trading Hub' })
  }
}

// PUT /api/farm-settings - Update farm name (CEO only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { farmName, role } = body

    if (role !== 'CEO') {
      return NextResponse.json({ error: 'Only CEO can change farm settings' }, { status: 403 })
    }

    if (!farmName || farmName.trim().length < 2) {
      return NextResponse.json({ error: 'Farm name must be at least 2 characters' }, { status: 400 })
    }

    const existing = await db.farmSettings.findFirst()
    let settings
    if (existing) {
      settings = await db.farmSettings.update({
        where: { id: existing.id },
        data: { farmName: farmName.trim() },
      })
    } else {
      settings = await db.farmSettings.create({
        data: { farmName: farmName.trim() },
      })
    }

    return NextResponse.json({ message: 'Farm name updated', settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update farm name' }, { status: 500 })
  }
}
