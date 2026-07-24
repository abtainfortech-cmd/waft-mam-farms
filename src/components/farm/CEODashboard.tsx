'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Building2, Egg, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Bird, Activity, ChevronRight,
  RefreshCw, MapPin, AlertCircle, CheckCircle2, Clock, Shield
} from 'lucide-react'

const COLORS = ['#16a34a', '#ea580c', '#2563eb', '#9333ea', '#e11d48', '#ca8a04', '#06b6d4', '#84cc16']

interface DashboardData {
  totalFarms: number
  totalBirds: number
  totalFlocks: number
  today: { eggCrates: number; totalEggs: number }
  thisWeek: { eggCrates: number; mortality: number }
  thisMonth: {
    eggCrates: number; eggsSold: number; eggRevenue: number; birdsSold: number; birdRevenue: number
    totalRevenue: number; expenses: number; profit: number; mortality: number
    expenseByCategory: Record<string, number>
  }
  overdueVaccinations: any[]
  upcomingVaccinations: any[]
  unpaidAccounts: { receivable: number; payable: number; unpaidEggSales: number; unpaidBirdSales: number; unpaidExpenses: number }
  dailyEggTrend: { date: string; crates: number; eggs: number }[]
  farmBreakdown: any[]
}

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CEODashboard() {
  const { selectedFarmId } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  const expensePieData = Object.entries(data.thisMonth.expenseByCategory).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
  const hasExpenses = expensePieData.length > 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Alerts Banner */}
      {(data.overdueVaccinations.length > 0 || data.unpaidAccounts.receivable > 0 || data.unpaidAccounts.payable > 0) && (
        <div className="space-y-2">
          {data.overdueVaccinations.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3 flex items-center gap-3">
                <Shield className="h-5 w-5 text-red-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    {data.overdueVaccinations.length} Overdue Vaccination{data.overdueVaccinations.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-red-600">
                    {data.overdueVaccinations.slice(0, 2).map(v => `${v.vaccineName} at ${v.farm?.name}`).join(', ')}
                  </p>
                </div>
                <Badge variant="destructive" className="shrink-0">Urgent</Badge>
              </CardContent>
            </Card>
          )}
          {data.unpaidAccounts.receivable > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Outstanding Receivables: {formatGHS(data.unpaidAccounts.receivable)}
                  </p>
                  <p className="text-xs text-amber-600">
                    {data.unpaidAccounts.unpaidEggSales} egg sales, {data.unpaidAccounts.unpaidBirdSales} bird sales unpaid
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {data.unpaidAccounts.payable > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3 flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">
                    Unpaid Expenses Due: {formatGHS(data.unpaidAccounts.payable)}
                  </p>
                  <p className="text-xs text-orange-600">
                    {data.unpaidAccounts.unpaidExpenses} expense record{data.unpaidAccounts.unpaidExpenses > 1 ? 's' : ''} pending payment
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-green-700" />
              </div>
              <span className="text-xs text-gray-500">Farms</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.totalFarms}</p>
            <p className="text-xs text-gray-500">{data.totalBirds.toLocaleString()} birds across {data.totalFlocks} flocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Egg className="h-4 w-4 text-amber-700" />
              </div>
              <span className="text-xs text-gray-500">Eggs Today</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.today.totalEggs.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{data.today.eggCrates} crates collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-700" />
              </div>
              <span className="text-xs text-gray-500">Monthly Revenue</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{formatGHS(data.thisMonth.totalRevenue)}</p>
            <p className="text-xs text-gray-500">Profit: {formatGHS(data.thisMonth.profit)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-red-700" />
              </div>
              <span className="text-xs text-gray-500">Mortality (Week)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.thisWeek.mortality}</p>
            <p className="text-xs text-gray-500">This month: {data.thisMonth.mortality} birds lost</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Weekly Egg Collection</p>
            <p className="text-xl font-bold text-gray-900">{data.thisWeek.eggCrates} crates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Monthly Egg Sales</p>
            <p className="text-xl font-bold text-gray-900">{data.thisMonth.eggsSold.toLocaleString()} eggs</p>
            <p className="text-xs text-emerald-600">{formatGHS(data.thisMonth.eggRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Birds Sold (Month)</p>
            <p className="text-xl font-bold text-gray-900">{data.thisMonth.birdsSold}</p>
            <p className="text-xs text-emerald-600">{formatGHS(data.thisMonth.birdRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Monthly Expenses</p>
            <p className="text-xl font-bold text-red-600">{formatGHS(data.thisMonth.expenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Farm Breakdown */}
      <Tabs defaultValue="production" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="production">Egg Production</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
          <TabsTrigger value="farms">Farm Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="production">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Egg Production (Last 7 Days)</CardTitle>
              <CardDescription>Crates collected per day across all farms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyEggTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`${value} crates`, 'Eggs']} />
                    <Bar dataKey="crates" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Expense Categories (This Month)</CardTitle>
              <CardDescription>Distribution of farm expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              {hasExpenses ? (
                <div className="h-64 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {expensePieData.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatGHS(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">No expense data for this period</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farms">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Farm Performance Overview</CardTitle>
              <CardDescription>Per-farm revenue, expenses, and profit this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {data.farmBreakdown.map((farm: any) => (
                    <div key={farm.farmId} className="border rounded-lg p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-semibold text-sm">{farm.farmName}</p>
                          <p className="text-xs text-gray-500">{farm.location}</p>
                        </div>
                        <Badge className="ml-auto" variant={farm.monthProfit >= 0 ? 'default' : 'destructive'}>
                          {formatGHS(farm.monthProfit)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Birds</p>
                          <p className="font-medium">{farm.birdCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Egg Crates</p>
                          <p className="font-medium">{farm.monthEggCrates}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Revenue</p>
                          <p className="font-medium text-emerald-700">{formatGHS(farm.monthEggRevenue + farm.monthBirdRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expenses</p>
                          <p className="font-medium text-red-600">{formatGHS(farm.monthExpenses)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vaccination Alerts & Upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Overdue Vaccinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.overdueVaccinations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No overdue vaccinations</p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {data.overdueVaccinations.map((v: any) => (
                    <div key={v.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm">
                      <Badge variant="destructive">Overdue</Badge>
                      <div className="flex-1">
                        <p className="font-medium">{v.vaccineName}</p>
                        <p className="text-xs text-gray-500">{v.flock?.name} at {v.farm?.name}</p>
                      </div>
                      <p className="text-xs text-red-600">Due: {new Date(v.scheduledDate).toLocaleDateString('en-GB')}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Upcoming Vaccinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingVaccinations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No upcoming vaccinations</p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {data.upcomingVaccinations.map((v: any) => (
                    <div key={v.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-sm">
                      <Badge variant="secondary">Scheduled</Badge>
                      <div className="flex-1">
                        <p className="font-medium">{v.vaccineName}</p>
                        <p className="text-xs text-gray-500">{v.flock?.name} at {v.farm?.name}</p>
                      </div>
                      <p className="text-xs text-green-600">{new Date(v.scheduledDate).toLocaleDateString('en-GB')}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>
    </div>
  )
}
