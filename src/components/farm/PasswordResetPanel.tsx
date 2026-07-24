'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore, Role } from '@/store/app'
import { toast } from 'sonner'
import { KeyRound, UserCheck, RotateCcw, Plus, Shield, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StaffMember {
  id: string
  name: string
  role: string
  username: string
  phone?: string
  isActive: boolean
}

const roleLabels: Record<string, string> = {
  CEO: 'CEO',
  SALES: 'Sales Manager',
  FARM_HAND: 'Farm Hand',
  ACCOUNTANT: 'Accountant',
  VET: 'Vet Officer',
}

export function PasswordResetPanel() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPass, setNewPass] = useState('')

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/staff')
      if (res.ok) setStaff(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword.trim()) {
      toast.error('Please enter a new password')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetTarget.id, password: newPassword }),
      })
      if (res.ok) {
        toast.success(`Password reset for ${resetTarget.name}`)
        setResetTarget(null)
        setNewPassword('')
      } else toast.error('Failed to reset password')
    } catch { toast.error('Network error') }
    finally { setLoading(false) }
  }

  const handleAddStaff = async () => {
    if (!newName.trim() || !newRole || !newUsername.trim() || !newPass.trim()) {
      toast.error('All fields are required')
      return
    }
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, role: newRole, username: newUsername, password: newPass }),
    })
    if (res.ok) {
      toast.success('New staff account created!')
      setAddOpen(false); setNewName(''); setNewRole(''); setNewUsername(''); setNewPass('')
      fetchStaff()
    } else toast.error('Failed to create staff (username may already exist)')
  }

  const handleDeactivate = async (id: string, name: string) => {
    const res = await fetch('/api/staff', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success(`${name} has been deactivated`); fetchStaff() }
    else toast.error('Failed to deactivate')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-600" />
              Access Control & Password Management
            </CardTitle>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Create Staff Account</DialogTitle>
                  <DialogDescription>Add a new staff member with login credentials.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-xs">Full Name *</Label>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Staff name" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Role *</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Username *</Label>
                    <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Login username" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Password *</Label>
                    <Input type="text" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Initial password" className="h-9 text-sm" />
                  </div>
                  <Button onClick={handleAddStaff} className="w-full h-9">
                    <UserCheck className="h-3 w-3 mr-1" /> Create Account
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
            <p className="text-[11px] text-amber-800">
              <Shield className="h-3 w-3 inline mr-1" />
              As CEO, you can reset any staff member&apos;s password. This does not affect any farm data.
            </p>
          </div>
          <ScrollArea className="max-h-72">
            <div className="space-y-2">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    s.role === 'CEO' ? 'bg-amber-500' :
                    s.role === 'SALES' ? 'bg-green-500' :
                    s.role === 'FARM_HAND' ? 'bg-orange-500' :
                    s.role === 'ACCOUNTANT' ? 'bg-blue-500' :
                    'bg-rose-500'
                  }`}>
                    {s.name.replace(/[^A-Za-z]/g, ' ').trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">{s.name}</p>
                    <p className="text-[10px] text-gray-500">@{s.username} · {roleLabels[s.role] || s.role}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={s.isActive ? 'default' : 'secondary'} className="text-[10px]">
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Dialog open={resetTarget?.id === s.id} onOpenChange={(open) => !open && setResetTarget(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] px-2 gap-1"
                          onClick={() => setResetTarget(s)}
                          disabled={!s.isActive}
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Reset Password</DialogTitle>
                          <DialogDescription>
                            Set a new password for <strong>{s.name}</strong> (@{s.username})
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 mt-2">
                          <div>
                            <Label className="text-xs">New Password *</Label>
                            <Input
                              type="text"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleResetPassword} disabled={loading} className="flex-1 h-9">
                              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3 mr-1" />}
                              {loading ? 'Updating...' : 'Reset Password'}
                            </Button>
                            <Button variant="outline" onClick={() => { setResetTarget(null); setNewPassword('') }} className="h-9">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {s.isActive && s.role !== 'CEO' && (
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 text-red-500 hover:text-red-700"
                        onClick={() => handleDeactivate(s.id, s.name)}>
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
