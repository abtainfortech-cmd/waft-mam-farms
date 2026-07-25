import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/full-reset - Wipe ALL data for a fresh start (CEO only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { role, confirm } = body

    if (role !== 'CEO') {
      return NextResponse.json({ error: 'Only CEO can reset all data' }, { status: 403 })
    }

    if (confirm !== true) {
      return NextResponse.json({ error: 'You must explicitly confirm the full reset' }, { status: 400 })
    }

    // Delete all data in order respecting foreign keys
    const result: Record<string, number> = {}

    result.pendingAmendments = (await db.pendingAmendment.deleteMany()).count
    result.treatments = (await db.treatment.deleteMany()).count
    result.vaccinations = (await db.vaccination.deleteMany()).count
    result.healthChecks = (await db.healthCheck.deleteMany()).count
    result.expenses = (await db.expense.deleteMany()).count
    result.birdSales = (await db.birdSale.deleteMany()).count
    result.eggSales = (await db.eggSale.deleteMany()).count
    result.feedRecords = (await db.feedRecord.deleteMany()).count
    result.birdMortalities = (await db.birdMortality.deleteMany()).count
    result.dailyEggCollections = (await db.dailyEggCollection.deleteMany()).count
    result.announcements = (await db.announcement.deleteMany()).count
    result.customers = (await db.customer.deleteMany()).count
    result.flocks = (await db.birdFlock.deleteMany()).count
    result.farms = (await db.farm.deleteMany()).count

    // Reset staff passwords to defaults but keep accounts
    // CEO keeps access, others are deactivated
    await db.staff.updateMany({ where: { role: { not: 'CEO' } }, data: { isActive: false } })
    result.staffDeactivated = 1

    // Reset CEO password to default
    const ceo = await db.staff.findFirst({ where: { role: 'CEO' } })
    if (ceo) {
      await db.staff.update({ where: { id: ceo.id }, data: { password: 'ceo123' } })
    }

    return NextResponse.json({
      message: 'All data has been wiped for a fresh start. Only your CEO account remains.',
      result,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset all data' }, { status: 500 })
  }
}
