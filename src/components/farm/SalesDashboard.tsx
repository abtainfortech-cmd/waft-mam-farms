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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app'
import { toast } from 'sonner'
import {
  ShoppingBasket, Plus, Bird, DollarSign, Users, AlertCircle, CheckCircle, CreditCard, Package
} from 'lucide-react'

interface Farm { id: string; name: string }
interface Customer { id: string; name: string; phone: string; location: string; customerType: string }
interface EggSale { id: string; date: string; crateCount: number; eggsPerCrate: number; pricePerCrate: number; totalAmount: number; paymentStatus: string; amountPaid: number; customer: { name: string } | null }
interface BirdSale { id: string; date: string; quantity: number; pricePerBird: number; totalAmount: number; paymentStatus: string; amountPaid: number; customer: { name: string } | null }

function formatGHS(n: number) { return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

export function SalesDashboard() {
  const { selectedFarmId, setFarm } = useAppStore()
  const [farms, setFarms] = useState<Farm[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [eggSales, setEggSales] = useState<EggSale[]>([])
  const [birdSales, setBirdSales] = useState<BirdSale[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [farmsRes, custRes, eggsRes, birdsRes] = await Promise.all([
        fetch('/api/farms'), fetch('/api/customers'),
        fetch(`/api/sales/eggs${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/sales/birds${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
      ])
      if (farmsRes.ok) setFarms(await farmsRes.json())
      if (custRes.ok) setCustomers(await custRes.json())
      if (eggsRes.ok) setEggSales(await eggsRes.json())
      if (birdsRes.ok) setBirdSales(await birdsRes.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedFarmId])

  useEffect(() => { fetchData() }, [fetchData])

  const today = new Date().toISOString().split('T')[0]
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const monthEggSales = eggSales.filter(e => new Date(e.date).toISOString().split('T')[0] >= monthAgo)
  const monthBirdSales = birdSales.filter(e => new Date(e.date).toISOString().split('T')[0] >= monthAgo)
  const totalEggRev = monthEggSales.reduce((s, e) => s + e.totalAmount, 0)
  const totalBirdRev = monthBirdSales.reduce((s, e) => s + e.totalAmount, 0)
  const unpaidEgg = monthEggSales.filter(e => e.paymentStatus !== 'Paid').reduce((s, e) => s + (e.totalAmount - e.amountPaid), 0)
  const unpaidBird = monthBirdSales.filter(e => e.paymentStatus !== 'Paid').reduce((s, e) => s + (e.totalAmount - e.amountPaid), 0)

  const submitEggSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    const crates = parseInt((f.elements.namedItem('crateCount') as HTMLInputElement).value) || 0
    const price = parseFloat((f.elements.namedItem('pricePerCrate') as HTMLInputElement).value) || 0
    const data = {
      customerId: (f.elements.namedItem('customerId') as HTMLSelectElement).value || null,
      date: (f.elements.namedItem('date') as HTMLInputElement).value || today,
      crateCount: crates,
      eggsPerCrate: parseInt((f.elements.namedItem('eggsPerCrate') as HTMLInputElement).value) || 30,
      pricePerCrate: price,
      totalAmount: crates * price,
      paymentStatus: (f.elements.namedItem('paymentStatus') as HTMLSelectElement).value,
      amountPaid: (f.elements.namedItem('paymentStatus') as HTMLSelectElement).value === 'Paid' ? crates * price : 0,
      farmId: (f.elements.namedItem('farmId') as HTMLSelectElement).value,
      recordedBy: 'Sales',
    }
    const res = await fetch('/api/sales/eggs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { toast.success('Egg sale recorded!'); f.reset(); fetchData() }
    else toast.error('Failed to record sale')
  }

  const submitBirdSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    const qty = parseInt((f.elements.namedItem('quantity') as HTMLInputElement).value) || 0
    const price = parseFloat((f.elements.namedItem('pricePerBird') as HTMLInputElement).value) || 0
    const data = {
      customerId: (f.elements.namedItem('customerId') as HTMLSelectElement).value || null,
      date: (f.elements.namedItem('date') as HTMLInputElement).value || today,
      quantity: qty,
      weightPerBirdKg: parseFloat((f.elements.namedItem('weightPerBirdKg') as HTMLInputElement).value) || null,
      pricePerBird: price,
      totalAmount: qty * price,
      paymentStatus: (f.elements.namedItem('paymentStatus') as HTMLSelectElement).value,
      amountPaid: (f.elements.namedItem('paymentStatus') as HTMLSelectElement).value === 'Paid' ? qty * price : 0,
      farmId: (f.elements.namedItem('farmId') as HTMLSelectElement).value,
      recordedBy: 'Sales',
    }
    const res = await fetch('/api/sales/birds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { toast.success('Bird sale recorded!'); f.reset(); fetchData() }
    else toast.error('Failed to record sale')
  }

  const addCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    const data = {
      name: (f.elements.namedItem('name') as HTMLInputElement).value,
      phone: (f.elements.namedItem('phone') as HTMLInputElement).value || null,
      location: (f.elements.namedItem('location') as HTMLInputElement).value || null,
      customerType: (f.elements.namedItem('customerType') as HTMLSelectElement).value,
    }
    const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { toast.success('Customer added!'); f.reset(); fetchData() }
    else toast.error('Failed to add customer')
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBasket className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-500">Egg Sales (Month)</span>
            </div>
            <p className="text-xl font-bold text-green-700">{formatGHS(totalEggRev)}</p>
            <p className="text-xs text-gray-500">{monthEggSales.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bird className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-500">Bird Sales (Month)</span>
            </div>
            <p className="text-xl font-bold text-blue-700">{formatGHS(totalBirdRev)}</p>
            <p className="text-xs text-gray-500">{monthBirdSales.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-gray-500">Total Revenue</span>
            </div>
            <p className="text-xl font-bold">{formatGHS(totalEggRev + totalBirdRev)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-500">Outstanding</span>
            </div>
            <p className="text-xl font-bold text-red-600">{formatGHS(unpaidEgg + unpaidBird)}</p>
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

      <Tabs defaultValue="egg-sales" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="egg-sales"><ShoppingBasket className="h-3 w-3 mr-1" />Egg Sales</TabsTrigger>
          <TabsTrigger value="bird-sales"><Bird className="h-3 w-3 mr-1" />Bird Sales</TabsTrigger>
          <TabsTrigger value="customers"><Users className="h-3 w-3 mr-1" />Customers</TabsTrigger>
          <TabsTrigger value="unpaid"><AlertCircle className="h-3 w-3 mr-1" />Unpaid</TabsTrigger>
        </TabsList>

        <TabsContent value="egg-sales">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Egg Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitEggSale} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Customer</Label>
                  <Select name="customerId">
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Walk-in" /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Farm *</Label>
                  <Select name="farmId" required>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input name="date" type="date" defaultValue={today} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Crates *</Label>
                  <Input name="crateCount" type="number" min="1" required placeholder="e.g. 10" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Price per Crate (GHS) *</Label>
                  <Input name="pricePerCrate" type="number" min="0" step="0.5" required placeholder="e.g. 35" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Payment</Label>
                  <Select name="paymentStatus" defaultValue="Paid">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Unpaid">Credit / Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end col-span-2 md:col-span-3">
                  <Button type="submit" className="w-full md:w-auto h-9"><Plus className="h-3 w-3 mr-1" />Record Sale</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent egg sales */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Egg Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {eggSales.slice(0, 20).map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                      <ShoppingBasket className="h-4 w-4 text-green-600 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{s.customer?.name || 'Walk-in'}</p>
                        <p className="text-xs text-gray-500">{new Date(s.date).toLocaleDateString('en-GB')} · {s.crateCount} crates x {formatGHS(s.pricePerCrate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatGHS(s.totalAmount)}</p>
                        <Badge variant={s.paymentStatus === 'Paid' ? 'default' : 'destructive'} className="text-[10px]">
                          {s.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bird-sales">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Bird Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitBirdSale} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Customer</Label>
                  <Select name="customerId">
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Walk-in" /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Farm *</Label>
                  <Select name="farmId" required>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input name="date" type="date" defaultValue={today} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Quantity *</Label>
                  <Input name="quantity" type="number" min="1" required placeholder="e.g. 50" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Price per Bird (GHS) *</Label>
                  <Input name="pricePerBird" type="number" min="0" step="0.5" required placeholder="e.g. 30" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Avg Weight (kg)</Label>
                  <Input name="weightPerBirdKg" type="number" step="0.1" placeholder="e.g. 1.8" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Payment</Label>
                  <Select name="paymentStatus" defaultValue="Paid">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Unpaid">Credit / Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end col-span-2">
                  <Button type="submit" className="w-full md:w-auto h-9"><Plus className="h-3 w-3 mr-1" />Record Sale</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Bird Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {birdSales.slice(0, 20).map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                      <Bird className="h-4 w-4 text-blue-600 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{s.customer?.name || 'Walk-in'}</p>
                        <p className="text-xs text-gray-500">{new Date(s.date).toLocaleDateString('en-GB')} · {s.quantity} birds @ {formatGHS(s.pricePerBird)}/bird</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatGHS(s.totalAmount)}</p>
                        <Badge variant={s.paymentStatus === 'Paid' ? 'default' : 'destructive'} className="text-[10px]">
                          {s.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Add Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addCustomer} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input name="name" required placeholder="Customer name" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input name="phone" placeholder="+233..." className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <Input name="location" placeholder="Town/City" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select name="customerType" defaultValue="Retail">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wholesale">Wholesale</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Walk-in">Walk-in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end col-span-2 md:col-span-4">
                  <Button type="submit" className="w-full md:w-auto h-9"><Plus className="h-3 w-3 mr-1" />Add Customer</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Customer List ({customers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-72">
                <div className="space-y-2">
                  {customers.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                      <Users className="h-4 w-4 text-gray-500 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone || 'No phone'} · {c.location || 'No location'}</p>
                      </div>
                      <Badge variant={c.customerType === 'Wholesale' ? 'default' : 'secondary'} className="text-[10px]">
                        {c.customerType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unpaid">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Unpaid / Credit Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const unpaid = [
                  ...eggSales.filter(s => s.paymentStatus !== 'Paid').map(s => ({ ...s, type: 'Eggs' as const })),
                  ...birdSales.filter(s => s.paymentStatus !== 'Paid').map(s => ({ ...s, type: 'Birds' as const })),
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                if (unpaid.length === 0) return <p className="text-center text-gray-400 py-4 text-sm">All sales are paid up!</p>

                return (
                  <ScrollArea className="max-h-72">
                    <div className="space-y-2">
                      {unpaid.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                          <CreditCard className="h-4 w-4 text-amber-600 shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{s.customer?.name || 'Walk-in'} ({s.type})</p>
                            <p className="text-xs text-gray-500">{new Date(s.date).toLocaleDateString('en-GB')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-600">{formatGHS(s.totalAmount - s.amountPaid)} due</p>
                            <p className="text-xs text-gray-500">of {formatGHS(s.totalAmount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
