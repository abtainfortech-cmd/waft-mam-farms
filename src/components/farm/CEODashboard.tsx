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
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { LiveSyncIndicator } from '@/components/farm/LiveSyncIndicator'
import {
  Building2, Egg, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Bird, Activity, ChevronRight,
  RefreshCw, MapPin, AlertCircle, CheckCircle2, Clock, Shield, Trash2, Loader2,
  Crown, Settings, RotateCcw, Users, Megaphone
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
  const { selectedFarmId, currentUser } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetLoading, setResetLoading] = useState<string | null>(null)

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

  // Data Reset for CEO
  const handleDataReset = async (recordType: string) => {
    if (!confirm(`Are you sure you want to reset all ${recordType} records? This will set numeric fields to 0 and clear string fields. This action cannot be undone.`)) {
      return
    }
    setResetLoading(recordType)
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordType, farmId: selectedFarmId || undefined, role: currentUser?.role || 'CEO' }),
      })
      if (res.ok) {
        const result = await res.json()
        toast.success(`Reset ${result.count} ${recordType} records (${result.farmId})`)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to reset data')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setResetLoading(null)
    }
  }

  // Auto-refresh: CEO dashboard polls every 10s for freshest overview
  const handleAutoData = useCallback((dashboardData: any) => {
    if (dashboardData) setData(dashboardData)
  }, [])

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

      {/* CEO Quick Actions — always visible at the top */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800">
            <Crown className="h-4 w-4" />
            CEO Quick Actions
          </CardTitle>
          <CardDescription className="text-xs text-amber-700">
            Manage your farm system — change farm name, add/remove farms, wipe data, or jump to full settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <a href="#" onClick={(e) => { e.preventDefault(); const el = document.querySelector('[data-value="settings"]') as HTMLElement; el?.click(); }}>
              <Button variant="outline" className="w-full h-12 text-xs gap-1.5 bg-white border-amber-200 hover:bg-amber-100">
                <Settings className="h-4 w-4 text-amber-700" />
                <span className="font-medium">Farm Settings</span>
              </Button>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); const el = document.querySelector('[data-value="settings"]') as HTMLElement; el?.click(); setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100); }}>
              <Button variant="outline" className="w-full h-12 text-xs gap-1.5 bg-white border-amber-200 hover:bg-amber-100">
                <RotateCcw className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-700">Full Data Reset</span>
              </Button>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); const el = document.querySelector('[data-value="access"]') as HTMLElement; el?.click(); }}>
              <Button variant="outline" className="w-full h-12 text-xs gap-1.5 bg-white border-amber-200 hover:bg-amber-100">
                <Users className="h-4 w-4 text-blue-700" />
                <span className="font-medium">Manage Staff</span>
              </Button>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); const el = document.querySelector('[data-value="announcements"]') as HTMLElement; el?.click(); }}>
              <Button variant="outline" className="w-full h-12 text-xs gap-1.5 bg-white border-amber-200 hover:bg-amber-100">
                <Megaphone className="h-4 w-4 text-green-700" />
                <span className="font-medium">Post Announcement</span>
              </Button>
            </a>
          </div>
          <p className="text-[10px] text-amber-700 mt-2 text-center">
            ⚠️ "Full Data Reset" wipes ALL records permanently. Use carefully.
          </p>
        </CardContent>
      </Card>

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

      {/* ============================================================
         DANGER ZONE — clearly separated from vaccinations and reports
         All destructive CEO actions live here, never mixed with
         vaccination schedule or other operational content.
      ============================================================ */}
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="h-px flex-1 bg-red-200" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-red-600 uppercase">
            Danger Zone
          </span>
          <div className="h-px flex-1 bg-red-200" />
        </div>

        <Card className="border-2 border-red-300 bg-red-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <Trash2 className="h-4 w-4" />
              Reset Farm Records (CEO Only)
            </CardTitle>
            <CardDescription className="text-xs">
              Reset individual record types to zero, or perform a full wipe of ALL data. These actions are irreversible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Per-record reset buttons */}
            <div>
              <p className="text-[11px] font-medium text-red-700 mb-2">
                Reset individual record types (zeros out numbers, keeps records): 
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['DailyEggCollection', 'BirdMortality', 'FeedRecord', 'EggSale', 'BirdSale', 'Expense', 'Vaccination', 'Treatment', 'HealthCheck'].map(type => {
                  const labels: Record<string, string> = {
                    DailyEggCollection: 'Egg Collections',
                    BirdMortality: 'Mortality Records',
                    FeedRecord: 'Feed Records',
                    EggSale: 'Egg Sales',
                    BirdSale: 'Bird Sales',
                    Expense: 'Expenses',
                    Vaccination: 'Vaccinations',
                    Treatment: 'Treatments',
                    HealthCheck: 'Health Checks',
                  }
                  return (
                    <Button
                      key={type}
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 gap-1 justify-start"
                      disabled={resetLoading === type}
                      onClick={() => handleDataReset(type)}
                    >
                      {resetLoading === type ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Reset {labels[type]}
                    </Button>
                  )
                })}
              </div>
            </div>

            <Separator className="bg-red-200" />

            {/* Full wipe CTA */}
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <p className="text-xs font-medium text-red-900 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Wipe ALL Data (Full Reset)
              </p>
              <p className="text-[11px] text-red-700 mb-2">
                Permanently delete every record, farm, customer, and announcement. Only your CEO account remains. Use this for a fresh start.
              </p>
              <a href="#" onClick={(e) => { e.preventDefault(); const el = document.querySelector('[data-value="settings"]') as HTMLElement; el?.click(); setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100); }}>
                <Button variant="destructive" size="sm" className="h-9 text-xs gap-1.5 w-full sm:w-auto">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Go to Full Data Reset
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 mt-3 mb-3 px-1">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            Operations
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      </div>

      {/* Vaccination Alerts & Upcoming — clearly BELOW the Danger Zone separator */}
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

      {/* Live Sync Bar */}
      <div className="flex items-center justify-between">
        <LiveSyncIndicator
          endpoints={['/api/dashboard']}
          interval={10000}
          onData={handleAutoData}
        />
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>
    </div>
  )
}
