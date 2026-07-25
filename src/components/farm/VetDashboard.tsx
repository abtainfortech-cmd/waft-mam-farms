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
import { LiveSyncIndicator } from '@/components/farm/LiveSyncIndicator'
import {
  Stethoscope, Plus, Shield, AlertTriangle, Syringe, Activity, CheckCircle2, Clock, Heart
} from 'lucide-react'

interface Farm { id: string; name: string; flocks: any[] }
interface Vaccination { id: string; vaccineName: string; scheduledDate: string; administeredDate: string | null; status: string; method: string; flock: { name: string; birdType: string; birdCount: number }; farm: { name: string } }
interface Treatment { id: string; date: string; diagnosis: string; medication: string; dosage: string; duration: string; cost: number; status: string; flock: { name: string }; farm: { name: string } }
interface HealthCheck { id: string; date: string; overallStatus: string; symptoms: string | null; bodyCondition: string | null; temperature: number | null; recommendations: string | null; flock: { name: string; birdType: string }; farm: { name: string } }

export function VetDashboard() {
  const { selectedFarmId, setFarm } = useAppStore()
  const [farms, setFarms] = useState<Farm[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [farmsRes, vacRes, treatRes, healthRes] = await Promise.all([
        fetch('/api/farms'),
        fetch(`/api/vaccinations${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/treatments${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/health${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
      ])
      if (farmsRes.ok) setFarms(await farmsRes.json())
      if (vacRes.ok) setVaccinations(await vacRes.json())
      if (treatRes.ok) setTreatments(await treatRes.json())
      if (healthRes.ok) setHealthChecks(await healthRes.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedFarmId])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh: Vet sees mortality and flock data from farm hand in real-time
  const handleAutoData = useCallback((results: any[]) => {
    if (results && results.length >= 4) {
      setFarms(results[0] || [])
      setVaccinations(results[1] || [])
      setTreatments(results[2] || [])
      setHealthChecks(results[3] || [])
    }
  }, [])

  const now = new Date()
  const overdue = vaccinations.filter(v => new Date(v.scheduledDate) <= now && v.status !== 'Completed')
  const upcoming = vaccinations.filter(v => {
    const d = new Date(v.scheduledDate)
    const twoWeeks = new Date(now.getTime() + 14 * 86400000)
    return d > now && d <= twoWeeks && v.status !== 'Completed'
  })
  const completed = vaccinations.filter(v => v.status === 'Completed')
  const activeTreatments = treatments.filter(t => t.status === 'Ongoing')

  const today = new Date().toISOString().split('T')[0]

  const submitHealthCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    const data = {
      flockId: (f.elements.namedItem('flockId') as HTMLSelectElement).value,
      farmId: (f.elements.namedItem('farmId') as HTMLSelectElement).value,
      date: today,
      overallStatus: (f.elements.namedItem('overallStatus') as HTMLSelectElement).value,
      symptoms: (f.elements.namedItem('symptoms') as HTMLInputElement).value || null,
      temperature: parseFloat((f.elements.namedItem('temperature') as HTMLInputElement).value) || null,
      bodyCondition: (f.elements.namedItem('bodyCondition') as HTMLSelectElement).value || null,
      recommendations: (f.elements.namedItem('recommendations') as HTMLTextAreaElement).value || null,
      vetOfficer: 'Vet Officer',
    }
    const res = await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { toast.success('Health check recorded!'); f.reset(); fetchData() }
    else toast.error('Failed to save')
  }

  const submitVaccination = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    const data = {
      flockId: (f.elements.namedItem('flockId') as HTMLSelectElement).value,
      farmId: (f.elements.namedItem('farmId') as HTMLSelectElement).value,
      vaccineName: (f.elements.namedItem('vaccineName') as HTMLSelectElement).value,
      scheduledDate: (f.elements.namedItem('scheduledDate') as HTMLInputElement).value || today,
      status: 'Scheduled',
      method: (f.elements.namedItem('method') as HTMLSelectElement).value || null,
      dosage: (f.elements.namedItem('dosage') as HTMLInputElement).value || null,
      cost: parseFloat((f.elements.namedItem('cost') as HTMLInputElement).value) || null,
      batchNo: (f.elements.namedItem('batchNo') as HTMLInputElement).value || null,
    }
    const res = await fetch('/api/vaccinations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { toast.success('Vaccination scheduled!'); f.reset(); fetchData() }
    else toast.error('Failed to schedule')
  }

  const submitTreatment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    const data = {
      flockId: (f.elements.namedItem('flockId') as HTMLSelectElement).value,
      farmId: (f.elements.namedItem('farmId') as HTMLSelectElement).value,
      date: today,
      diagnosis: (f.elements.namedItem('diagnosis') as HTMLInputElement).value,
      medication: (f.elements.namedItem('medication') as HTMLInputElement).value,
      dosage: (f.elements.namedItem('dosage') as HTMLInputElement).value || null,
      duration: (f.elements.namedItem('duration') as HTMLInputElement).value || null,
      cost: parseFloat((f.elements.namedItem('cost') as HTMLInputElement).value) || null,
      status: 'Ongoing',
      vetOfficer: 'Vet Officer',
    }
    const res = await fetch('/api/treatments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { toast.success('Treatment recorded!'); f.reset(); fetchData() }
    else toast.error('Failed to save')
  }

  const markVaccinationDone = async (id: string) => {
    const res = await fetch('/api/vaccinations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'Completed', administeredDate: today }),
    })
    if (res.ok) { toast.success('Vaccination marked as completed'); fetchData() }
    else toast.error('Failed to update')
  }

  if (loading && farms.length === 0) return <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>

  const statusColor = (status: string) => {
    switch (status) {
      case 'Overdue': return 'destructive'
      case 'Scheduled': return 'secondary'
      case 'Completed': return 'default'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Critical Alerts */}
      {overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-bold text-red-800">{overdue.length} Overdue Vaccination{overdue.length > 1 ? 's' : ''}</p>
            </div>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {overdue.slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-center gap-2 text-xs">
                    <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                    <span>{v.vaccineName}</span>
                    <span className="text-gray-500">·</span>
                    <span>{v.flock?.name}</span>
                    <span className="text-gray-500">·</span>
                    <span>{v.farm?.name}</span>
                    <Button size="sm" variant="outline" className="h-6 ml-auto text-[10px] px-2" onClick={() => markVaccinationDone(v.id)}>
                      Mark Done
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-500">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
            <p className="text-xs text-gray-500">vaccinations behind schedule</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-gray-500">Upcoming (14 days)</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{upcoming.length}</p>
            <p className="text-xs text-gray-500">vaccinations scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-gray-500">Active Treatments</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{activeTreatments.length}</p>
            <p className="text-xs text-gray-500">ongoing treatments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-500">Health Checks</span>
            </div>
            <p className="text-2xl font-bold">{healthChecks.length}</p>
            <p className="text-xs text-gray-500">total recorded</p>
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
        endpoints={['/api/farms', `/api/vaccinations${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/treatments${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/health${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`]}
        interval={20000}
        onData={handleAutoData}
        compact
      />

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="schedule"><Syringe className="h-3 w-3 mr-1" />Vaccinations</TabsTrigger>
          <TabsTrigger value="health"><Stethoscope className="h-3 w-3 mr-1" />Health</TabsTrigger>
          <TabsTrigger value="treatments"><Activity className="h-3 w-3 mr-1" />Treatments</TabsTrigger>
          <TabsTrigger value="history"><CheckCircle2 className="h-3 w-3 mr-1" />History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Schedule Vaccination</CardTitle>
              <CardDescription>Add a new vaccination to the schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitVaccination} className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  <Label className="text-xs">Flock *</Label>
                  <Select name="flockId" required>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select flock" /></SelectTrigger>
                    <SelectContent>
                      {farms.flatMap(f => f.flocks.map(fl => <SelectItem key={fl.id} value={fl.id}>{fl.name} ({f.name})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Vaccine *</Label>
                  <Select name="vaccineName" required>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select vaccine" /></SelectTrigger>
                    <SelectContent>
                      {['Newcastle Disease', 'Gumboro', 'Fowl Pox', 'Fowl Typhoid', 'Infectious Bronchitis', 'Coryza', 'Newcastle Booster', 'Marek\'s Disease', 'Coccidiosis'].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Scheduled Date</Label>
                  <Input name="scheduledDate" type="date" defaultValue={today} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Method</Label>
                  <Select name="method">
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Eye drop">Eye Drop</SelectItem>
                      <SelectItem value="Drinking water">Drinking Water</SelectItem>
                      <SelectItem value="Injection">Injection</SelectItem>
                      <SelectItem value="Spray">Spray</SelectItem>
                      <SelectItem value="Wing web puncture">Wing Web Puncture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Batch No.</Label>
                  <Input name="batchNo" placeholder="VAC-XXXX" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Cost (GHS)</Label>
                  <Input name="cost" type="number" min="0" step="0.5" placeholder="e.g. 150" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Dosage</Label>
                  <Input name="dosage" placeholder="e.g. 0.5ml per bird" className="h-9 text-sm" />
                </div>
                <div className="flex items-end col-span-2 md:col-span-3">
                  <Button type="submit" className="w-full md:w-auto h-9"><Plus className="h-3 w-3 mr-1" />Schedule Vaccination</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Vaccination List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-600">Overdue ({overdue.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-56">
                  <div className="space-y-2">
                    {overdue.map(v => (
                      <div key={v.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm">
                        <Badge variant="destructive">Overdue</Badge>
                        <div className="flex-1">
                          <p className="font-medium">{v.vaccineName}</p>
                          <p className="text-xs text-gray-500">{v.flock?.name} · {v.farm?.name} · {v.method || ''}</p>
                        </div>
                        <Button size="sm" variant="default" className="h-7 text-[10px]" onClick={() => markVaccinationDone(v.id)}>
                          Done
                        </Button>
                      </div>
                    ))}
                    {overdue.length === 0 && <p className="text-center text-gray-400 py-3 text-xs">All up to date!</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-600">Upcoming ({upcoming.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-56">
                  <div className="space-y-2">
                    {upcoming.map(v => (
                      <div key={v.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-sm">
                        <Badge variant="secondary">Scheduled</Badge>
                        <div className="flex-1">
                          <p className="font-medium">{v.vaccineName}</p>
                          <p className="text-xs text-gray-500">{v.flock?.name} · {v.farm?.name}</p>
                        </div>
                        <p className="text-xs text-amber-600">{new Date(v.scheduledDate).toLocaleDateString('en-GB')}</p>
                      </div>
                    ))}
                    {upcoming.length === 0 && <p className="text-center text-gray-400 py-3 text-xs">No upcoming vaccinations</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Health Check</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitHealthCheck} className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  <Label className="text-xs">Flock *</Label>
                  <Select name="flockId" required>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select flock" /></SelectTrigger>
                    <SelectContent>
                      {farms.flatMap(f => f.flocks.map(fl => <SelectItem key={fl.id} value={fl.id}>{fl.name} ({f.name})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Overall Status *</Label>
                  <Select name="overallStatus" required>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Body Temp (C)</Label>
                  <Input name="temperature" type="number" step="0.1" placeholder="e.g. 41.5" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Body Condition</Label>
                  <Select name="bodyCondition">
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Underweight">Underweight</SelectItem>
                      <SelectItem value="Overweight">Overweight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Symptoms Observed</Label>
                  <Input name="symptoms" placeholder="e.g. Coughing, Lethargy" className="h-9 text-sm" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Recommendations</Label>
                  <Textarea name="recommendations" placeholder="Veterinary recommendations..." className="text-sm min-h-[60px]" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full h-9"><Plus className="h-3 w-3 mr-1" />Save Check</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent Health Checks */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Health Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {healthChecks.slice(0, 15).map(h => (
                    <div key={h.id} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                      h.overallStatus === 'Critical' ? 'bg-red-50' :
                      h.overallStatus === 'Poor' ? 'bg-orange-50' :
                      h.overallStatus === 'Fair' ? 'bg-yellow-50' : 'bg-green-50'
                    }`}>
                      <Stethoscope className={`h-4 w-4 shrink-0 ${
                        h.overallStatus === 'Critical' ? 'text-red-600' :
                        h.overallStatus === 'Poor' ? 'text-orange-600' :
                        h.overallStatus === 'Fair' ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">{h.flock?.name} ({h.flock?.birdType})</p>
                        <p className="text-xs text-gray-500">
                          {h.farm?.name} · {new Date(h.date).toLocaleDateString('en-GB')}
                          {h.symptoms ? ` · ${h.symptoms}` : ''}
                          {h.temperature ? ` · ${h.temperature}C` : ''}
                        </p>
                      </div>
                      <Badge variant={
                        h.overallStatus === 'Critical' ? 'destructive' :
                        h.overallStatus === 'Poor' ? 'destructive' :
                        h.overallStatus === 'Fair' ? 'secondary' : 'default'
                      }>{h.overallStatus}</Badge>
                    </div>
                  ))}
                  {healthChecks.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No health checks recorded</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Treatment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitTreatment} className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  <Label className="text-xs">Flock *</Label>
                  <Select name="flockId" required>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select flock" /></SelectTrigger>
                    <SelectContent>
                      {farms.flatMap(f => f.flocks.map(fl => <SelectItem key={fl.id} value={fl.id}>{fl.name} ({f.name})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Diagnosis *</Label>
                  <Input name="diagnosis" required placeholder="e.g. Respiratory infection" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Medication *</Label>
                  <Input name="medication" required placeholder="e.g. Oxytetracycline" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Dosage</Label>
                  <Input name="dosage" placeholder="e.g. As prescribed" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Duration</Label>
                  <Input name="duration" placeholder="e.g. 5 days" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Cost (GHS)</Label>
                  <Input name="cost" type="number" min="0" step="0.5" placeholder="e.g. 200" className="h-9 text-sm" />
                </div>
                <div className="flex items-end col-span-2">
                  <Button type="submit" className="w-full md:w-auto h-9"><Plus className="h-3 w-3 mr-1" />Record Treatment</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Treatment Records</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {treatments.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg text-sm">
                      <Activity className={`h-4 w-4 shrink-0 ${t.status === 'Ongoing' ? 'text-purple-600' : 'text-green-600'}`} />
                      <div className="flex-1">
                        <p className="font-medium">{t.diagnosis}</p>
                        <p className="text-xs text-gray-500">
                          {t.flock?.name} · {t.farm?.name} · {new Date(t.date).toLocaleDateString('en-GB')}
                        </p>
                        <p className="text-xs text-gray-500">{t.medication} · {t.dosage || ''} · {t.duration || ''}</p>
                      </div>
                      <Badge variant={t.status === 'Ongoing' ? 'secondary' : 'default'}>{t.status}</Badge>
                    </div>
                  ))}
                  {treatments.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No treatments recorded</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Completed Vaccinations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-72">
                <div className="space-y-2">
                  {completed.map(v => (
                    <div key={v.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{v.vaccineName}</p>
                        <p className="text-xs text-gray-500">{v.flock?.name} · {v.farm?.name} · {v.method || ''}</p>
                      </div>
                      <p className="text-xs text-green-600">{v.administeredDate ? new Date(v.administeredDate).toLocaleDateString('en-GB') : ''}</p>
                    </div>
                  ))}
                  {completed.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No completed vaccinations</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
