import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Farm count & flocks
    const farms = await db.farm.findMany({
      where: { isActive: true },
      include: {
        flocks: { where: { isActive: true } },
      },
    })
    const totalFarms = farms.length
    const allFlocks = farms.flatMap(f => f.flocks)
    const totalBirds = allFlocks.reduce((sum, f) => sum + f.birdCount, 0)

    // Eggs collected today
    const eggsToday = await db.dailyEggCollection.findMany({ where: { date: { gte: today } } })
    const todayEggCrates = eggsToday.reduce((s, e) => s + e.crateCount, 0)
    const todayEggs = eggsToday.reduce((s, e) => s + (e.crateCount * e.eggsPerCrate), 0)

    // Eggs this week
    const eggsWeek = await db.dailyEggCollection.findMany({ where: { date: { gte: weekAgo } } })
    const weekEggCrates = eggsWeek.reduce((s, e) => s + e.crateCount, 0)

    // Eggs this month
    const eggsMonth = await db.dailyEggCollection.findMany({ where: { date: { gte: monthAgo } } })
    const monthEggCrates = eggsMonth.reduce((s, e) => s + e.crateCount, 0)

    // Egg sales this month
    const eggSalesMonth = await db.eggSale.findMany({ where: { date: { gte: monthAgo } } })
    const monthEggRevenue = eggSalesMonth.reduce((s, e) => s + e.totalAmount, 0)
    const monthEggsSold = eggSalesMonth.reduce((s, e) => s + (e.crateCount * e.eggsPerCrate), 0)

    // Bird sales this month
    const birdSalesMonth = await db.birdSale.findMany({ where: { date: { gte: monthAgo } } })
    const monthBirdRevenue = birdSalesMonth.reduce((s, e) => s + e.totalAmount, 0)
    const monthBirdsSold = birdSalesMonth.reduce((s, e) => s + e.quantity, 0)

    // Mortality this week
    const mortalityWeek = await db.birdMortality.findMany({ where: { date: { gte: weekAgo } } })
    const weekMortality = mortalityWeek.reduce((s, m) => s + m.count, 0)

    // Mortality this month
    const mortalityMonth = await db.birdMortality.findMany({ where: { date: { gte: monthAgo } } })
    const monthMortality = mortalityMonth.reduce((s, m) => s + m.count, 0)

    // Expenses this month
    const expensesMonth = await db.expense.findMany({ where: { date: { gte: monthAgo } } })
    const monthExpenses = expensesMonth.reduce((s, e) => s + e.amount, 0)
    const unpaidExpenses = expensesMonth.filter(e => e.paymentStatus !== 'Paid')
    const unpaidExpensesTotal = unpaidExpenses.reduce((s, e) => s + e.amount, 0)

    // Unpaid sales (accounts receivable)
    const unpaidEggSales = eggSalesMonth.filter(e => e.paymentStatus !== 'Paid')
    const unpaidEggSalesTotal = unpaidEggSales.reduce((s, e) => s + (e.totalAmount - e.amountPaid), 0)
    const unpaidBirdSales = birdSalesMonth.filter(e => e.paymentStatus !== 'Paid')
    const unpaidBirdSalesTotal = unpaidBirdSales.reduce((s, e) => s + (e.totalAmount - e.amountPaid), 0)

    // Overdue vaccinations (past scheduled date, not completed)
    const vaccinations = await db.vaccination.findMany({
      where: { status: { in: ['Scheduled', 'Overdue'] } },
      include: { flock: true, farm: true },
      orderBy: { scheduledDate: 'asc' },
    })
    const overdueVaccinations = vaccinations.filter(v => {
      const d = new Date(v.scheduledDate)
      return d <= now && v.status !== 'Completed'
    })
    // Mark overdue
    for (const v of overdueVaccinations) {
      if (v.status === 'Scheduled') {
        await db.vaccination.update({ where: { id: v.id }, data: { status: 'Overdue' } })
      }
    }

    // Expense breakdown by category
    const expenseByCategory: Record<string, number> = {}
    for (const e of expensesMonth) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    }

    // Daily egg production trend (last 7 days)
    const dailyEggTrend: { date: string; crates: number; eggs: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000)
      const dayRecords = eggsMonth.filter(e => {
        const d = new Date(e.date)
        return d >= day && d < nextDay
      })
      dailyEggTrend.push({
        date: day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
        crates: dayRecords.reduce((s, e) => s + e.crateCount, 0),
        eggs: dayRecords.reduce((s, e) => s + (e.crateCount * e.eggsPerCrate), 0),
      })
    }

    // Upcoming vaccinations (next 14 days)
    const upcomingVaccinations = vaccinations.filter(v => {
      const d = new Date(v.scheduledDate)
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      return d > now && d <= twoWeeks && v.status !== 'Completed'
    })

    // Per-farm breakdown
    const farmBreakdown = await Promise.all(farms.map(async (farm) => {
      const farmEggCollections = await db.dailyEggCollection.findMany({
        where: { farmId: farm.id, date: { gte: monthAgo } },
      })
      const farmEggSales = await db.eggSale.findMany({ where: { farmId: farm.id, date: { gte: monthAgo } } })
      const farmBirdSales = await db.birdSale.findMany({ where: { farmId: farm.id, date: { gte: monthAgo } } })
      const farmExpenses = await db.expense.findMany({ where: { farmId: farm.id, date: { gte: monthAgo } } })
      const farmMortality = await db.birdMortality.findMany({ where: { farmId: farm.id, date: { gte: monthAgo } } })

      return {
        farmId: farm.id,
        farmName: farm.name,
        location: farm.location,
        birdCount: farm.flocks.reduce((s, f) => s + f.birdCount, 0),
        flocks: farm.flocks.length,
        monthEggCrates: farmEggCollections.reduce((s, e) => s + e.crateCount, 0),
        monthEggRevenue: farmEggSales.reduce((s, e) => s + e.totalAmount, 0),
        monthBirdRevenue: farmBirdSales.reduce((s, e) => s + e.totalAmount, 0),
        monthExpenses: farmExpenses.reduce((s, e) => s + e.amount, 0),
        monthMortality: farmMortality.reduce((s, e) => s + e.count, 0),
        monthProfit: farmEggSales.reduce((s, e) => s + e.totalAmount, 0) +
          farmBirdSales.reduce((s, e) => s + e.totalAmount, 0) -
          farmExpenses.reduce((s, e) => s + e.amount, 0),
      }
    }))

    return NextResponse.json({
      totalFarms,
      totalBirds,
      totalFlocks: allFlocks.length,
      today: {
        eggCrates: todayEggCrates,
        totalEggs: todayEggs,
      },
      thisWeek: {
        eggCrates: weekEggCrates,
        mortality: weekMortality,
      },
      thisMonth: {
        eggCrates: monthEggCrates,
        eggsSold: monthEggsSold,
        eggRevenue: monthEggRevenue,
        birdsSold: monthBirdsSold,
        birdRevenue: monthBirdRevenue,
        totalRevenue: monthEggRevenue + monthBirdRevenue,
        expenses: monthExpenses,
        profit: monthEggRevenue + monthBirdRevenue - monthExpenses,
        mortality: monthMortality,
        expenseByCategory,
      },
      overdueVaccinations,
      upcomingVaccinations,
      unpaidAccounts: {
        receivable: unpaidEggSalesTotal + unpaidBirdSalesTotal,
        payable: unpaidExpensesTotal,
        unpaidEggSales: unpaidEggSales.length,
        unpaidBirdSales: unpaidBirdSales.length,
        unpaidExpenses: unpaidExpenses.length,
      },
      dailyEggTrend,
      farmBreakdown,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
