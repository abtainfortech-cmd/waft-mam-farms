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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sale = await db.birdSale.create({ data: body })
    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bird sale' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const sale = await db.birdSale.update({ where: { id }, data })
    return NextResponse.json(sale)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update bird sale' }, { status: 500 })
  }
}
