import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const dateFrom = request.nextUrl.searchParams.get('dateFrom')
    const dateTo = request.nextUrl.searchParams.get('dateTo')
    const farmId = request.nextUrl.searchParams.get('farmId')

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: 'dateFrom and dateTo are required' }, { status: 400 })
    }

    const startDate = new Date(dateFrom + 'T00:00:00.000Z')
    const endDate = new Date(dateTo + 'T23:59:59.999Z')

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
    }

    // Build farm filter
    const farmFilter: Record<string, unknown> = {}
    if (farmId) farmFilter.farmId = farmId

    const dateFilter = { gte: startDate, lte: endDate }

    // Fetch all relevant data in parallel
    const [eggSales, birdSales, expenses, eggCollections] = await Promise.all([
      db.eggSale.findMany({
        where: { date: dateFilter, ...farmFilter },
        include: { customer: true },
        orderBy: { date: 'desc' },
      }),
      db.birdSale.findMany({
        where: { date: dateFilter, ...farmFilter },
        include: { customer: true },
        orderBy: { date: 'desc' },
      }),
      db.expense.findMany({
        where: { date: dateFilter, ...farmFilter },
        orderBy: { date: 'desc' },
      }),
      db.dailyEggCollection.findMany({
        where: { date: dateFilter, ...farmFilter },
        include: { farm: true },
        orderBy: { date: 'desc' },
      }),
    ])

    // Calculate totals
    const totalEggRevenue = eggSales.reduce((s, e) => s + e.totalAmount, 0)
    const totalEggAmountPaid = eggSales.reduce((s, e) => s + e.amountPaid, 0)
    const totalEggCrates = eggSales.reduce((s, e) => s + e.crateCount, 0)
    const totalEggsSold = eggSales.reduce((s, e) => s + (e.crateCount * e.eggsPerCrate), 0)
    const unpaidEggSales = eggSales.filter(e => e.paymentStatus !== 'Paid')
    const eggReceivable = unpaidEggSales.reduce((s, e) => s + (e.totalAmount - e.amountPaid), 0)

    const totalBirdRevenue = birdSales.reduce((s, e) => s + e.totalAmount, 0)
    const totalBirdAmountPaid = birdSales.reduce((s, e) => s + e.amountPaid, 0)
    const totalBirdsSold = birdSales.reduce((s, e) => s + e.quantity, 0)
    const unpaidBirdSales = birdSales.filter(e => e.paymentStatus !== 'Paid')
    const birdReceivable = unpaidBirdSales.reduce((s, e) => s + (e.totalAmount - e.amountPaid), 0)

    const totalRevenue = totalEggRevenue + totalBirdRevenue
    const totalAmountPaid = totalEggAmountPaid + totalBirdAmountPaid
    const totalReceivable = eggReceivable + birdReceivable

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const unpaidExpenses = expenses.filter(e => e.paymentStatus !== 'Paid')
    const totalPayable = unpaidExpenses.reduce((s, e) => s + e.amount, 0)

    const profit = totalRevenue - totalExpenses
    const netCashFlow = totalAmountPaid - (totalExpenses - totalPayable)

    // Expense breakdown by category
    const expenseByCategory: Record<string, number> = {}
    for (const e of expenses) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    }

    // Egg production summary
    const totalEggCratesCollected = eggCollections.reduce((s, e) => s + e.crateCount, 0)
    const totalEggsCollected = eggCollections.reduce((s, e) => s + (e.crateCount * e.eggsPerCrate), 0)
    const totalBrokenEggs = eggCollections.reduce((s, e) => s + e.brokenCount, 0)
    const totalSoiledEggs = eggCollections.reduce((s, e) => s + e.soiledCount, 0)

    return NextResponse.json({
      period: {
        dateFrom: dateFrom,
        dateTo: dateTo,
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1,
      },
      revenue: {
        eggSales: {
          count: eggSales.length,
          crates: totalEggCrates,
          eggs: totalEggsSold,
          total: totalEggRevenue,
          amountPaid: totalEggAmountPaid,
          receivable: eggReceivable,
          unpaid: unpaidEggSales.length,
        },
        birdSales: {
          count: birdSales.length,
          birds: totalBirdsSold,
          total: totalBirdRevenue,
          amountPaid: totalBirdAmountPaid,
          receivable: birdReceivable,
          unpaid: unpaidBirdSales.length,
        },
        total: totalRevenue,
        totalPaid: totalAmountPaid,
        totalReceivable,
      },
      expenses: {
        count: expenses.length,
        total: totalExpenses,
        byCategory: expenseByCategory,
        totalPayable,
        unpaid: unpaidExpenses.length,
      },
      production: {
        eggCratesCollected: totalEggCratesCollected,
        eggsCollected: totalEggsCollected,
        brokenEggs: totalBrokenEggs,
        soiledEggs: totalSoiledEggs,
      },
      profit,
      netCashFlow,
      // Detailed records for the statement table
      eggSalesRecords: eggSales.map(e => ({
        id: e.id,
        date: e.date,
        customer: e.customer?.name || 'Walk-in',
        crates: e.crateCount,
        eggsPerCrate: e.eggsPerCrate,
        pricePerCrate: e.pricePerCrate,
        total: e.totalAmount,
        paymentStatus: e.paymentStatus,
        amountPaid: e.amountPaid,
      })),
      birdSalesRecords: birdSales.map(b => ({
        id: b.id,
        date: b.date,
        customer: b.customer?.name || 'Walk-in',
        quantity: b.quantity,
        pricePerBird: b.pricePerBird,
        total: b.totalAmount,
        paymentStatus: b.paymentStatus,
        amountPaid: b.amountPaid,
      })),
      expenseRecords: expenses.map(e => ({
        id: e.id,
        date: e.date,
        category: e.category,
        description: e.description,
        amount: e.amount,
        paymentStatus: e.paymentStatus,
        vendor: e.vendor,
      })),
    })
  } catch (error: any) {
    console.error('Statement API error:', error.message)
    return NextResponse.json({ error: 'Failed to generate statement', detail: error.message }, { status: 500 })
  }
}
