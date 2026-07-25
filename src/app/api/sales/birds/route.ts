import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const farmId = request.nextUrl.searchParams.get('farmId')
  const dateFrom = request.nextUrl.searchParams.get('dateFrom')
  const dateTo = request.nextUrl.searchParams.get('dateTo')
  const status = request.nextUrl.searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (farmId) where.farmId = farmId
  if (status) where.paymentStatus = status
  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo)
  }

  try {
    const sales = await db.birdSale.findMany({
      where,
      include: { customer: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bird sales' }, { status: 500 })
  }
}

function normalizeDate(val: unknown): Date | undefined {
  if (!val) return undefined
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val + 'T00:00:00.000Z')
  if (val instanceof Date) return val
  return new Date(val as string)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (body.date) body.date = normalizeDate(body.date)
    const sale = await db.birdSale.create({ data: body })
    return NextResponse.json(sale, { status: 201 })
  } catch (error: any) {
    console.error('BirdSale POST error:', error.message)
    return NextResponse.json({ error: 'Failed to create bird sale', detail: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, expectedUpdatedAt, ...data } = body

    // Conflict check
    const current = await db.birdSale.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

    if (expectedUpdatedAt) {
      const currentMs = new Date(current.updatedAt).getTime()
      const expectedMs = new Date(expectedUpdatedAt).getTime()
      if (Math.abs(currentMs - expectedMs) > 2000) {
        return NextResponse.json({
          error: 'CONFLICT',
          message: 'This bird sale record was modified by another user. Please review before saving.',
          modifiedBy: current.recordedBy || 'another staff member',
          modifiedAt: current.updatedAt,
          currentData: current,
        }, { status: 409 })
      }
    }

    const sale = await db.birdSale.update({ where: { id }, data })
    return NextResponse.json(sale)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update bird sale' }, { status: 500 })
  }
}
