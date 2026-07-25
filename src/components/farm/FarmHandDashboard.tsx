'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
import { LiveSyncIndicator } from '@/components/farm/LiveSyncIndicator'
import {
  Egg, Plus, Trash2, Bird, Droplets, UtensilsCrossed, AlertTriangle, Calendar, BarChart3, CheckCircle, Pencil
} from 'lucide-react'
import { AmendmentRequestDialog } from '@/components/farm/AmendmentRequestDialog'

interface Farm { id: string; name: string; location: string; flocks: any[] }
interface EggRecord { id: string; date: string; crateCount: number; eggsPerCrate: number; brokenCount: number; soiledCount: number; farm: { name: string } }
interface MortRecord { id: string; date: string; count: number; cause: string; flock: { name: string }; farm: { name: string } }
interface FeedRecord { id: string; date: string; feedType: string; bagsUsed: number; bagWeightKg: number; costPerBag: number; farm: { name: string } }

export function FarmHandDashboard() {
  const { selectedFarmId, setFarm, currentUser } = useAppStore()
  const [farms, setFarms] = useState<Farm[]>([])
  const [eggRecords, setEggRecords] = useState<EggRecord[]>([])
  const [mortRecords, setMortRecords] = useState<MortRecord[]>([])
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const isSubmittingRef = useRef(false)
  const [amendmentOpen, setAmendmentOpen] = useState(false)
  const [amendmentTarget, setAmendmentTarget] = useState<{ recordType: string; recordId: string; fields: any[] }>({ recordType: '', recordId: '', fields: [] })

  // Form Select state (Radix Select doesn't use native form elements)
  const [eggFarmId, setEggFarmId] = useState(selectedFarmId || '')
  const [mortFarmId, setMortFarmId] = useState(selectedFarmId || '')
  const [mortFlockId, setMortFlockId] = useState('')
  const [mortCause, setMortCause] = useState('')
  const [feedFarmId, setFeedFarmId] = useState(selectedFarmId || '')
  const [feedType, setFeedType] = useState('')

  // Sync form defaults when global farm changes
  useEffect(() => {
    if (selectedFarmId) {
      setEggFarmId(selectedFarmId)
      setMortFarmId(selectedFarmId)
      setFeedFarmId(selectedFarmId)
    }
  }, [selectedFarmId])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [farmsRes, eggsRes, mortRes, feedRes] = await Promise.all([
        fetch('/api/farms'),
        fetch(`/api/eggs${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/mortality${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/feed${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
      ])
      if (farmsRes.ok) setFarms(await farmsRes.json())
      if (eggsRes.ok) setEggRecords(await eggsRes.json())
      if (mortRes.ok) setMortRecords(await mortRes.json())
      if (feedRes.ok) setFeedRecords(await feedRes.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedFarmId])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh: Farm hand sees changes from other staff in real-time
  // Skip if form is being submitted to prevent race conditions
  const handleAutoData = useCallback((results: any[]) => {
    if (results && results.length >= 4 && !isSubmittingRef.current) {
      setFarms(results[0] || [])
      setEggRecords(results[1] || [])
      setMortRecords(results[2] || [])
      setFeedRecords(results[3] || [])
    }
  }, [])

  // Quick stats
  const today = new Date().toISOString().split('T')[0]
  const todayEggs = eggRecords.filter(e => new Date(e.date).toISOString().split('T')[0] === today)
  const todayCrates = todayEggs.reduce((s, e) => s + e.crateCount, 0)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const weekMortality = mortRecords.filter(m => new Date(m.date).toISOString().split('T')[0] >= weekAgo)
  const weekDeaths = weekMortality.reduce((s, m) => s + m.count, 0)
  const weekEggs = eggRecords.filter(e => new Date(e.date).toISOString().split('T')[0] >= weekAgo)
  const weekCrates = weekEggs.reduce((s, e) => s + e.crateCount, 0)

  const openAmendmentDialog = (recordType: string, recordId: string, fields: any[]) => {
    setAmendmentTarget({ recordType, recordId, fields })
    setAmendmentOpen(true)
  }

  const submitEggRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    isSubmittingRef.current = true
    const form = e.currentTarget
    try {
      const data = {
        farmId: eggFarmId,
        date: today,
        crateCount: parseInt((form.elements.namedItem('crateCount') as HTMLInputElement).value) || 0,
        eggsPerCrate: parseInt((form.elements.namedItem('eggsPerCrate') as HTMLInputElement).value) || 30,
        brokenCount: parseInt((form.elements.namedItem('brokenCount') as HTMLInputElement).value) || 0,
        soiledCount: parseInt((form.elements.namedItem('soiledCount') as HTMLInputElement).value) || 0,
        recordedBy: 'Farm Hand',
      }
      if (!data.farmId) { toast.error('Please select a farm'); return }
      const res = await fetch('/api/eggs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { toast.success('Egg collection recorded!'); form.reset(); fetchData() }
      else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Failed to record') }
    } catch (err) { console.error(err); toast.error('Failed to record egg collection') }
    finally { isSubmittingRef.current = false }
  }

  const submitMortality = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    isSubmittingRef.current = true
    const form = e.currentTarget
    try {
      const data = {
        farmId: mortFarmId,
        flockId: mortFlockId,
        date: today,
        count: parseInt((form.elements.namedItem('count') as HTMLInputElement).value) || 0,
        cause: mortCause || 'Unknown',
        notes: (form.elements.namedItem('notes') as HTMLTextAreaElement)?.value || '',
        recordedBy: 'Farm Hand',
      }
      if (!data.farmId || !data.flockId) { toast.error('Please select farm and flock'); return }
      const res = await fetch('/api/mortality', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { toast.success('Mortality recorded'); form.reset(); fetchData() }
      else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Failed to record') }
    } catch (err) { console.error(err); toast.error('Failed to record mortality') }
    finally { isSubmittingRef.current = false }
  }

  const submitFeed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    isSubmittingRef.current = true
    const form = e.currentTarget
    try {
      const data = {
        farmId: feedFarmId,
        date: today,
        feedType: feedType,
        bagsUsed: parseFloat((form.elements.namedItem('bagsUsed') as HTMLInputElement).value) || 0,
        bagWeightKg: parseFloat((form.elements.namedItem('bagWeightKg') as HTMLInputElement).value) || 50,
        costPerBag: parseFloat((form.elements.namedItem('costPerBag') as HTMLInputElement).value) || 0,
        supplier: (form.elements.namedItem('supplier') as HTMLInputElement)?.value || '',
        recordedBy: 'Farm Hand',
      }
      if (!data.farmId || !data.feedType) { toast.error('Please select farm and feed type'); return }
      const res = await fetch('/api/feed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { toast.success('Feed record saved'); form.reset(); fetchData() }
      else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Failed to save feed record') }
    } catch (err) { console.error(err); toast.error('Failed to save feed record') }
    finally { isSubmittingRef.current = false }
  }

  if (loading && farms.length === 0) return <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Egg className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-gray-500">Today&apos;s Collection</span>
            </div>
            <p className="text-2xl font-bold">{todayCrates} crates</p>
            <p className="text-xs text-gray-500">{todayEggs.reduce((s, e) => s + e.crateCount * e.eggsPerCrate, 0)} eggs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-500">This Week</span>
            </div>
            <p className="text-2xl font-bold">{weekCrates} crates</p>
            <p className="text-xs text-gray-500">Average {Math.round(weekCrates / 7)}/day</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-500">Week Mortality</span>
            </div>
            <p className="text-2xl font-bold">{weekDeaths}</p>
            <p className="text-xs text-gray-500">birds lost this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UtensilsCrossed className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-gray-500">Today&apos;s Feed</span>
            </div>
            <p className="text-2xl font-bold">{feedRecords.filter(f => new Date(f.date).toISOString().split('T')[0] === today).reduce((s, f) => s + f.bagsUsed, 0)} bags</p>
            <p className="text-xs text-gray-500">total bags used today</p>
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
        endpoints={['/api/farms', `/api/eggs${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/mortality${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/feed${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`]}
        interval={30000}
        onData={handleAutoData}
        compact
      />

      <Tabs defaultValue="eggs" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="eggs"><Egg className="h-3 w-3 mr-1" />Eggs</TabsTrigger>
          <TabsTrigger value="mortality"><AlertTriangle className="h-3 w-3 mr-1" />Deaths</TabsTrigger>
          <TabsTrigger value="feed"><UtensilsCrossed className="h-3 w-3 mr-1" />Feed</TabsTrigger>
          <TabsTrigger value="history"><Calendar className="h-3 w-3 mr-1" />History</TabsTrigger>
        </TabsList>

        {/* Egg Collection Form */}
        <TabsContent value="eggs">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Egg Collection</CardTitle>
              <CardDescription>Enter today&apos;s egg collection details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitEggRecord} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Farm *</Label>
                  <Select value={eggFarmId} onValueChange={setEggFarmId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Crates Collected *</Label>
                  <Input name="crateCount" type="number" min="0" required placeholder="e.g. 25" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Eggs per Crate</Label>
                  <Input name="eggsPerCrate" type="number" defaultValue="30" min="1" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Broken Eggs</Label>
                  <Input name="brokenCount" type="number" min="0" defaultValue="0" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Soiled Eggs</Label>
                  <Input name="soiledCount" type="number" min="0" defaultValue="0" className="h-9 text-sm" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full h-9"><Plus className="h-3 w-3 mr-1" />Save</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mortality Form */}
        <TabsContent value="mortality">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Bird Mortality</CardTitle>
              <CardDescription>Report any bird deaths observed</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitMortality} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Farm *</Label>
                  <Select value={mortFarmId} onValueChange={setMortFarmId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Flock *</Label>
                  <Select value={mortFlockId} onValueChange={setMortFlockId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select flock" /></SelectTrigger>
                    <SelectContent>
                      {farms.flatMap(f => f.flocks.map(fl => <SelectItem key={fl.id} value={fl.id}>{fl.name} ({f.name})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Number of Deaths *</Label>
                  <Input name="count" type="number" min="1" required placeholder="e.g. 3" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Likely Cause</Label>
                  <Select value={mortCause} onValueChange={setMortCause}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select cause" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disease">Disease</SelectItem>
                      <SelectItem value="Predator">Predator</SelectItem>
                      <SelectItem value="Heat stress">Heat Stress</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                      <SelectItem value="Old age">Old Age</SelectItem>
                      <SelectItem value="Piling/Suffocation">Piling / Suffocation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Notes</Label>
                  <Textarea name="notes" placeholder="Any additional observations..." className="text-sm min-h-[60px]" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="destructive" className="w-full h-9"><Plus className="h-3 w-3 mr-1" />Report Death</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feed Form */}
        <TabsContent value="feed">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Feed Usage</CardTitle>
              <CardDescription>Track daily feed consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitFeed} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Farm *</Label>
                  <Select value={feedFarmId} onValueChange={setFeedFarmId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Feed Type *</Label>
                  <Select value={feedType} onValueChange={setFeedType}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Layer mash">Layer Mash</SelectItem>
                      <SelectItem value="Layer pellets">Layer Pellets</SelectItem>
                      <SelectItem value="Broiler starter">Broiler Starter</SelectItem>
                      <SelectItem value="Broiler finisher">Broiler Finisher</SelectItem>
                      <SelectItem value="Grower mash">Grower Mash</SelectItem>
                      <SelectItem value="Chick mash">Chick Mash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Bags Used *</Label>
                  <Input name="bagsUsed" type="number" min="0" step="0.5" required placeholder="e.g. 5" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Bag Weight (kg)</Label>
                  <Input name="bagWeightKg" type="number" defaultValue="50" min="1" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Cost per Bag (GHS)</Label>
                  <Input name="costPerBag" type="number" min="0" placeholder="e.g. 180" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Supplier</Label>
                  <Input name="supplier" placeholder="e.g. Ghana Agro" className="h-9 text-sm" />
                </div>
                <div className="flex items-end col-span-2 md:col-span-3">
                  <Button type="submit" className="w-full h-9 md:w-auto"><Plus className="h-3 w-3 mr-1" />Save Feed Record</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Egg Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {eggRecords.slice(0, 15).map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                        <Egg className="h-4 w-4 text-amber-600 shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{r.farm?.name}</p>
                          <p className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{r.crateCount} crates</p>
                          <p className="text-xs text-gray-500">{r.crateCount * r.eggsPerCrate} eggs</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0 text-gray-400 hover:text-amber-600" onClick={() => openAmendmentDialog('DailyEggCollection', r.id, [
                          { key: 'crateCount', label: 'Crates', type: 'number' as const, value: r.crateCount },
                          { key: 'eggsPerCrate', label: 'Eggs/Crate', type: 'number' as const, value: r.eggsPerCrate },
                          { key: 'brokenCount', label: 'Broken', type: 'number' as const, value: r.brokenCount },
                          { key: 'soiledCount', label: 'Soiled', type: 'number' as const, value: r.soiledCount },
                        ])}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {eggRecords.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No records yet</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Mortality Records</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {mortRecords.slice(0, 10).map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{r.flock?.name} - {r.farm?.name}</p>
                          <p className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString('en-GB')}{r.cause ? ` · ${r.cause}` : ''}</p>
                        </div>
                        <Badge variant="destructive">{r.count} lost</Badge>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0 text-gray-400 hover:text-amber-600" onClick={() => openAmendmentDialog('BirdMortality', r.id, [
                          { key: 'count', label: 'Count', type: 'number' as const, value: r.count },
                          { key: 'cause', label: 'Cause', type: 'text' as const, value: r.cause || '' },
                        ])}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {mortRecords.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No mortality records yet</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {/* Amendment Dialog */}
      <AmendmentRequestDialog
        open={amendmentOpen}
        onOpenChange={setAmendmentOpen}
        recordType={amendmentTarget.recordType}
        recordId={amendmentTarget.recordId}
        fields={amendmentTarget.fields}
      />
    </div>
  )
}
