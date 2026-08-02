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
  Stethoscope, Plus, Shield, AlertTriangle, Syringe, Activity, CheckCircle2, Clock, Heart, Pencil, BookOpen, ClipboardList,
  Users, XCircle, Info, TrendingDown, ChevronRight
} from 'lucide-react'
import { AmendmentRequestDialog } from '@/components/farm/AmendmentRequestDialog'
import { getScheduleForAge, BOVAN_BROWN_SCHEDULE } from '@/lib/vaccination-schedule'
import type { ScheduleItem } from '@/lib/vaccination-schedule'

interface Farm { id: string; name: string; flocks: any[] }
interface FlockWithAge { id: string; name: string; birdType: string; breed: string | null; birdCount: number; initialBirdCount: number; farmId: string; farm: { name: string }; currentAgeWeeks: number; losses: number; lossPercent: number; dateArrival: string }
interface Vaccination { id: string; vaccineName: string; scheduledDate: string; administeredDate: string | null; status: string; method: string; dosage: string | null; batchNo: string | null; cost: number | null; flock: { name: string; birdType: string; birdCount: number; id: string }; farm: { name: string; id: string } }
interface Treatment { id: string; date: string; diagnosis: string; medication: string; dosage: string; duration: string; cost: number; status: string; flock: { name: string; id: string }; farm: { name: string } }
interface HealthCheck { id: string; date: string; overallStatus: string; symptoms: string | null; bodyCondition: string | null; temperature: number | null; recommendations: string | null; flock: { name: string; birdType: string; id: string }; farm: { name: string } }
interface MortalityRecord { id: string; flockId: string; farmId: string; date: string; count: number; cause: string | null; notes: string | null; flock: { name: string; id: string } | null; farm: { name: string; id: string } | null }

export function VetDashboard() {
  const { selectedFarmId, setFarm, currentUser } = useAppStore()
  const [farms, setFarms] = useState<Farm[]>([])
  const [allFlocks, setAllFlocks] = useState<FlockWithAge[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [mortalityRecords, setMortalityRecords] = useState<MortalityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [amendmentOpen, setAmendmentOpen] = useState(false)
  const [amendmentTarget, setAmendmentTarget] = useState<{ recordType: string; recordId: string; fields: any[] }>({ recordType: '', recordId: '', fields: [] })

  // Form Select state (Radix Select doesn't use native form elements)
  const [healthFarmId, setHealthFarmId] = useState(selectedFarmId || '')
  const [healthFlockId, setHealthFlockId] = useState('')
  const [healthStatus, setHealthStatus] = useState('')
  const [healthBodyCondition, setHealthBodyCondition] = useState('')
  const [vacFarmId, setVacFarmId] = useState(selectedFarmId || '')
  const [vacFlockId, setVacFlockId] = useState('')
  const [vacVaccineName, setVacVaccineName] = useState('')
  const [vacMethod, setVacMethod] = useState('')
  const [treatFarmId, setTreatFarmId] = useState(selectedFarmId || '')
  const [treatFlockId, setTreatFlockId] = useState('')

  // Controlled input state for health check form
  const [healthSymptoms, setHealthSymptoms] = useState('')
  const [healthTemperature, setHealthTemperature] = useState('')
  const [healthRecommendations, setHealthRecommendations] = useState('')

  // Controlled input state for vaccination form
  const [vacScheduledDate, setVacScheduledDate] = useState(new Date().toISOString().split('T')[0])
  const [vacDosage, setVacDosage] = useState('')
  const [vacCost, setVacCost] = useState('')
  const [vacBatchNo, setVacBatchNo] = useState('')

  // Controlled input state for treatment form
  const [treatDiagnosis, setTreatDiagnosis] = useState('')
  const [treatMedication, setTreatMedication] = useState('')
  const [treatDosage, setTreatDosage] = useState('')
  const [treatDuration, setTreatDuration] = useState('')
  const [treatCost, setTreatCost] = useState('')

  useEffect(() => {
    if (selectedFarmId) {
      setHealthFarmId(selectedFarmId)
      setVacFarmId(selectedFarmId)
      setTreatFarmId(selectedFarmId)
    }
  }, [selectedFarmId])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [farmsRes, flocksRes, vacRes, treatRes, healthRes, mortRes] = await Promise.all([
        fetch('/api/farms'),
        fetch(`/api/flocks`),
        fetch(`/api/vaccinations${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/treatments${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/health${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
        fetch(`/api/mortality${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`),
      ])
      if (farmsRes.ok) setFarms(await farmsRes.json())
      if (flocksRes.ok) {
        const fd = await flocksRes.json()
        setAllFlocks(Array.isArray(fd) ? fd : (fd.flocks || []))
      }
      if (vacRes.ok) setVaccinations(await vacRes.json())
      if (treatRes.ok) setTreatments(await treatRes.json())
      if (healthRes.ok) setHealthChecks(await healthRes.json())
      if (mortRes.ok) setMortalityRecords(await mortRes.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedFarmId])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh: Vet sees mortality and flock data from farm hand in real-time
  const handleAutoData = useCallback((results: any[]) => {
    if (results && results.length >= 6) {
      setFarms(results[0] || [])
      setAllFlocks(Array.isArray(results[1]) ? results[1] : (results[1]?.flocks || []))
      setVaccinations(results[2] || [])
      setTreatments(results[3] || [])
      setHealthChecks(results[4] || [])
      setMortalityRecords(results[5] || [])
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

  // ============ FLOCK-LEVEL INTELLIGENCE ============
  // Recent mortality (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
  const recentMortality = mortalityRecords.filter(m => new Date(m.date) >= sevenDaysAgo)

  // Group recent mortality by flock
  const mortalityByFlock: Record<string, { total: number; records: MortalityRecord[]; flockName: string; farmName: string; cause: string | null }> = {}
  for (const m of recentMortality) {
    if (!mortalityByFlock[m.flockId]) {
      mortalityByFlock[m.flockId] = {
        total: 0,
        records: [],
        flockName: m.flock?.name || 'Unknown Flock',
        farmName: m.farm?.name || 'Unknown Farm',
        cause: m.cause,
      }
    }
    mortalityByFlock[m.flockId].total += m.count
    mortalityByFlock[m.flockId].records.push(m)
  }

  // Flocks with high loss percentage (>5%)
  const highLossFlocks = allFlocks.filter(f => f.lossPercent > 5 && f.birdCount > 0)

  // Flocks with zero birds (depleted)
  const depletedFlocks = allFlocks.filter(f => f.initialBirdCount > 0 && f.birdCount === 0)

  // Flocks that had birds added (current > initial means CEO added birds)
  const expandedFlocks = allFlocks.filter(f => f.birdCount > f.initialBirdCount && f.initialBirdCount > 0)

  // Total birds under care
  const totalBirds = allFlocks.reduce((sum, f) => sum + f.birdCount, 0)
  const totalInitialBirds = allFlocks.reduce((sum, f) => sum + f.initialBirdCount, 0)

  // Get a flock object by ID
  const getFlockById = (id: string) => allFlocks.find(f => f.id === id)

  // Check if a vaccination from the standard schedule was recorded in DB for a flock
  const isVaccineRecorded = (flockId: string, vaccineKeyword: string): boolean => {
    return vaccinations.some(v =>
      v.flock?.id === flockId &&
      v.status === 'Completed' &&
      v.vaccineName.toLowerCase().includes(vaccineKeyword.toLowerCase())
    )
  }

  // Quick-schedule a vaccination from the standard schedule
  const quickScheduleVaccine = async (flock: FlockWithAge, item: ScheduleItem) => {
    try {
      const data = {
        flockId: flock.id,
        farmId: flock.farmId,
        vaccineName: item.vaccine,
        scheduledDate: today,
        status: 'Scheduled',
        method: item.method,
        notes: `Auto-scheduled from Bovan Brown standard schedule (Week ${item.week})${item.notes ? ` — ${item.notes}` : ''}`,
      }
      const res = await fetch('/api/vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success(`Scheduled ${item.vaccine} for ${flock.name}`)
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to schedule')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to schedule vaccination')
    }
  }

  // Mark treatment as completed
  const markTreatmentDone = async (id: string) => {
    const res = await fetch('/api/treatments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'Completed' }),
    })
    if (res.ok) { toast.success('Treatment marked as completed'); fetchData() }
    else toast.error('Failed to update')
  }

  const submitHealthCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const data = {
        flockId: healthFlockId,
        farmId: healthFarmId,
        date: today,
        overallStatus: healthStatus,
        symptoms: healthSymptoms.trim() || null,
        temperature: healthTemperature ? Number(healthTemperature) : null,
        bodyCondition: healthBodyCondition || null,
        recommendations: healthRecommendations.trim() || null,
        vetOfficer: currentUser?.name || 'Vet Officer',
      }
      if (!data.farmId || !data.flockId || !data.overallStatus) { toast.error('Please select farm, flock and status'); return }
      const res = await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) {
        toast.success('Health check recorded!')
        setHealthSymptoms(''); setHealthTemperature(''); setHealthRecommendations('')
        setHealthStatus(''); setHealthBodyCondition(''); setHealthFlockId('')
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save')
      }
    } catch (err) { console.error(err); toast.error('Failed to save health check') }
  }

  const submitVaccination = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const data = {
        flockId: vacFlockId,
        farmId: vacFarmId,
        vaccineName: vacVaccineName,
        scheduledDate: vacScheduledDate || today,
        status: 'Scheduled',
        method: vacMethod || null,
        dosage: vacDosage.trim() || null,
        cost: vacCost ? Number(vacCost) : null,
        batchNo: vacBatchNo.trim() || null,
      }
      if (!data.farmId || !data.flockId || !data.vaccineName) { toast.error('Please select farm, flock and vaccine'); return }
      const res = await fetch('/api/vaccinations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) {
        toast.success('Vaccination scheduled!')
        setVacVaccineName(''); setVacMethod(''); setVacDosage(''); setVacCost(''); setVacBatchNo('')
        setVacFlockId('')
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to schedule')
      }
    } catch (err) { console.error(err); toast.error('Failed to schedule vaccination') }
  }

  const submitTreatment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const data = {
        flockId: treatFlockId,
        farmId: treatFarmId,
        date: today,
        diagnosis: treatDiagnosis.trim(),
        medication: treatMedication.trim(),
        dosage: treatDosage.trim() || null,
        duration: treatDuration.trim() || null,
        cost: treatCost ? Number(treatCost) : null,
        status: 'Ongoing',
        vetOfficer: currentUser?.name || 'Vet Officer',
      }
      if (!data.farmId || !data.flockId || !data.diagnosis || !data.medication) { toast.error('Please select farm, flock, diagnosis and medication'); return }
      const res = await fetch('/api/treatments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) {
        toast.success('Treatment recorded!')
        setTreatDiagnosis(''); setTreatMedication(''); setTreatDosage(''); setTreatDuration(''); setTreatCost('')
        setTreatFlockId('')
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save')
      }
    } catch (err) { console.error(err); toast.error('Failed to save treatment') }
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

  const openAmendmentDialog = (recordType: string, recordId: string, fields: any[]) => {
    setAmendmentTarget({ recordType, recordId, fields })
    setAmendmentOpen(true)
  }

  if (loading && farms.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'Overdue': return 'destructive'
      case 'Scheduled': return 'secondary'
      case 'Completed': return 'default'
      default: return 'secondary'
    }
  }

  // Helper: render a flock selector with bird count
  const renderFlockSelector = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {allFlocks.map(fl => (
          <SelectItem key={fl.id} value={fl.id}>
            <span className="flex items-center gap-1.5">
              <span>{fl.name}</span>
              <span className="text-gray-400 text-[10px]">({fl.farm?.name})</span>
              <span className={`font-medium text-[10px] ${fl.birdCount === 0 ? 'text-red-500' : fl.lossPercent > 5 ? 'text-amber-600' : 'text-green-600'}`}>
                [{fl.birdCount.toLocaleString()} birds]
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  // Helper: show bird count info for a selected flock
  const FlockInfoBadge = ({ flockId }: { flockId: string }) => {
    const flock = getFlockById(flockId)
    if (!flock) return null
    return (
      <div className={`col-span-2 md:col-span-3 flex items-center gap-3 p-2 rounded-lg text-xs ${
        flock.birdCount === 0 ? 'bg-red-50 border border-red-200' :
        flock.lossPercent > 5 ? 'bg-amber-50 border border-amber-200' :
        'bg-green-50 border border-green-200'
      }`}>
        <Users className={`h-4 w-4 ${flock.birdCount === 0 ? 'text-red-500' : flock.lossPercent > 5 ? 'text-amber-500' : 'text-green-500'}`} />
        <span className="font-medium">{flock.name}</span>
        <span>· {flock.farm?.name}</span>
        <span>· <strong>{flock.birdCount.toLocaleString()}</strong> birds</span>
        <span>· Age: <strong>{flock.currentAgeWeeks} weeks</strong></span>
        {flock.losses > 0 && (
          <span className="text-red-600">· <TrendingDown className="h-3 w-3 inline" /> {flock.losses} lost ({flock.lossPercent}%)</span>
        )}
        {flock.birdCount === 0 && (
          <Badge variant="destructive" className="text-[10px]">DEPLETED — No birds</Badge>
        )}
        {flock.lossPercent > 5 && flock.birdCount > 0 && (
          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">High Loss Rate</Badge>
        )}
        {flock.birdCount > 0 && (
          <span className="text-gray-400 ml-auto">Est. vaccine doses needed: <strong>{flock.birdCount.toLocaleString()}</strong></span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ===== FLOCK POPULATION ALERTS ===== */}
      {/* Alert: Depleted Flocks */}
      {depletedFlocks.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-bold text-red-800">{depletedFlocks.length} Depleted Flock{depletedFlocks.length > 1 ? 's' : ''}</p>
            </div>
            <ScrollArea className="max-h-24">
              <div className="space-y-1">
                {depletedFlocks.map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-xs text-red-700">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-gray-500">·</span>
                    <span>{f.farm?.name}</span>
                    <span className="text-gray-500">·</span>
                    <span>Started with {f.initialBirdCount.toLocaleString()} birds — now 0</span>
                    <Badge variant="destructive" className="text-[10px] ml-auto">Skip vaccinations</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Alert: Recent Mortality Events */}
      {Object.keys(mortalityByFlock).length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-bold text-orange-800">Recent Mortality (Last 7 Days)</p>
            </div>
            <ScrollArea className="max-h-28">
              <div className="space-y-1">
                {Object.entries(mortalityByFlock).map(([flockId, info]) => {
                  const flock = getFlockById(flockId)
                  const hasDiseaseCause = info.cause && ['Disease', 'Illness', 'Infection', 'Sickness'].some(c => info.cause?.toLowerCase().includes(c.toLowerCase()))
                  const hasOngoingTreatment = treatments.some(t => t.flock?.id === flockId && t.status === 'Ongoing')
                  return (
                    <div key={flockId} className="flex items-center gap-2 text-xs p-1.5 bg-white/60 rounded-lg">
                      <span className="font-bold text-red-700">{info.total} died</span>
                      <span>{info.flockName}</span>
                      <span className="text-gray-500">·</span>
                      <span>{info.farmName}</span>
                      {info.cause && <Badge variant="outline" className="text-[10px]">{info.cause}</Badge>}
                      {flock && <span className="text-gray-500">{flock.birdCount.toLocaleString()} remaining</span>}
                      {hasDiseaseCause && !hasOngoingTreatment && (
                        <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2 ml-auto"
                          onClick={() => { setTreatFarmId(flock?.farmId || ''); setTreatFlockId(flockId); }}>
                          Record Treatment
                        </Button>
                      )}
                      {!hasDiseaseCause && !hasOngoingTreatment && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 ml-auto text-orange-700 border-orange-300"
                          onClick={() => { setHealthFarmId(flock?.farmId || ''); setHealthFlockId(flockId); }}>
                          Health Check
                        </Button>
                      )}
                      {hasOngoingTreatment && (
                        <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 ml-auto">Treatment Active</Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Alert: High Loss Rate Flocks */}
      {highLossFlocks.filter(f => !depletedFlocks.some(d => d.id === f.id)).length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-bold text-amber-800">High Loss Rate Flocks (&gt;5%)</p>
            </div>
            <ScrollArea className="max-h-24">
              <div className="space-y-1">
                {highLossFlocks.filter(f => !depletedFlocks.some(d => d.id === f.id)).map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-xs text-amber-700">
                    <TrendingDown className="h-3 w-3" />
                    <span className="font-medium">{f.name}</span>
                    <span className="text-gray-500">·</span>
                    <span>{f.farm?.name}</span>
                    <span className="text-gray-500">·</span>
                    <span>{f.losses} lost of {f.initialBirdCount.toLocaleString()} ({f.lossPercent}%)</span>
                    <span className="font-medium ml-auto">{f.birdCount.toLocaleString()} birds remaining</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Alert: Expanded Flocks (birds added by CEO) */}
      {expandedFlocks.length > 0 && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-bold text-blue-800">Flock Population Updated</p>
            </div>
            <p className="text-xs text-blue-600 mb-1.5">New birds added — check if catch-up vaccinations are needed.</p>
            <div className="space-y-1">
              {expandedFlocks.map(f => {
                const added = f.birdCount - f.initialBirdCount
                return (
                  <div key={f.id} className="flex items-center gap-2 text-xs text-blue-700 p-1.5 bg-white/60 rounded-lg">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-gray-500">·</span>
                    <span>{f.farm?.name}</span>
                    <span className="text-blue-600 font-medium">+{added.toLocaleString()} birds added</span>
                    <span className="text-gray-500">(now {f.birdCount.toLocaleString()} total)</span>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 ml-auto text-blue-700 border-blue-300"
                      onClick={() => { setVacFarmId(f.farmId); setVacFlockId(f.id); }}>
                      Schedule Vaccination
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Vaccination Alerts */}
      {overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-bold text-red-800">{overdue.length} Overdue Vaccination{overdue.length > 1 ? 's' : ''}</p>
            </div>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {overdue.slice(0, 5).map(v => {
                  const flock = getFlockById(v.flock?.id)
                  return (
                    <div key={v.id} className="flex items-center gap-2 text-xs">
                      <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                      <span>{v.vaccineName}</span>
                      <span className="text-gray-500">·</span>
                      <span>{v.flock?.name}</span>
                      <span className="text-gray-500">·</span>
                      <span>{v.farm?.name}</span>
                      {flock && <span className="text-gray-400">({flock.birdCount} birds)</span>}
                      <Button size="sm" variant="outline" className="h-6 ml-auto text-[10px] px-2" onClick={() => markVaccinationDone(v.id)}>
                        Mark Done
                      </Button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-500">Birds Under Care</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalBirds.toLocaleString()}</p>
            <p className="text-xs text-gray-500">across {allFlocks.filter(f => f.birdCount > 0).length} active flocks</p>
          </CardContent>
        </Card>
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
              <span className="text-xs text-gray-500">Upcoming (14d)</span>
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
        endpoints={['/api/farms', '/api/flocks', `/api/vaccinations${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/treatments${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/health${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`, `/api/mortality${selectedFarmId ? `?farmId=${selectedFarmId}` : ''}`]}
        interval={20000}
        onData={handleAutoData}
        compact
      />

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="schedule"><Syringe className="h-3 w-3 mr-1" />Vaccinations</TabsTrigger>
          <TabsTrigger value="std-schedule"><BookOpen className="h-3 w-3 mr-1" />Std Schedule</TabsTrigger>
          <TabsTrigger value="health"><Stethoscope className="h-3 w-3 mr-1" />Health</TabsTrigger>
          <TabsTrigger value="treatments"><Activity className="h-3 w-3 mr-1" />Treatments</TabsTrigger>
          <TabsTrigger value="history"><CheckCircle2 className="h-3 w-3 mr-1" />History</TabsTrigger>
        </TabsList>

        {/* ===== VACCINATIONS TAB ===== */}
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
                  <Select value={vacFarmId} onValueChange={(v) => { setVacFarmId(v); setVacFlockId('') }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Flock *</Label>
                  {renderFlockSelector(vacFlockId, setVacFlockId, 'Select flock')}
                </div>
                {vacFlockId && <FlockInfoBadge flockId={vacFlockId} />}
                <div>
                  <Label className="text-xs">Vaccine *</Label>
                  <Select value={vacVaccineName} onValueChange={setVacVaccineName}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select vaccine" /></SelectTrigger>
                    <SelectContent>
                      {['Newcastle Disease', 'Gumboro', 'Fowl Pox', 'Fowl Typhoid', 'Infectious Bronchitis', 'Coryza', 'Newcastle Booster', 'Marek\'s Disease', 'Coccidiosis', 'Egg Drop Syndrome'].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Scheduled Date</Label>
                  <Input type="date" value={vacScheduledDate} onChange={e => setVacScheduledDate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Method</Label>
                  <Select value={vacMethod} onValueChange={setVacMethod}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Eye drop">Eye Drop</SelectItem>
                      <SelectItem value="Drinking water">Drinking Water</SelectItem>
                      <SelectItem value="Injection">Injection</SelectItem>
                      <SelectItem value="Spray">Spray</SelectItem>
                      <SelectItem value="Wing web puncture">Wing Web Puncture</SelectItem>
                      <SelectItem value="Feed medication">Feed Medication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Batch No.</Label>
                  <Input placeholder="VAC-XXXX" value={vacBatchNo} onChange={e => setVacBatchNo(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Cost (GHS)</Label>
                  <Input type="number" min="0" step="0.5" placeholder="e.g. 150" value={vacCost} onChange={e => setVacCost(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Dosage</Label>
                  <Input placeholder="e.g. 0.5ml per bird" value={vacDosage} onChange={e => setVacDosage(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="flex items-end col-span-2 md:col-span-3">
                  <Button type="submit" className="w-full md:w-auto h-9" disabled={!!(vacFlockId && getFlockById(vacFlockId)?.birdCount === 0)}>
                    <Plus className="h-3 w-3 mr-1" />Schedule Vaccination
                  </Button>
                  {vacFlockId && getFlockById(vacFlockId)?.birdCount === 0 && (
                    <span className="text-xs text-red-500 ml-3">Cannot vaccinate a depleted flock</span>
                  )}
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
                    {overdue.map(v => {
                      const flock = getFlockById(v.flock?.id)
                      return (
                        <div key={v.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm">
                          <Badge variant="destructive">Overdue</Badge>
                          <div className="flex-1">
                            <p className="font-medium">{v.vaccineName}</p>
                            <p className="text-xs text-gray-500">
                              {v.flock?.name} · {v.farm?.name} · {v.method || ''}
                              {flock && <span> · {flock.birdCount.toLocaleString()} birds</span>}
                            </p>
                          </div>
                          <Button size="sm" variant="default" className="h-7 text-[10px]" onClick={() => markVaccinationDone(v.id)}>
                            Done
                          </Button>
                        </div>
                      )
                    })}
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
                    {upcoming.map(v => {
                      const flock = getFlockById(v.flock?.id)
                      return (
                        <div key={v.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-sm">
                          <Badge variant="secondary">Scheduled</Badge>
                          <div className="flex-1">
                            <p className="font-medium">{v.vaccineName}</p>
                            <p className="text-xs text-gray-500">
                              {v.flock?.name} · {v.farm?.name}
                              {flock && <span> · {flock.birdCount.toLocaleString()} birds</span>}
                            </p>
                          </div>
                          <p className="text-xs text-amber-600">{new Date(v.scheduledDate).toLocaleDateString('en-GB')}</p>
                        </div>
                      )
                    })}
                    {upcoming.length === 0 && <p className="text-center text-gray-400 py-3 text-xs">No upcoming vaccinations</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== STANDARD SCHEDULE TAB (cross-referenced with DB) ===== */}
        <TabsContent value="std-schedule">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-600" />
                Bovan Brown Standard Vaccination Schedule
              </CardTitle>
              <CardDescription>
                Auto-linked to each flock based on bird age in weeks.
                Items are cross-checked against recorded vaccinations in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-4">
                  {allFlocks.filter(f => f.birdType === 'Layer' && f.birdCount > 0).map(flock => {
                    const schedule = getScheduleForAge(flock.currentAgeWeeks)
                    return (
                      <div key={flock.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{flock.name}</p>
                            <p className="text-xs text-gray-500">
                              {flock.farm?.name} · {flock.breed || 'Layer'} · <span className="font-medium">{flock.currentAgeWeeks} weeks old</span>
                              <span className="ml-2 font-medium text-blue-700">{flock.birdCount.toLocaleString()} birds</span>
                              {flock.losses > 0 && (
                                <span className="ml-2 text-red-600">({flock.losses} lost, {flock.lossPercent}%)</span>
                              )}
                            </p>
                          </div>
                          <Badge variant={schedule.current.length > 0 ? 'destructive' : 'default'}>
                            {schedule.current.length > 0 ? `${schedule.current.length} DUE` : 'Up to date'}
                          </Badge>
                        </div>

                        {/* DUE NOW section */}
                        {schedule.current.length > 0 && (
                          <div className="mx-3 mt-1">
                            <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Due This Week
                            </p>
                            <div className="space-y-1">
                              {schedule.current.map((item, i) => {
                                const recorded = isVaccineRecorded(flock.id, item.vaccine.split('(')[0].trim())
                                return (
                                  <div key={i} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs">
                                    <Badge variant="destructive" className="text-[10px] shrink-0">Week {item.week}</Badge>
                                    <div className="flex-1">
                                      <p className="font-medium">{item.vaccine}</p>
                                      <p className="text-gray-500">{item.method}{item.notes ? ` · ${item.notes}` : ''}</p>
                                    </div>
                                    <Badge variant={item.type === 'vaccination' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                                      {item.type === 'vaccination' ? 'Vaccine' : item.type === 'deworming' ? 'Deworm' : 'Prevention'}
                                    </Badge>
                                    {recorded ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    ) : (
                                      <Button size="sm" variant="default" className="h-6 text-[10px] px-2 shrink-0"
                                        onClick={() => quickScheduleVaccine(flock, item)}>
                                        <ChevronRight className="h-3 w-3 mr-0.5" />Schedule
                                      </Button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Upcoming section */}
                        {schedule.upcoming.length > 0 && (
                          <div className="mx-3 mt-1">
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Coming Up (within 4 weeks)
                            </p>
                            <div className="space-y-1">
                              {schedule.upcoming.map((item, i) => {
                                const recorded = isVaccineRecorded(flock.id, item.vaccine.split('(')[0].trim())
                                return (
                                  <div key={i} className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                                    <Badge variant="secondary" className="text-[10px] shrink-0">Week {item.week}</Badge>
                                    <div className="flex-1">
                                      <p className="font-medium">{item.vaccine}</p>
                                      <p className="text-gray-500">{item.method}</p>
                                    </div>
                                    <Badge variant={item.type === 'vaccination' ? 'outline' : 'secondary'} className="text-[10px] shrink-0">
                                      {item.type === 'vaccination' ? 'Vaccine' : item.type === 'deworming' ? 'Deworm' : 'Prevention'}
                                    </Badge>
                                    {recorded ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    ) : (
                                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 shrink-0"
                                        onClick={() => quickScheduleVaccine(flock, item)}>
                                        Schedule
                                      </Button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Past / completed section — cross-referenced with DB */}
                        <div className="mx-3 mt-3">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Schedule</p>
                          <div className="space-y-0.5">
                            {schedule.all.filter(s => s.type === 'vaccination').map((item, i) => {
                              const isDone = item.week < flock.currentAgeWeeks - 1
                              const isDue = schedule.current.some(c => c.vaccine === item.vaccine && c.week === item.week)
                              const isUpcoming = schedule.upcoming.some(c => c.vaccine === item.vaccine && c.week === item.week)
                              const recorded = isVaccineRecorded(flock.id, item.vaccine.split('(')[0].trim())
                              return (
                                <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${isDue ? 'bg-red-50 font-medium' : isUpcoming ? 'bg-amber-50' : isDone ? 'text-gray-400' : 'text-gray-300'}`}>
                                  <span className="w-12 text-right shrink-0">Wk {item.week}</span>
                                  <span className="flex-1 truncate">{item.vaccine}</span>
                                  <span className="w-20 text-right shrink-0 text-gray-400">{item.method}</span>
                                  {recorded ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" /> : isDone ? <XCircle className="h-3 w-3 text-red-400 shrink-0" /> : null}
                                  {isDue && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Missing vaccinations summary */}
                        {(() => {
                          const pastVaccines = schedule.all.filter(s => s.type === 'vaccination' && s.week < flock.currentAgeWeeks - 1)
                          const missing = pastVaccines.filter(pv => !isVaccineRecorded(flock.id, pv.vaccine.split('(')[0].trim()))
                          if (missing.length === 0) return null
                          return (
                            <div className="mx-3 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-xs font-bold text-yellow-800 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {missing.length} Past Vaccination{missing.length > 1 ? 's' : ''} Not Recorded
                              </p>
                              <p className="text-xs text-yellow-700 mt-0.5">
                                These should have been administered already. Consider catch-up if not done manually:
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {missing.map((m, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] border-yellow-300 text-yellow-800">
                                    Wk {m.week}: {m.vaccine}
                                  </Badge>
                                ))}
                              </div>
                              <Button size="sm" variant="outline" className="h-6 text-[10px] mt-1.5 border-yellow-400 text-yellow-800"
                                onClick={() => {
                                  missing.forEach(m => quickScheduleVaccine(flock, m))
                                }}>
                                Schedule All Missing
                              </Button>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                  {allFlocks.filter(f => f.birdType === 'Layer' && f.birdCount > 0).length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-400">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No active layer flocks found.</p>
                      <p className="text-xs">Flocks with birds will appear here with their due vaccinations.</p>
                    </div>
                  )}
                  {depletedFlocks.length > 0 && (
                    <div className="text-center py-4 text-xs text-gray-400 mt-2">
                      <XCircle className="h-4 w-4 mx-auto mb-1 text-red-300" />
                      Depleted flocks ({depletedFlocks.map(f => `${f.name}`).join(', ')}) are hidden — no birds to vaccinate.
                    </div>
                  )}
                  {allFlocks.filter(f => f.birdType !== 'Layer' && f.birdCount > 0).length > 0 && (
                    <div className="text-center py-4 text-xs text-gray-400 mt-2">
                      Non-layer flocks ({allFlocks.filter(f => f.birdType !== 'Layer' && f.birdCount > 0).map(f => `${f.name}`).join(', ')}) are not shown — the standard schedule is for Bovan Brown layers.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== HEALTH TAB ===== */}
        <TabsContent value="health">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Health Check</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitHealthCheck} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Farm *</Label>
                  <Select value={healthFarmId} onValueChange={(v) => { setHealthFarmId(v); setHealthFlockId('') }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Flock *</Label>
                  {renderFlockSelector(healthFlockId, setHealthFlockId, 'Select flock')}
                </div>
                {healthFlockId && <FlockInfoBadge flockId={healthFlockId} />}
                <div>
                  <Label className="text-xs">Overall Status *</Label>
                  <Select value={healthStatus} onValueChange={setHealthStatus}>
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
                  <Input type="number" step="0.1" placeholder="e.g. 41.5" value={healthTemperature} onChange={e => setHealthTemperature(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Body Condition</Label>
                  <Select value={healthBodyCondition} onValueChange={setHealthBodyCondition}>
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
                  <Input placeholder="e.g. Coughing, Lethargy" value={healthSymptoms} onChange={e => setHealthSymptoms(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Recommendations</Label>
                  <Textarea placeholder="Veterinary recommendations..." value={healthRecommendations} onChange={e => setHealthRecommendations(e.target.value)} className="text-sm min-h-[60px]" />
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
                  {healthChecks.slice(0, 15).map(h => {
                    const flock = getFlockById(h.flock?.id)
                    return (
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
                            {flock && <span> · {flock.birdCount.toLocaleString()} birds</span>}
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
                    )
                  })}
                  {healthChecks.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No health checks recorded</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TREATMENTS TAB ===== */}
        <TabsContent value="treatments">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Treatment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitTreatment} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Farm *</Label>
                  <Select value={treatFarmId} onValueChange={(v) => { setTreatFarmId(v); setTreatFlockId('') }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Flock *</Label>
                  {renderFlockSelector(treatFlockId, setTreatFlockId, 'Select flock')}
                </div>
                {treatFlockId && <FlockInfoBadge flockId={treatFlockId} />}
                <div>
                  <Label className="text-xs">Diagnosis *</Label>
                  <Input required placeholder="e.g. Respiratory infection" value={treatDiagnosis} onChange={e => setTreatDiagnosis(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Medication *</Label>
                  <Input required placeholder="e.g. Oxytetracycline" value={treatMedication} onChange={e => setTreatMedication(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Dosage</Label>
                  <Input placeholder="e.g. As prescribed" value={treatDosage} onChange={e => setTreatDosage(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Duration</Label>
                  <Input placeholder="e.g. 5 days" value={treatDuration} onChange={e => setTreatDuration(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Cost (GHS)</Label>
                  <Input type="number" min="0" step="0.5" placeholder="e.g. 200" value={treatCost} onChange={e => setTreatCost(e.target.value)} className="h-9 text-sm" />
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
                  {treatments.map(t => {
                    const flock = getFlockById(t.flock?.id)
                    return (
                      <div key={t.id} className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg text-sm">
                        <Activity className={`h-4 w-4 shrink-0 ${t.status === 'Ongoing' ? 'text-purple-600' : 'text-green-600'}`} />
                        <div className="flex-1">
                          <p className="font-medium">{t.diagnosis}</p>
                          <p className="text-xs text-gray-500">
                            {t.flock?.name} · {t.farm?.name} · {new Date(t.date).toLocaleDateString('en-GB')}
                            {flock && <span> · {flock.birdCount.toLocaleString()} birds</span>}
                          </p>
                          <p className="text-xs text-gray-500">{t.medication} · {t.dosage || ''} · {t.duration || ''}</p>
                        </div>
                        <Badge variant={t.status === 'Ongoing' ? 'secondary' : 'default'}>{t.status}</Badge>
                        {t.status === 'Ongoing' && (
                          <Button size="sm" variant="default" className="h-7 text-[10px] shrink-0" onClick={() => markTreatmentDone(t.id)}>
                            Done
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0 text-gray-400 hover:text-amber-600" onClick={() => openAmendmentDialog('Treatment', t.id, [
                          { key: 'diagnosis', label: 'Diagnosis', type: 'text' as const, value: t.diagnosis },
                          { key: 'medication', label: 'Medication', type: 'text' as const, value: t.medication },
                          { key: 'dosage', label: 'Dosage', type: 'text' as const, value: t.dosage || '' },
                          { key: 'duration', label: 'Duration', type: 'text' as const, value: t.duration || '' },
                          { key: 'status', label: 'Status', type: 'text' as const, value: t.status },
                        ])}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                  {treatments.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No treatments recorded</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== HISTORY TAB ===== */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Completed Vaccinations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-72">
                <div className="space-y-2">
                  {completed.map(v => {
                    const flock = getFlockById(v.flock?.id)
                    return (
                      <div key={v.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{v.vaccineName}</p>
                          <p className="text-xs text-gray-500">
                            {v.flock?.name} · {v.farm?.name} · {v.method || ''}
                            {flock && <span> · {flock.birdCount.toLocaleString()} birds currently</span>}
                            {v.batchNo && <span> · Batch: {v.batchNo}</span>}
                            {v.cost && <span> · GHS {v.cost}</span>}
                          </p>
                        </div>
                        <p className="text-xs text-green-600">{v.administeredDate ? new Date(v.administeredDate).toLocaleDateString('en-GB') : ''}</p>
                      </div>
                    )
                  })}
                  {completed.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No completed vaccinations</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
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
