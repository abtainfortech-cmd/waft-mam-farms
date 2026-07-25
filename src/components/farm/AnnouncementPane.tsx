'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore, Role } from '@/store/app'
import { toast } from 'sonner'
import {
  Megaphone, Plus, X, AlertTriangle, Info, Bell, Trash2, ChevronDown, ChevronUp
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  message: string
  priority: string
  targetRoles: string
  createdBy: string
  isActive: boolean
  createdAt: string
}

function formatRelative(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-GB')
}

const priorityConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; badge: 'default' | 'secondary' | 'destructive' }> = {
  Normal: { icon: <Bell className="h-3 w-3" />, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', badge: 'secondary' },
  Important: { icon: <Info className="h-3 w-3" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', badge: 'default' },
  Urgent: { icon: <AlertTriangle className="h-3 w-3" />, color: 'text-red-600', bg: 'bg-red-50 border-red-200', badge: 'destructive' },
}

export function AnnouncementPane() {
  const { currentUser, currentRole } = useAppStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/announcements')
      .then(res => res.ok && !cancelled && res.json())
      .then(all => {
        if (!all || cancelled) return
        const filtered = all.filter((a: Announcement) => {
          if (a.targetRoles === 'ALL') return true
          return a.targetRoles.split(',').includes(currentRole || '')
        })
        if (!cancelled) setAnnouncements(filtered)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [currentRole])

  // Only show if there are announcements
  if (announcements.length === 0) return null

  // Only show top 3 if collapsed
  const displayList = expanded ? announcements : announcements.slice(0, 3)

  return (
    <Card className="border-dashed">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs font-semibold text-gray-700">Announcements</span>
          <Badge variant="secondary" className="text-[10px]">{announcements.length}</Badge>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-[10px]"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Collapse' : `Show all (${announcements.length})`}
          </Button>
        </div>
        <ScrollArea className="max-h-48">
          <div className="space-y-1.5">
            {displayList.map((a) => {
              const config = priorityConfig[a.priority] || priorityConfig.Normal
              return (
                <div key={a.id} className={`p-2 rounded-lg border ${config.bg} text-sm`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={config.color}>{config.icon}</span>
                    <Badge variant={config.badge} className="text-[10px]">{a.priority}</Badge>
                    <span className="font-medium text-xs flex-1 truncate">{a.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatRelative(a.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{a.message}</p>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// CEO-specific announcement management component
export function AnnouncementManager() {
  const { currentUser } = useAppStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [targetRoles, setTargetRoles] = useState('ALL')

  const refreshAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements')
      if (res.ok) setAnnouncements(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/announcements')
      .then(res => res.ok && !cancelled && res.json())
      .then(data => data && !cancelled && setAnnouncements(data))
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // refreshAnnouncements is used by handlers below
  void refreshAnnouncements

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, message, priority, targetRoles,
        createdBy: currentUser?.username,
      }),
    })
    if (res.ok) {
      toast.success('Announcement posted!')
      setTitle(''); setMessage(''); setPriority('Normal'); setTargetRoles('ALL')
      setOpen(false)
      refreshAnnouncements()
    } else toast.error('Failed to post')
  }

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Announcement removed'); refreshAnnouncements() }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Manage Announcements</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs gap-1">
              <Plus className="h-3 w-3" /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Post Announcement</DialogTitle>
              <DialogDescription>This will be visible to selected roles on all dashboards.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Message *</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your announcement..." className="text-sm min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Important">Important</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Visible To</Label>
                  <Select value={targetRoles} onValueChange={setTargetRoles}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="CEO">CEO Only</SelectItem>
                      <SelectItem value="SALES">Sales Only</SelectItem>
                      <SelectItem value="FARM_HAND">Farm Hands Only</SelectItem>
                      <SelectItem value="ACCOUNTANT">Accountant Only</SelectItem>
                      <SelectItem value="VET">Vet Only</SelectItem>
                      <SelectItem value="SALES,FARM_HAND">Sales + Farm Hands</SelectItem>
                      <SelectItem value="FARM_HAND,ACCOUNTANT">Farm Hands + Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handlePost} className="w-full h-9">
                <Megaphone className="h-3 w-3 mr-1" /> Post Announcement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="max-h-72">
        <div className="space-y-2">
          {announcements.map(a => {
            const config = priorityConfig[a.priority] || priorityConfig.Normal
            return (
              <div key={a.id} className={`flex items-start gap-2 p-2 rounded-lg border ${config.bg}`}>
                <span className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={config.badge} className="text-[10px]">{a.priority}</Badge>
                    <span className="text-xs font-medium truncate">{a.title}</span>
                    <span className="text-[10px] text-gray-400">{formatRelative(a.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5">{a.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    To: {a.targetRoles === 'ALL' ? 'Everyone' : a.targetRoles} · By: {a.createdBy}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-gray-400 hover:text-red-500" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
          {announcements.length === 0 && <p className="text-center text-gray-400 text-xs py-3">No announcements yet</p>}
        </div>
      </ScrollArea>
    </div>
  )
}
