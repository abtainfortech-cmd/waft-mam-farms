import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'db', 'settings.json')

function readSettings() {
  try {
    if (existsSync(SETTINGS_PATH)) {
      return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
    }
  } catch {}
  return { farmName: 'WAFT MAM Farms and Trading Hub' }
}

function writeSettings(data: any) {
  writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2))
}

const SUPPORTED_TYPES = ['DailyEggCollection', 'BirdMortality', 'FeedRecord', 'EggSale', 'BirdSale', 'Expense', 'Vaccination', 'Treatment', 'HealthCheck']

// Reset numeric fields to 0/null and clear string fields for a record type
async function resetRecords(recordType: string, farmId?: string) {
  const where: any = {}
  if (farmId) where.farmId = farmId

  let count = 0

  switch (recordType) {
    case 'DailyEggCollection':
      count = await db.dailyEggCollection.updateMany({
        where,
        data: { crateCount: 0, eggsPerCrate: 30, brokenCount: 0, soiledCount: 0 },
      })
      break

    case 'BirdMortality':
      count = await db.birdMortality.updateMany({
        where,
        data: { count: 0, cause: null },
      })
      break

    case 'FeedRecord':
      count = await db.feedRecord.updateMany({
        where,
        data: { bagsUsed: 0, bagWeightKg: 50, costPerBag: 0, supplier: '' },
      })
      break

    case 'EggSale':
      count = await db.eggSale.updateMany({
        where,
        data: { crateCount: 0, totalAmount: 0, amountPaid: 0, pricePerCrate: 0 },
      })
      break

    case 'BirdSale':
      count = await db.birdSale.updateMany({
        where,
        data: { quantity: 0, totalAmount: 0, amountPaid: 0, pricePerBird: 0 },
      })
      break

    case 'Expense':
      count = await db.expense.updateMany({
        where,
        data: { amount: 0, paymentStatus: 'Paid', receiptNo: '' },
      })
      break

    case 'Vaccination':
      count = await db.vaccination.updateMany({
        where,
        data: { cost: 0, batchNo: '', method: null, dosage: null },
      })
      break

    case 'Treatment':
      count = await db.treatment.updateMany({
        where,
        data: { cost: 0, dosage: null, duration: null },
      })
      break

    case 'HealthCheck':
      count = await db.healthCheck.updateMany({
        where,
        data: { temperature: null, mortalityCount: 0, waterIntakeL: null, feedIntakeKg: null },
      })
      break

    default:
      throw new Error(`Unsupported record type: ${recordType}`)
  }

  return count
}

// Full data wipe — delete ALL records for a fresh start
async function fullDataWipe() {
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

  // Deactivate all non-CEO staff
  await db.staff.updateMany({ where: { role: { not: 'CEO' } }, data: { isActive: false } })
  result.staffDeactivated = 1

  // Reset CEO password to default
  const ceo = await db.staff.findFirst({ where: { role: 'CEO' } })
  if (ceo) {
    await db.staff.update({ where: { id: ceo.id }, data: { password: 'ceo123' } })
  }

  return result
}

// POST /api/reset - Reset records, full wipe, or update farm name (CEO only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordType, farmId, role, action, confirm } = body

    if (role !== 'CEO') {
      return NextResponse.json({ error: 'Only CEO can reset data' }, { status: 403 })
    }

    // Get farm name mode
    if (action === 'getFarmName') {
      const settings = readSettings()
      return NextResponse.json({ farmName: settings.farmName })
    }

    // Full data wipe mode
    if (action === 'fullReset') {
      if (confirm !== true) {
        return NextResponse.json({ error: 'You must explicitly confirm the full reset' }, { status: 400 })
      }
      const result = await fullDataWipe()
      return NextResponse.json({
        message: 'All data has been wiped for a fresh start. Only your CEO account remains.',
        result,
      })
    }

    // Update farm name mode
    if (action === 'updateFarmName') {
      const { farmName } = body
      if (!farmName || farmName.trim().length < 2) {
        return NextResponse.json({ error: 'Farm name must be at least 2 characters' }, { status: 400 })
      }
      const settings = readSettings()
 settings.farmName = farmName.trim()
      writeSettings(settings)
      return NextResponse.json({ message: 'Farm name updated', farmName: settings.farmName })
    }

    // Per-type reset mode
    if (!recordType || !SUPPORTED_TYPES.includes(recordType)) {
      return NextResponse.json(
        { error: `Invalid record type. Supported: ${SUPPORTED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const result = await resetRecords(recordType, farmId)
    return NextResponse.json({
      message: `Successfully reset ${recordType} records`,
      count: result.count,
      recordType,
      farmId: farmId || 'all',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset records' }, { status: 500 })
  }
}
