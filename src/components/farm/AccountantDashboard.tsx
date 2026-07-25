'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts'
import { LiveSyncIndicator } from '@/components/farm/LiveSyncIndicator'
import {
  Calculator, Plus, DollarSign, TrendingUp, TrendingDown, AlertCircle, FileText, CreditCard, Receipt
} from 'lucide-react'

const COLORS = ['#16a34a', '#ea580c', '#2563eb', '#9333ea', '#e11d48', '#ca8a04', '#06b6d4', '#84cc16']

interface Farm { id: string; name: string }
interface Expense { id: string; date: string; category: string; description: string; amount: number; paymentStatus: string; dueDate: string | null; vendor: string; farm: { name: string } }

function formatGHS(n: number) { return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

export function AccountantDashboard() {
  const { selectedFarmId, setFarm } = useAppStore()
  const [farms, setFarms] = useState<Farm[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [eggSales, setEggSales] = useState<any[]>([])
  const [birdSales, setBirdSales] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form Select state (Radix Select doesn't use native form elements)
  const [expFarmId, setExpFarmId] = useState(selectedFarmId || '')
  const [expCategory, setExpCategory] = useState('')
  const [expPaymentStatus, setExpPaymentStatus] = useState('Paid')

  useEffect(() => {
    if (selectedFarmId) setExpFarmId(selectedFarmId)
  }, [selectedFarmId])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [farmsRes, expRes, eggsRes, birdsRes, dashRes] = await Promise.all([
        fetch('/api/farms'),
        fetch(`/api/expenses${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/sales/eggs${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/sales/birds${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch('/api/dashboard'),
      ])
      if (farmsRes.ok) setFarms(await farmsRes.json())
      if (expRes.ok) setExpenses(await expRes.json())
      if (eggsRes.ok) setEggSales(await eggsRes.json())
      if (birdsRes.ok) setBirdSales(await birdsRes.json())
      if (dashRes.ok) setDashboard(await dashRes.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedFarmId])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh: Accountant sees sales data from sales team in real-time
  const handleAutoData = useCallback((results: any[]) => {
    if (results && results.length >= 5) {
      setFarms(results[0] || [])
      setExpenses(results[1] || [])
      setEggSales(results[2] || [])
      setBirdSales(results[3] || [])
      setDashboard(results[4] || null)
    }
  }, [])

  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const filteredExpenses = expenses.filter(e => new Date(e.date).toISOString().split('T')[0] >= monthAgo)
  const filteredEggSales = eggSales.filter(e => new Date(e.date).toISOString().split('T')[0] >= monthAgo)
  const filteredBirdSales = birdSales.filter(e => new Date(e.date).toISOString().split('T')[0] >= monthAgo)

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)
  const totalEggRev = filteredEggSales.reduce((s, e) => s + e.totalAmount, 0)
  const totalBirdRev = filteredBirdSales.reduce((s, e) => s + e.totalAmount, 0)
  const totalRevenue = totalEggRev + totalBirdRev
  const totalProfit = totalRevenue - totalExpenses

  const unpaidExpenses = filteredExpenses.filter(e => e.paymentStatus !== 'Paid')
  const unpaidExpTotal = unpaidExpenses.reduce((s, e) => s + e.amount, 0)
  const unpaidReceivable = filteredEggSales.filter(e => e.paymentStatus !== 'Paid').reduce((s, e) => s + (e.totalAmount - e.amountPaid), 0)
    + filteredBirdSales.filter(e => e.paymentStatus !== 'Paid').reduce((s, e) => s + (e.totalAmount - e.amountPaid), 0)

  const expByCategory = dashboard?.thisMonth?.expenseByCategory || {}
  const expPieData = Object.entries(expByCategory).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))

  const today = new Date().toISOString().split('T')[0]

  const submitExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    try {
      const data = {
        farmId: expFarmId,
        date: (f.elements.namedItem('date') as HTMLInputElement).value || today,
        category: expCategory,
        description: (f.elements.namedItem('description') as HTMLInputElement).value,
        amount: parseFloat((f.elements.namedItem('amount') as HTMLInputElement).value) || 0,
        paymentStatus: expPaymentStatus,
        dueDate: (f.elements.namedItem('dueDate') as HTMLInputElement).value || null,
        vendor: (f.elements.namedItem('vendor') as HTMLInputElement).value || null,
        receiptNo: (f.elements.namedItem('receiptNo') as HTMLInputElement).value || null,
        recordedBy: 'Accountant',
      }
      if (!data.farmId || !data.category) { toast.error('Please select farm and category'); return }
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { toast.success('Expense recorded!'); f.reset(); fetchData() }
      else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Failed to record expense') }
    } catch (err) { console.error(err); toast.error('Failed to record expense') }
  }

  if (loading && !dashboard) return <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Payment Alerts */}
      {(unpaidExpTotal > 0 || unpaidReceivable > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {unpaidExpTotal > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3 flex items-center gap-3">
                <Receipt className="h-5 w-5 text-red-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Payments Due: {formatGHS(unpaidExpTotal)}</p>
                  <p className="text-xs text-red-600">{unpaidExpenses.length} unpaid expense record{unpaidExpenses.length > 1 ? 's' : ''}</p>
                </div>
                <Badge variant="destructive">Action Needed</Badge>
              </CardContent>
            </Card>
          )}
          {unpaidReceivable > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Receivables Outstanding: {formatGHS(unpaidReceivable)}</p>
                  <p className="text-xs text-amber-600">Money owed from customers</p>
                </div>
                <Badge variant="secondary">Follow Up</Badge>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-500">Total Revenue</span>
            </div>
            <p className="text-xl font-bold text-green-700">{formatGHS(totalRevenue)}</p>
            <p className="text-xs text-gray-500">Eggs: {formatGHS(totalEggRev)} · Birds: {formatGHS(totalBirdRev)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-500">Total Expenses</span>
            </div>
            <p className="text-xl font-bold text-red-600">{formatGHS(totalExpenses)}</p>
            <p className="text-xs text-gray-500">{filteredExpenses.length} expense records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-gray-500">Net Profit</span>
            </div>
            <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatGHS(totalProfit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-gray-500">Payments Due</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{formatGHS(unpaidExpTotal)}</p>
            <p className="text-xs text-gray-500">Receivable: {formatGHS(unpaidReceivable)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Farm Filter */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-gray-500">Farm:</Label>
        <Select value={selectedFarmId || 'all'} onValueChange={(v) => setFarm(v === 'all' ? null : v)}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="All Farms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Farms</SelectItem>
            {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <LiveSyncIndicator
        endpoints={['/api/farms', `/api/expenses${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/sales/eggs${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/sales/birds${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, '/api/dashboard']}
        interval={15000}
        onData={handleAutoData}
        compact
      />

      <Tabs defaultValue="record" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="record"><Plus className="h-3 w-3 mr-1" />Record</TabsTrigger>
          <TabsTrigger value="expenses"><FileText className="h-3 w-3 mr-1" />Expenses</TabsTrigger>
          <TabsTrigger value="revenue"><TrendingUp className="h-3 w-3 mr-1" />Revenue</TabsTrigger>
          <TabsTrigger value="analysis"><Calculator className="h-3 w-3 mr-1" />Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="record">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitExpense} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Farm *</Label>
                  <Select value={expFarmId} onValueChange={setExpFarmId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Category *</Label>
                  <Select value={expCategory} onValueChange={setExpCategory}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['Feed', 'Medication', 'Utilities', 'Labour', 'Transport', 'Equipment', 'Maintenance', 'Other'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Amount (GHS) *</Label>
                  <Input name="amount" type="number" min="0" step="0.01" required placeholder="e.g. 500" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input name="date" type="date" defaultValue={today} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Payment Status</Label>
                  <Select value={expPaymentStatus} onValueChange={setExpPaymentStatus}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Due Date</Label>
                  <Input name="dueDate" type="date" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Vendor</Label>
                  <Input name="vendor" placeholder="Supplier name" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Receipt No.</Label>
                  <Input name="receiptNo" placeholder="RCP-001" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Description *</Label>
                  <Input name="description" required placeholder="Brief description" className="h-9 text-sm" />
                </div>
                <div className="flex items-end col-span-2 md:col-span-3">
                  <Button type="submit" className="w-full md:w-auto h-9"><Plus className="h-3 w-3 mr-1" />Record Expense</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Expense Records</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {expenses.slice(0, 30).map(e => (
                    <div key={e.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${e.paymentStatus === 'Paid' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{e.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(e.date).toLocaleDateString('en-GB')} · {e.farm?.name} · {e.vendor || 'No vendor'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{e.category}</Badge>
                      <div className="text-right shrink-0">
                        <p className="font-medium">{formatGHS(e.amount)}</p>
                        <Badge variant={e.paymentStatus === 'Paid' ? 'default' : 'destructive'} className="text-[10px]">
                          {e.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No expense records</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Egg Sales Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {eggSales.slice(0, 20).map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg text-sm">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${s.paymentStatus === 'Paid' ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <div className="flex-1">
                          <p className="font-medium">{s.customer?.name || 'Walk-in'}</p>
                          <p className="text-xs text-gray-500">{new Date(s.date).toLocaleDateString('en-GB')} · {s.crateCount} crates</p>
                        </div>
                        <p className="font-medium text-green-700">{formatGHS(s.totalAmount)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Bird Sales Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {birdSales.slice(0, 20).map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg text-sm">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${s.paymentStatus === 'Paid' ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <div className="flex-1">
                          <p className="font-medium">{s.customer?.name || 'Walk-in'}</p>
                          <p className="text-xs text-gray-500">{new Date(s.date).toLocaleDateString('en-GB')} · {s.quantity} birds</p>
                        </div>
                        <p className="font-medium text-blue-700">{formatGHS(s.totalAmount)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="space-y-4">
            {expPieData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Expense Breakdown by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expPieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {expPieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatGHS(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-500">Egg Revenue</p>
                    <p className="text-lg font-bold text-green-700">{formatGHS(totalEggRev)}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-500">Bird Revenue</p>
                    <p className="text-lg font-bold text-blue-700">{formatGHS(totalBirdRev)}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-500">Expenses</p>
                    <p className="text-lg font-bold text-red-600">{formatGHS(totalExpenses)}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${totalProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-500">Net Profit</p>
                    <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatGHS(totalProfit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
