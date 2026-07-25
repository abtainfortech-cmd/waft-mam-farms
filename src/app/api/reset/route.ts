import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

// POST /api/reset - Reset records of a given type (CEO only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordType, farmId, role } = body

    if (role !== 'CEO') {
      return NextResponse.json({ error: 'Only CEO can reset data' }, { status: 403 })
    }

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
