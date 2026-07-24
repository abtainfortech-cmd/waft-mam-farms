import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const farmId = request.nextUrl.searchParams.get('farmId')
  const category = request.nextUrl.searchParams.get('category')
  const dateFrom = request.nextUrl.searchParams.get('dateFrom')
  const dateTo = request.nextUrl.searchParams.get('dateTo')
  const paymentStatus = request.nextUrl.searchParams.get('paymentStatus')

  const where: Record<string, unknown> = {}
  if (farmId) where.farmId = farmId
  if (category) where.category = category
  if (paymentStatus) where.paymentStatus = paymentStatus
  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo)
  }

  try {
    const expenses = await db.expense.findMany({
      where,
      include: { farm: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const expense = await db.expense.create({ data: body })
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const expense = await db.expense.update({ where: { id }, data })
    return NextResponse.json(expense)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}
