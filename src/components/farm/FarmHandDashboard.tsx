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
  Egg, Plus, Trash2, Bird, Droplets, UtensilsCrossed, AlertTriangle, Calendar, BarChart3, CheckCircle, Pencil,
  TrendingUp, Users as UsersIcon, Package
} from 'lucide-react'
import { AmendmentRequestDialog } from '@/components/farm/AmendmentRequestDialog'

interface Farm { id: string; name: string; location: string; flocks: any[] }
interface EggRecord { id: string; date: string; crateCount: number; eggsPerCrate: number; brokenCount: number; soiledCount: number; farm: { name: string } }
interface MortRecord { id: string; date: string; count: number; cause: string; flock: { name: string }; farm: { name: string } }
interface FeedRecord { id: string; date: string; feedType: string; bagsUsed: number; bagWeightKg: number; costPerBag: number; farm: { name: string } }
interface Flock {
  id: string; name: string; birdType: string; breed: string | null; birdCount: number; initialBirdCount: number;
  ageWeeks: number; currentAgeWeeks: number; dateArrival: string; isActive: boolean; farmId: string;
  farm: { name: string; location: string }; losses: number; lossPercent: number;
}

export function FarmHandDashboard() {
  const { selectedFarmId, setFarm, currentUser } = useAppStore()
  const [farms, setFarms] = useState<Farm[]>([])
  const [flocks, setFlocks] = useState<Flock[]>([])
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

  // Controlled numerical input state — egg collection form
  const [eggCrateCount, setEggCrateCount] = useState('')
  const [eggEggsPerCrate, setEggEggsPerCrate] = useState('30')
  const [eggBroken, setEggBroken] = useState('')
  const [eggSoiled, setEggSoiled] = useState('')

  // Controlled state — mortality form
  const [mortCount, setMortCount] = useState('')
  const [mortNotes, setMortNotes] = useState('')

  // Controlled numerical input state — feed form
  const [feedBagsUsed, setFeedBagsUsed] = useState('')
  const [feedBagWeight, setFeedBagWeight] = useState('50')
  const [feedCostPerBag, setFeedCostPerBag] = useState('')
  const [feedSupplier, setFeedSupplier] = useState('')

  // Add Flock form state
  const [newFlockName, setNewFlockName] = useState('')
  const [newFlockFarmId, setNewFlockFarmId] = useState(selectedFarmId || '')
  const [newFlockType, setNewFlockType] = useState('Layer')
  const [newFlockBreed, setNewFlockBreed] = useState('Bovan Brown')
  const [newFlockCount, setNewFlockCount] = useState('')
  const [newFlockAge, setNewFlockAge] = useState('')
  const [newFlockDate, setNewFlockDate] = useState(new Date().toISOString().split('T')[0])
  const [newFlockNotes, setNewFlockNotes] = useState('')

  // Sync form defaults when global farm changes
  useEffect(() => {
    if (selectedFarmId) {
      setEggFarmId(selectedFarmId)
      setMortFarmId(selectedFarmId)
      setFeedFarmId(selectedFarmId)
      setNewFlockFarmId(selectedFarmId)
    }
  }, [selectedFarmId])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [farmsRes, flocksRes, eggsRes, mortRes, feedRes] = await Promise.all([
        fetch('/api/farms'),
        fetch(`/api/flocks${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/eggs${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/mortality${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/feed${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
      ])
      if (farmsRes.ok) setFarms(await farmsRes.json())
      if (flocksRes.ok) {
        const fd = await flocksRes.json()
        setFlocks(Array.isArray(fd) ? fd : (fd.flocks || []))
      }
      if (eggsRes.ok) setEggRecords(await eggsRes.json())
      if (mortRes.ok) setMortRecords(await mortRes.json())
      if (feedRes.ok) setFeedRecords(await feedRes.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedFarmId])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh
  const handleAutoData = useCallback((results: any[]) => {
    if (results && results.length >= 5 && !isSubmittingRef.current) {
      setFarms(results[0] || [])
      const flData = results[1]
      setFlocks(Array.isArray(flData) ? flData : (flData?.flocks || []))
      setEggRecords(results[2] || [])
      setMortRecords(results[3] || [])
      setFeedRecords(results[4] || [])
    }
  }, [])

  // Quick stats
  const today = new Date().toISOString().split('T')[0]
  const todayEggs = eggRecords.filter(e => new Date(e.date).toISOString().split('T')[0] === today)
  const todayCrates = todayEggs.reduce((s, e) => s + e.crateCount, 0)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const weekMortality = mortRecords.filter(m => new Date(m.date).toISOString().split('T')[0] >= weekAgo)
  const weekDeaths = weekMortality.reduce((s, m) => s + m.count, 0)
  const weekEggs = eggRecords.filter(e => new Date(e.date).toISOString().split('T')[0] >= weekAgo)
  const weekCrates = weekEggs.reduce((s, e) => s + e.crateCount, 0)

  // Lay rate calculations
  const activeFlocks = flocks.filter(f => f.birdType === 'Layer' && f.birdCount > 0 && f.isActive)
  const totalLayerBirds = activeFlocks.reduce((s, f) => s + f.birdCount, 0)
  const todayTotalEggs = todayEggs.reduce((s, e) => s + (e.crateCount * e.eggsPerCrate), 0)
  const dailyLayPercent = totalLayerBirds > 0 ? Math.round((todayTotalEggs / totalLayerBirds) * 10000) / 100 : 0
  const monthEggRecords = eggRecords.filter(e => new Date(e.date).toISOString().split('T')[0] >= monthAgo)
  const monthTotalEggs = monthEggRecords.reduce((s, e) => s + (e.crateCount * e.eggsPerCrate), 0)
  const daysInPeriod = Math.max(1, Math.min(30, new Set(eggRecords.filter(e => new Date(e.date).toISOString().split('T')[0] >= monthAgo).map(e => new Date(e.date).toISOString().split('T')[0])).size))
  const monthlyLayPercent = totalLayerBirds > 0 ? Math.round((monthTotalEggs / (totalLayerBirds * daysInPeriod)) * 10000) / 100 : 0
  const totalBirds = flocks.filter(f => f.isActive).reduce((s, f) => s + f.birdCount, 0)

  const openAmendmentDialog = (recordType: string, recordId: string, fields: any[]) => {
    setAmendmentTarget({ recordType, recordId, fields })
    setAmendmentOpen(true)
  }

  const submitEggRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    isSubmittingRef.current = true
    try {
      const crates = Number(eggCrateCount)
      if (!eggFarmId) { toast.error('Please select a farm'); return }
      if (!crates || crates <= 0) { toast.error('Please enter a valid crate count'); return }
      const data = {
        farmId: eggFarmId,
        date: today,
        crateCount: crates,
        eggsPerCrate: Number(eggEggsPerCrate) || 30,
        brokenCount: Number(eggBroken) || 0,
        soiledCount: Number(eggSoiled) || 0,
        recordedBy: currentUser?.name || 'Farm Hand',
      }
      const res = await fetch('/api/eggs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) {
        toast.success('Egg collection recorded!')
        setEggCrateCount(''); setEggBroken(''); setEggSoiled('')
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to record')
      }
    } catch (err) { console.error(err); toast.error('Failed to record egg collection') }
    finally { isSubmittingRef.current = false }
  }

  const submitMortality = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    isSubmittingRef.current = true
    try {
      const count = Number(mortCount)
      if (!mortFarmId || !mortFlockId) { toast.error('Please select farm and flock'); return }
      if (!count || count <= 0) { toast.error('Please enter a valid count'); return }
      const data = {
        farmId: mortFarmId,
        flockId: mortFlockId,
        date: today,
        count: count,
        cause: mortCause || 'Unknown',
        notes: mortNotes || '',
        recordedBy: currentUser?.name || 'Farm Hand',
      }
      const res = await fetch('/api/mortality', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) {
        toast.success('Mortality recorded')
        setMortCount(''); setMortNotes(''); setMortCause('')
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to record')
      }
    } catch (err) { console.error(err); toast.error('Failed to record mortality') }
    finally { isSubmittingRef.current = false }
  }

  const submitFeed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    isSubmittingRef.current = true
    try {
      const bags = Number(feedBagsUsed)
      if (!feedFarmId || !feedType) { toast.error('Please select farm and feed type'); return }
      if (!bags || bags <= 0) { toast.error('Please enter a valid bags used count'); return }
      const data = {
        farmId: feedFarmId,
        date: today,
        feedType: feedType,
        bagsUsed: bags,
        bagWeightKg: Number(feedBagWeight) || 50,
        costPerBag: Number(feedCostPerBag) || 0,
        supplier: feedSupplier || '',
        recordedBy: currentUser?.name || 'Farm Hand',
      }
      const res = await fetch('/api/feed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) {
        toast.success('Feed record saved')
        setFeedBagsUsed(''); setFeedCostPerBag(''); setFeedSupplier(''); setFeedType('')
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save feed record')
      }
    } catch (err) { console.error(err); toast.error('Failed to save feed record') }
    finally { isSubmittingRef.current = false }
  }

  const submitNewFlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const count = Number(newFlockCount)
      const age = Number(newFlockAge) || 0
      if (!newFlockFarmId) { toast.error('Please select a farm'); return }
      if (!newFlockName.trim()) { toast.error('Please enter a flock name'); return }
      if (!count || count <= 0) { toast.error('Please enter a valid bird count'); return }
      const data = {
        farmId: newFlockFarmId,
        name: newFlockName.trim(),
        birdType: newFlockType,
        breed: newFlockBreed.trim() || null,
        birdCount: count,
        initialBirdCount: count,
        ageWeeks: age,
        dateArrival: newFlockDate || today,
        notes: newFlockNotes.trim() || null,
      }
      const res = await fetch('/api/flocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) {
        toast.success('New flock added!')
        setNewFlockName(''); setNewFlockCount(''); setNewFlockAge(''); setNewFlockNotes(''); setNewFlockBreed('Bovan Brown')
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to add flock')
      }
    } catch (err) { console.error(err); toast.error('Failed to add flock') }
  }

  if (loading && farms.length === 0) return <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-500">Lay Rate (Today)</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{dailyLayPercent}%</p>
            <p className="text-xs text-gray-500">{totalLayerBirds.toLocaleString()} layers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-500">Monthly Lay Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{monthlyLayPercent}%</p>
            <p className="text-xs text-gray-500">avg over {daysInPeriod} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-500">Week Mortality</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{weekDeaths}</p>
            <p className="text-xs text-gray-500">birds lost this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bird className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-gray-500">Total Birds</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{totalBirds.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{flocks.filter(f => f.isActive).length} active flocks</p>
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
        endpoints={['/api/farms', `/api/flocks${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/eggs${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/mortality${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/feed${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`]}
        interval={30000}
        onData={handleAutoData}
        compact
      />

      <Tabs defaultValue="flocks" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="flocks"><Bird className="h-3 w-3 mr-1" />Flocks</TabsTrigger>
          <TabsTrigger value="eggs"><Egg className="h-3 w-3 mr-1" />Eggs</TabsTrigger>
          <TabsTrigger value="mortality"><AlertTriangle className="h-3 w-3 mr-1" />Deaths</TabsTrigger>
          <TabsTrigger value="feed"><UtensilsCrossed className="h-3 w-3 mr-1" />Feed</TabsTrigger>
          <TabsTrigger value="history"><Calendar className="h-3 w-3 mr-1" />History</TabsTrigger>
        </TabsList>

        {/* FLOCKS TAB */}
        <TabsContent value="flocks">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Add New Flock / Room</CardTitle>
              <CardDescription>Register a new batch of birds to a farm</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitNewFlock} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Farm *</Label>
                  <Select value={newFlockFarmId} onValueChange={setNewFlockFarmId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Flock Name *</Label>
                  <Input required placeholder="e.g. Layer Room A" value={newFlockName} onChange={e => setNewFlockName(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Bird Type *</Label>
                  <Select value={newFlockType} onValueChange={setNewFlockType}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Layer">Layer</SelectItem>
                      <SelectItem value="Broiler">Broiler</SelectItem>
                      <SelectItem value="Cockerel">Cockerel</SelectItem>
                      <SelectItem value="Turkeys">Turkeys</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Breed</Label>
                  <Select value={newFlockBreed} onValueChange={setNewFlockBreed}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bovan Brown">Bovan Brown</SelectItem>
                      <SelectItem value="Lohmann Brown">Lohmann Brown</SelectItem>
                      <SelectItem value="ISA Brown">ISA Brown</SelectItem>
                      <SelectItem value="Hy-Line Brown">Hy-Line Brown</SelectItem>
                      <SelectItem value="Cobb 500">Cobb 500 (Broiler)</SelectItem>
                      <SelectItem value="Ross 308">Ross 308 (Broiler)</SelectItem>
                      <SelectItem value="Sasso">Sasso (Cockerel)</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Number of Birds *</Label>
                  <Input type="number" min="1" required placeholder="e.g. 2500" value={newFlockCount} onChange={e => setNewFlockCount(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Age (weeks)</Label>
                  <Input type="number" min="0" placeholder="e.g. 20" value={newFlockAge} onChange={e => setNewFlockAge(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Arrival Date</Label>
                  <Input type="date" value={newFlockDate} onChange={e => setNewFlockDate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Input placeholder="Optional notes" value={newFlockNotes} onChange={e => setNewFlockNotes(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="flex items-end col-span-2 md:col-span-4">
                  <Button type="submit" className="w-full md:w-auto h-9"><Plus className="h-3 w-3 mr-1" />Add Flock</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Flock List with live counts */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Active Flocks ({flocks.filter(f => f.isActive).length})</CardTitle>
              <CardDescription>Live bird counts — auto-reduced by mortality and sales</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {flocks.filter(f => f.isActive).map(f => (
                    <div key={f.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${f.birdType === 'Layer' ? 'bg-amber-100' : f.birdType === 'Broiler' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Bird className={`h-5 w-5 ${f.birdType === 'Layer' ? 'text-amber-700' : f.birdType === 'Broiler' ? 'text-blue-700' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{f.name}</p>
                          <p className="text-xs text-gray-500">{f.farm?.name} · {f.breed || f.birdType} · Age: <span className="font-medium text-gray-700">{f.currentAgeWeeks} weeks</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{f.birdCount.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">of {f.initialBirdCount.toLocaleString()} birds</p>
                        </div>
                        <div className="text-right">
                          {f.losses > 0 && (
                            <>
                              <p className="text-xs font-medium text-red-600">-{f.losses} lost</p>
                              <p className="text-[10px] text-red-400">({f.lossPercent}%)</p>
                            </>
                          )}
                          {f.losses === 0 && <p className="text-xs text-green-600">No losses</p>}
                        </div>
                        <Badge variant={f.birdType === 'Layer' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                          {f.birdType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {flocks.filter(f => f.isActive).length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No flocks yet. Add one above!</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EGG COLLECTION TAB */}
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
                  <Input type="number" min="0" required placeholder="e.g. 25" value={eggCrateCount} onChange={e => setEggCrateCount(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Eggs per Crate</Label>
                  <Input type="number" min="1" value={eggEggsPerCrate} onChange={e => setEggEggsPerCrate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Broken Eggs</Label>
                  <Input type="number" min="0" value={eggBroken} onChange={e => setEggBroken(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Soiled Eggs</Label>
                  <Input type="number" min="0" value={eggSoiled} onChange={e => setEggSoiled(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full h-9"><Plus className="h-3 w-3 mr-1" />Save</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent egg collections */}
          <Card className="mt-4">
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
        </TabsContent>

        {/* MORTALITY TAB */}
        <TabsContent value="mortality">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Bird Mortality</CardTitle>
              <CardDescription>Report any bird deaths — flock count will auto-reduce</CardDescription>
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
                      {flocks.filter(f => f.isActive).map(fl => <SelectItem key={fl.id} value={fl.id}>{fl.name} ({fl.farm?.name || 'Unknown'})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Number of Deaths *</Label>
                  <Input type="number" min="1" required placeholder="e.g. 3" value={mortCount} onChange={e => setMortCount(e.target.value)} className="h-9 text-sm" />
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
                  <Textarea placeholder="Any additional observations..." value={mortNotes} onChange={e => setMortNotes(e.target.value)} className="text-sm min-h-[60px]" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="destructive" className="w-full h-9"><Plus className="h-3 w-3 mr-1" />Report Death</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-4">
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
                    </div>
                  ))}
                  {mortRecords.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No mortality records yet</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEED TAB */}
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
                  <Input type="number" min="0" step="0.5" required placeholder="e.g. 5" value={feedBagsUsed} onChange={e => setFeedBagsUsed(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Bag Weight (kg)</Label>
                  <Input type="number" min="1" value={feedBagWeight} onChange={e => setFeedBagWeight(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Cost per Bag (GHS)</Label>
                  <Input type="number" min="0" placeholder="e.g. 180" value={feedCostPerBag} onChange={e => setFeedCostPerBag(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Supplier</Label>
                  <Input placeholder="e.g. Ghana Agro" value={feedSupplier} onChange={e => setFeedSupplier(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="flex items-end col-span-2 md:col-span-3">
                  <Button type="submit" className="w-full h-9 md:w-auto"><Plus className="h-3 w-3 mr-1" />Save Feed Record</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
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
