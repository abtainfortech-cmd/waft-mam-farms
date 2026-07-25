import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST: full data reset (CEO only, requires confirmation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.confirm === true) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 })
    }

    // Delete in FK-safe order
    await db.amendment.deleteMany()
    await db.treatment.deleteMany()
    await db.vaccination.deleteMany()
    await db.healthCheck.deleteMany()
    await db.expense.deleteMany()
    await db.birdSale.deleteMany()
    await db.eggSale.deleteMany()
    await db.feedRecord.deleteMany()
    await db.birdMortality.deleteMany()
    await db.dailyEggCollection.deleteMany()
    await db.announcement.deleteMany()
    await db.customer.deleteMany()
    await db.flock.deleteMany()
    await db.farm.deleteMany()

    // Deactivate all non-CEO staff, reset CEO password
    await db.staff.updateMany({
      where: { role: { not: 'CEO' } },
      data: { isActive: false },
    })
    await db.staff.updateMany({
      where: { role: 'CEO' },
      data: { password: 'ceo123' },
    })

    // Re-seed default farms
    await db.farm.createMany({
      data: [
        { name: 'Main Farm', location: 'Accra', address: 'Main Road, Accra', phone: '020-000-0001', isActive: true },
        { name: 'Branch Farm 1', location: 'Kumasi', address: 'Industrial Area, Kumasi', phone: '020-000-0002', isActive: true },
        { name: 'Branch Farm 2', location: 'Tamale', address: 'Farm Road, Tamale', phone: '020-000-0003', isActive: true },
      ],
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, message: 'All data has been reset successfully' })
  } catch (error) {
    console.error('Full reset error:', error)
    return NextResponse.json({ error: 'Reset failed: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 })
  }
}
