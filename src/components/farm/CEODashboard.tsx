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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Building2, Egg, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Bird, Activity, ChevronRight,
  RefreshCw, MapPin, AlertCircle, CheckCircle2, Clock, Shield, Trash2, Loader2,
  Crown, Settings, RotateCcw, Users, Megaphone, FileText, Download
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

  // Financial Statement state
  const [stmtFrom, setStmtFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [stmtTo, setStmtTo] = useState(() => new Date().toISOString().split('T')[0])
  const [stmtFarmId, setStmtFarmId] = useState('')
  const [stmtLoading, setStmtLoading] = useState(false)
  const [stmtData, setStmtData] = useState<any>(null)
  const [stmtFarms, setStmtFarms] = useState<{ id: string; name: string }[]>([])

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

  // Fetch farms list for statement filter
  useEffect(() => {
    fetch('/api/farms').then(r => r.ok ? r.json() : []).then(setStmtFarms).catch(() => {})
  }, [])

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

  // Generate financial statement
  const generateStatement = async () => {
    if (!stmtFrom || !stmtTo) { toast.error('Please select both dates'); return }
    setStmtLoading(true)
    setStmtData(null)
    try {
      const params = new URLSearchParams({ dateFrom: stmtFrom, dateTo: stmtTo })
      if (stmtFarmId) params.set('farmId', stmtFarmId)
      const res = await fetch(`/api/statement?${params}`)
      if (res.ok) {
        const json = await res.json()
        setStmtData(json)
        toast.success(`Statement generated for ${stmtFrom} to ${stmtTo}`)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to generate statement')
      }
    } catch (err) { console.error(err); toast.error('Network error') }
    finally { setStmtLoading(false) }
  }

  // Export statement as CSV
  const exportStatementCSV = () => {
    if (!stmtData) return
    const lines: string[] = []
    lines.push(`FINANCIAL STATEMENT: ${stmtData.period.dateFrom} to ${stmtData.period.dateTo} (${stmtData.period.days} days)`)
    lines.push('')
    lines.push('=== REVENUE ===')
    lines.push(`Egg Sales: ${stmtData.revenue.eggSales.count} transactions, ${stmtData.revenue.eggSales.crates} crates, ${stmtData.revenue.eggSales.eggs} eggs`) 
    lines.push(`Egg Revenue: GHS ${stmtData.revenue.eggSales.total.toFixed(2)} (Paid: GHS ${stmtData.revenue.eggSales.amountPaid.toFixed(2)}, Owing: GHS ${stmtData.revenue.eggSales.receivable.toFixed(2)})`)
    lines.push(`Bird Sales: ${stmtData.revenue.birdSales.count} transactions, ${stmtData.revenue.birdSales.birds} birds`)
    lines.push(`Bird Revenue: GHS ${stmtData.revenue.birdSales.total.toFixed(2)} (Paid: GHS ${stmtData.revenue.birdSales.amountPaid.toFixed(2)}, Owing: GHS ${stmtData.revenue.birdSales.receivable.toFixed(2)})`)
    lines.push('')
    lines.push(`TOTAL REVENUE: GHS ${stmtData.revenue.total.toFixed(2)}`)
    lines.push(`Total Paid: GHS ${stmtData.revenue.totalPaid.toFixed(2)}`)
    lines.push(`Total Receivable (Owing): GHS ${stmtData.revenue.totalReceivable.toFixed(2)}`)
    lines.push('')
    lines.push('=== EXPENSES ===')
    lines.push(`Total Expenses: GHS ${stmtData.expenses.total.toFixed(2)} (${stmtData.expenses.count} records)`)
    lines.push(`Unpaid Expenses (Payable): GHS ${stmtData.expenses.totalPayable.toFixed(2)} (${stmtData.expenses.unpaid} records)`)
    for (const [cat, amt] of Object.entries(stmtData.expenses.byCategory)) {
      lines.push(`  ${cat}: GHS ${(amt as number).toFixed(2)}`)
    }
    lines.push('')
    lines.push(`GROSS PROFIT: GHS ${stmtData.profit.toFixed(2)}`)
    lines.push(`NET CASH FLOW: GHS ${stmtData.netCashFlow.toFixed(2)}`)
    lines.push('')
    lines.push('=== PRODUCTION ===')
    lines.push(`Egg Crates Collected: ${stmtData.production.eggCratesCollected}`)
    lines.push(`Total Eggs Collected: ${stmtData.production.eggsCollected}`)
    lines.push(`Broken Eggs: ${stmtData.production.brokenEggs}`)
    lines.push(`Soiled Eggs: ${stmtData.production.soiledEggs}`)
    lines.push('')
    lines.push('--- Generated by WAFT MAM Farms Management System ---')
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statement_${stmtFrom}_to_${stmtTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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

      {/* Financial Statement Query */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-blue-800">
            <FileText className="h-4 w-4" />
            Financial Statement
          </CardTitle>
          <CardDescription className="text-xs text-blue-700">
            Generate a revenue & expense statement for any date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
            <div>
              <Label className="text-xs">From Date *</Label>
              <Input type="date" value={stmtFrom} onChange={e => setStmtFrom(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">To Date *</Label>
              <Input type="date" value={stmtTo} onChange={e => setStmtTo(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Farm</Label>
              <Select value={stmtFarmId || 'all'} onValueChange={(v) => setStmtFarmId(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Farms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Farms</SelectItem>
                  {stmtFarms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button type="button" onClick={generateStatement} disabled={stmtLoading} className="w-full h-9 text-xs gap-1.5">
                {stmtLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                {stmtLoading ? 'Loading...' : 'Generate'}
              </Button>
            </div>
            {stmtData && (
              <div>
                <Button type="button" variant="outline" onClick={exportStatementCSV} className="w-full h-9 text-xs gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>

          {/* Statement Results */}
          {stmtData && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-blue-200" />
                <span className="text-[10px] font-bold tracking-[0.15em] text-blue-600 uppercase">
                  Statement: {stmtData.period.dateFrom} to {stmtData.period.dateTo} ({stmtData.period.days} days)
                </span>
                <div className="h-px flex-1 bg-blue-200" />
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-[10px] text-gray-500 uppercase">Total Revenue</p>
                  <p className="text-lg font-bold text-green-700">{formatGHS(stmtData.revenue.total)}</p>
                  <p className="text-[10px] text-gray-400">Paid: {formatGHS(stmtData.revenue.totalPaid)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-[10px] text-gray-500 uppercase">Total Expenses</p>
                  <p className="text-lg font-bold text-red-600">{formatGHS(stmtData.expenses.total)}</p>
                  <p className="text-[10px] text-gray-400">{stmtData.expenses.count} records</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-[10px] text-gray-500 uppercase">Gross Profit</p>
                  <p className={`text-lg font-bold ${stmtData.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatGHS(stmtData.profit)}</p>
                  <p className="text-[10px] text-gray-400">Revenue - Expenses</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="text-[10px] text-gray-500 uppercase">Outstanding</p>
                  <p className="text-lg font-bold text-amber-700">{formatGHS(stmtData.revenue.totalReceivable + stmtData.expenses.totalPayable)}</p>
                  <p className="text-[10px] text-gray-400">Receivable + Payable</p>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-green-800">
                    <DollarSign className="h-3.5 w-3.5" /> Revenue Breakdown
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-gray-600">Egg Sales ({stmtData.revenue.eggSales.count} txns, {stmtData.revenue.eggSales.crates} crates)</span><span className="font-medium">{formatGHS(stmtData.revenue.eggSales.total)}</span></div>
                    <div className="flex justify-between pl-2"><span className="text-gray-400">Paid</span><span className="text-green-600">{formatGHS(stmtData.revenue.eggSales.amountPaid)}</span></div>
                    {stmtData.revenue.eggSales.unpaid > 0 && <div className="flex justify-between pl-2"><span className="text-gray-400">Owing ({stmtData.revenue.eggSales.unpaid} txns)</span><span className="text-red-500">{formatGHS(stmtData.revenue.eggSales.receivable)}</span></div>}
                    <div className="border-t pt-1.5 mt-1.5 flex justify-between"><span className="text-gray-600">Bird Sales ({stmtData.revenue.birdSales.count} txns, {stmtData.revenue.birdSales.birds} birds)</span><span className="font-medium">{formatGHS(stmtData.revenue.birdSales.total)}</span></div>
                    <div className="flex justify-between pl-2"><span className="text-gray-400">Paid</span><span className="text-green-600">{formatGHS(stmtData.revenue.birdSales.amountPaid)}</span></div>
                    {stmtData.revenue.birdSales.unpaid > 0 && <div className="flex justify-between pl-2"><span className="text-gray-400">Owing ({stmtData.revenue.birdSales.unpaid} txns)</span><span className="text-red-500">{formatGHS(stmtData.revenue.birdSales.receivable)}</span></div>}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-red-800">
                    <TrendingDown className="h-3.5 w-3.5" /> Expense Breakdown
                  </p>
                  {Object.keys(stmtData.expenses.byCategory).length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No expenses in this period</p>
                  ) : (
                    <div className="space-y-1 text-xs">
                      {Object.entries(stmtData.expenses.byCategory).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between"><span className="text-gray-600">{cat}</span><span className="font-medium text-red-600">{formatGHS(amt as number)}</span></div>
                      ))}
                    </div>
                  )}
                  <div className="border-t mt-2 pt-1.5 flex justify-between text-xs"><span className="text-gray-500">Unpaid (Payable)</span><span className="font-medium text-amber-600">{formatGHS(stmtData.expenses.totalPayable)}</span></div>
                </div>
              </div>

              {/* Production Summary */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-amber-800">
                  <Egg className="h-3.5 w-3.5" /> Production Summary
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div><span className="text-gray-400">Crates Collected</span><p className="font-semibold">{stmtData.production.eggCratesCollected}</p></div>
                  <div><span className="text-gray-400">Total Eggs</span><p className="font-semibold">{stmtData.production.eggsCollected}</p></div>
                  <div><span className="text-gray-400">Broken</span><p className="font-semibold text-red-500">{stmtData.production.brokenEggs}</p></div>
                  <div><span className="text-gray-400">Soiled</span><p className="font-semibold text-amber-500">{stmtData.production.soiledEggs}</p></div>
                </div>
              </div>
            </div>
          )}
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
