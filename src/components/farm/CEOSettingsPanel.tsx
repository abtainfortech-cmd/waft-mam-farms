'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/app'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Settings, Building2, Plus, Trash2, Pencil, Loader2, Check, X, AlertTriangle,
  RotateCcw, MapPin, Phone, Navigation
} from 'lucide-react'

interface FarmInfo {
  id: string
  name: string
  location: string
  address?: string
  phone?: string
  isActive: boolean
}

// ============ FARM NAME EDITOR ============
function FarmNameEditor() {
  const { currentUser } = useAppStore()
  const [farmName, setFarmName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getFarmName', role: currentUser?.role }),
      })
      if (res.ok) {
        const data = await res.json()
        setFarmName(data.farmName)
        setSavedName(data.farmName)
      }
    } catch {}
  }, [currentUser?.role])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    if (!farmName.trim() || farmName.trim().length < 2) {
      toast.error('Farm name must be at least 2 characters')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateFarmName', farmName: farmName.trim(), role: currentUser?.role }),
      })
      if (res.ok) {
        toast.success('Farm name updated successfully')
        setSavedName(farmName.trim())
        setEditing(false)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to update farm name')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4 text-amber-600" />
          Farm Name
        </CardTitle>
        <CardDescription className="text-xs">
          This name appears across all dashboards, login screens, and reports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Farm / Business Name</Label>
              <Input
                value={farmName}
                onChange={e => setFarmName(e.target.value)}
                placeholder="Enter farm name"
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setFarmName(savedName); setEditing(false) }} className="h-8 text-xs">
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{savedName}</p>
              <p className="text-[10px] text-gray-500">Currently displayed across the system</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8 text-xs gap-1">
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ FARM LOCATIONS MANAGER ============
function FarmLocationsManager() {
  const { currentUser } = useAppStore()
  const [farms, setFarms] = useState<FarmInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editFarm, setEditFarm] = useState<FarmInfo | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const fetchFarms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/farms')
      if (res.ok) setFarms(await res.json())
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFarms() }, [fetchFarms])

  const handleAddFarm = async () => {
    if (!newName.trim() || !newLocation.trim()) {
      toast.error('Farm name and location are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          location: newLocation.trim(),
          address: newAddress.trim() || undefined,
          phone: newPhone.trim() || undefined,
        }),
      })
      if (res.ok) {
        toast.success(`Farm "${newName.trim()}" added successfully`)
        setAddOpen(false)
        setNewName(''); setNewLocation(''); setNewAddress(''); setNewPhone('')
        fetchFarms()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to add farm')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleRenameFarm = async (farm: FarmInfo, newNameVal: string) => {
    if (!newNameVal.trim() || newNameVal.trim().length < 2) {
      toast.error('Farm name must be at least 2 characters')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/farms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: farm.id, name: newNameVal.trim() }),
      })
      if (res.ok) {
        toast.success('Farm renamed successfully')
        setEditFarm(null)
        fetchFarms()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to rename farm')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFarm = async (farmId: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/farms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: farmId, action: 'delete' }),
      })
      if (res.ok) {
        toast.success('Farm removed. All existing records for this farm are preserved.')
        setDeleteConfirm(null)
        fetchFarms()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to remove farm')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-600" />
              Farm Locations
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Add, rename, or remove individual farm locations. Removing a farm hides it from dropdowns but keeps all records.
            </CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Farm
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Farm Location</DialogTitle>
                <DialogDescription>Create a new farm site in the system.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Farm Name *</Label>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sunyani Farm" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Location / Region *</Label>
                    <Input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Sunyani, Bono Region" className="h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Street address (optional)" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+233 ..." className="h-9 text-sm" />
                </div>
                <Button onClick={handleAddFarm} disabled={saving} className="w-full h-9">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                  {saving ? 'Adding...' : 'Add Farm Location'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
          <p className="text-[11px] text-green-800">
            <Building2 className="h-3 w-3 inline mr-1" />
            You currently have {farms.filter(f => f.isActive).length} active farm location{farms.filter(f => f.isActive).length !== 1 ? 's' : ''}.
            Add more sites as your operation grows.
          </p>
        </div>
        <div className="space-y-2">
          {loading && !farms.length ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading farms...</p>
          ) : farms.filter(f => f.isActive).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No active farms. Add one above.</p>
          ) : (
            farms.filter(f => f.isActive).map(farm => (
              <div key={farm.id} className="border rounded-lg p-3">
                {editFarm?.id === farm.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editFarm.name}
                      onChange={e => setEditFarm({ ...editFarm, name: e.target.value })}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleRenameFarm(farm, editFarm.name)}
                        disabled={saving || !editFarm.name.trim()} className="h-7 text-xs gap-1">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditFarm(null)} className="h-7 text-xs">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{farm.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" /> {farm.location}
                        </span>
                        {farm.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {farm.phone}
                          </span>
                        )}
                      </div>
                      {farm.address && (
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {farm.address}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1"
                        onClick={() => setEditFarm(farm)}>
                        <Pencil className="h-3 w-3" /> Rename
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-red-500 hover:text-red-700"
                        onClick={() => setDeleteConfirm(farm.id)}>
                        <Trash2 className="h-3 w-3" /> Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Inactive farms */}
        {farms.filter(f => !f.isActive).length > 0 && (
          <div className="mt-3">
            <Separator className="mb-2" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Removed Farms (data preserved)</p>
            <div className="space-y-1">
              {farms.filter(f => !f.isActive).map(farm => (
                <div key={farm.id} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-xs">
                  <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center">
                    <Building2 className="h-3 w-3 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-500">{farm.name}</p>
                    <p className="text-[10px] text-gray-400">{farm.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Remove Farm Location</DialogTitle>
              <DialogDescription className="text-sm">
                Are you sure you want to remove this farm? It will be hidden from all dropdowns and dashboards.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              All existing records (egg collections, sales, feed records, etc.) for this farm will be preserved in the database. The farm just won&apos;t appear in menus.
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="destructive" className="flex-1 h-9" onClick={() => handleDeleteFarm(deleteConfirm)} disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                {saving ? 'Removing...' : 'Remove Farm'}
              </Button>
              <Button variant="outline" className="h-9" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

// ============ FULL DATA RESET ============
function FullDataReset() {
  const { currentUser } = useAppStore()
  const [confirmStep, setConfirmStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleFullReset = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentUser?.role, action: 'fullReset', confirm: true }),
      })
      if (res.ok) {
        const result = await res.json()
        toast.success('All data has been wiped. The system is ready for a fresh start.')
        setConfirmStep(0)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to reset data')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-red-700">
          <RotateCcw className="h-4 w-4" />
          Full Data Reset
        </CardTitle>
        <CardDescription className="text-xs">
          Delete all records and start with a clean slate. This is irreversible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-red-800">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            <strong>Warning:</strong> This will permanently delete ALL data from the system, including:
          </p>
          <ul className="text-[11px] text-red-700 mt-1 ml-4 list-disc">
            <li>All egg collections, sales, and feed records</li>
            <li>All bird flocks and mortality records</li>
            <li>All expenses, treatments, and health checks</li>
            <li>All vaccination records</li>
            <li>All announcements and customers</li>
            <li>All farm locations</li>
            <li>All pending amendment requests</li>
          </ul>
          <p className="text-[11px] text-red-700 mt-1">
            Your CEO account will remain but all other staff will be deactivated. You will need to re-add farms and staff.
          </p>
        </div>

        {confirmStep === 0 ? (
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1"
            onClick={() => setConfirmStep(1)}>
            <Trash2 className="h-3 w-3" /> Start Full Reset
          </Button>
        ) : confirmStep === 1 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-700">Type &quot;RESET&quot; to confirm:</p>
            <Input
              placeholder='Type "RESET" here'
              className="h-9 text-sm border-red-300"
              onChange={e => { if (e.target.value === 'RESET') setConfirmStep(2) }}
            />
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setConfirmStep(0)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-700 font-medium">You are about to wipe ALL data. This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleFullReset} disabled={saving} className="h-8 text-xs gap-1">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
                {saving ? 'Resetting...' : 'Confirm: Delete Everything'}
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setConfirmStep(0)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ MAIN SETTINGS COMPONENT ============
export function CEOSettingsPanel() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-amber-600" />
          Farm Settings
        </h2>
        <p className="text-xs text-gray-500">Manage your farm name, locations, and data.</p>
      </div>

      <FarmNameEditor />
      <FarmLocationsManager />
      <FullDataReset />
    </div>
  )
}
