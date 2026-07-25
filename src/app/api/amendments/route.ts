import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: apply amendment to the actual record
async function applyAmendment(recordType: string, recordId: string, field: string, newValue: string) {
  // Try to parse as number, fall back to string for text fields
  let parsedValue: any = newValue
  if (newValue !== '' && !isNaN(Number(newValue))) {
    parsedValue = Number(newValue)
  }
  const data: any = { [field]: parsedValue }

  switch (recordType) {
    case 'DailyEggCollection':
      await db.dailyEggCollection.update({ where: { id: recordId }, data })
      break
    case 'BirdMortality':
      await db.birdMortality.update({ where: { id: recordId }, data })
      break
    case 'FeedRecord':
      await db.feedRecord.update({ where: { id: recordId }, data })
      break
    case 'EggSale':
      await db.eggSale.update({ where: { id: recordId }, data })
      break
    case 'BirdSale':
      await db.birdSale.update({ where: { id: recordId }, data })
      break
    case 'Expense':
      await db.expense.update({ where: { id: recordId }, data })
      break
    case 'Vaccination':
      await db.vaccination.update({ where: { id: recordId }, data })
      break
    case 'Treatment':
      await db.treatment.update({ where: { id: recordId }, data })
      break
    case 'HealthCheck':
      await db.healthCheck.update({ where: { id: recordId }, data })
      break
    default:
      throw new Error(`Unknown record type: ${recordType}`)
  }
}

// GET /api/amendments - List amendments (optionally filter by status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status && status !== 'All') {
      where.status = status
    }

    const amendments = await db.pendingAmendment.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
    })

    return NextResponse.json(amendments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch amendments' }, { status: 500 })
  }
}

// POST /api/amendments - Create a new amendment request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordType, recordId, field, oldValue, newValue, reason, requestedBy } = body

    if (!recordType || !recordId || !field || oldValue === undefined || newValue === undefined || !requestedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amendment = await db.pendingAmendment.create({
      data: {
        recordType,
        recordId,
        field,
        oldValue: String(oldValue),
        newValue: String(newValue),
        reason: reason || null,
        requestedBy,
      },
    })

    return NextResponse.json(amendment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create amendment' }, { status: 500 })
  }
}

// PUT /api/amendments - Approve or reject an amendment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, reviewedBy } = body

    if (!id || !status || !reviewedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (status !== 'Approved' && status !== 'Rejected') {
      return NextResponse.json({ error: 'Status must be Approved or Rejected' }, { status: 400 })
    }

    // Fetch the amendment
    const amendment = await db.pendingAmendment.findUnique({ where: { id } })
    if (!amendment) {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }

    if (amendment.status !== 'Pending') {
      return NextResponse.json({ error: 'Amendment already reviewed' }, { status: 400 })
    }

    // If approved, apply the change to the original record
    if (status === 'Approved') {
      try {
        await applyAmendment(amendment.recordType, amendment.recordId, amendment.field, amendment.newValue)
      } catch (err: any) {
        return NextResponse.json(
          { error: `Failed to apply amendment: ${err.message}` },
          { status: 500 }
        )
      }
    }

    // Update amendment status
    const updated = await db.pendingAmendment.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update amendment' }, { status: 500 })
  }
}
