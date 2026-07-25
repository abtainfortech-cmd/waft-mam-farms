import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: return farm settings (create default if not exists)
export async function GET() {
  try {
    let settings = await db.farmSettings.findFirst()
    if (!settings) {
      settings = await db.farmSettings.create({
        data: { farmName: 'WAFT MAM Farms and Trading Hub' },
      })
    }
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

// PUT: update farm name (CEO only)
export async function PUT(request: NextRequest) {
  try {
    const { farmName } = await request.json()
    if (!farmName || farmName.trim().length < 2) {
      return NextResponse.json({ error: 'Farm name must be at least 2 characters' }, { status: 400 })
    }

    let settings = await db.farmSettings.findFirst()
    if (!settings) {
      settings = await db.farmSettings.create({
        data: { farmName: farmName.trim() },
      })
    } else {
      settings = await db.farmSettings.update({
        where: { id: settings.id },
        data: { farmName: farmName.trim() },
      })
    }
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
