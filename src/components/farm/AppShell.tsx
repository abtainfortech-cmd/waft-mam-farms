'use client'

import { useAppStore, Role } from '@/store/app'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet, SheetContent, SheetTrigger,
} from '@/components/ui/sheet'
import {
  Crown, ShoppingBasket, Egg, Calculator, Stethoscope,
  LogOut, Menu, Building2, ChevronDown, Bird, RefreshCw, Database
} from 'lucide-react'
import { CEODashboard } from '@/components/farm/CEODashboard'
import { FarmHandDashboard } from '@/components/farm/FarmHandDashboard'
import { SalesDashboard } from '@/components/farm/SalesDashboard'
import { AccountantDashboard } from '@/components/farm/AccountantDashboard'
import { VetDashboard } from '@/components/farm/VetDashboard'
import { AnnouncementPane, AnnouncementManager } from '@/components/farm/AnnouncementPane'
import { SOPSection } from '@/components/farm/SOPSection'
import { PendingAmendmentsPanel } from '@/components/farm/PendingAmendmentsPanel'
import { PasswordResetPanel } from '@/components/farm/PasswordResetPanel'
import { CEOSettingsPanel } from '@/components/farm/CEOSettingsPanel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useState } from 'react'

const roleConfig: Record<Role, { label: string; icon: React.ReactNode; color: string }> = {
  CEO: { label: 'CEO', icon: <Crown className="h-4 w-4" />, color: 'text-amber-600' },
  SALES: { label: 'Sales', icon: <ShoppingBasket className="h-4 w-4" />, color: 'text-green-600' },
  FARM_HAND: { label: 'Farm Hand', icon: <Egg className="h-4 w-4" />, color: 'text-orange-600' },
  ACCOUNTANT: { label: 'Accountant', icon: <Calculator className="h-4 w-4" />, color: 'text-blue-600' },
  VET: { label: 'Vet Officer', icon: <Stethoscope className="h-4 w-4" />, color: 'text-rose-600' },
}

function RoleSidebar() {
  const { currentRole, currentUser, logout, selectedFarmId, setFarm, sidebarOpen, setSidebarOpen, toggleSidebar, viewRole, setViewRole } = useAppStore()
  const [farms, setFarms] = useState<{ id: string; name: string; isActive: boolean }[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/farms')
      .then(res => res.ok && !cancelled && res.json())
      .then(data => data && !cancelled && setFarms(data))
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
          <Bird className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm truncate">WAFT MAM Farms</h1>
          <p className="text-[10px] text-gray-500">and Trading Hub</p>
        </div>
      </div>

      <Separator />

      {/* Current Role & User */}
      <div className="p-3">
        {currentRole && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${roleConfig[currentRole].color}`}>
              {roleConfig[currentRole].icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.name || roleConfig[currentRole].label}</p>
              <p className="text-[10px] text-gray-500">{roleConfig[currentRole].label}</p>
            </div>
          </div>
        )}
      </div>

      {/* Farm Selector */}
      <div className="px-3 pb-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Farm Location</p>
        <Select value={selectedFarmId || 'all'} onValueChange={(v) => setFarm(v === 'all' ? null : v)}>
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue placeholder="All Farms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {farms.filter(f => f.isActive).map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Quick Role Switch - CEO only can see all roles */}
      {currentRole === 'CEO' && (
        <div className="px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Switch Role</p>
          <div className="space-y-1">
            {(Object.keys(roleConfig) as Role[]).map((role) => (
              <Button
                key={role}
                variant={viewRole === role ? 'secondary' : 'ghost'}
                size="sm"
                className={`w-full justify-start h-8 text-xs gap-2 ${viewRole === role ? 'font-medium' : ''}`}
                onClick={() => { setViewRole(role); setFarm(null) }}
              >
                <span className={roleConfig[role].color}>{roleConfig[role].icon}</span>
                {roleConfig[role].label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />

      <Separator />

      {/* Logout */}
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 text-xs gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="h-3 w-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 lg:w-64 flex-col border-r bg-white h-screen sticky top-0 shrink-0">
        <ScrollArea className="flex-1">
          {sidebarContent}
        </ScrollArea>
      </aside>

      {/* Mobile: Sheet triggered by header button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <ScrollArea className="h-full">
            {sidebarContent}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function AppShell() {
  const { currentRole, currentUser, setRole, sidebarOpen, viewRole } = useAppStore()

  // Determine which view to show (CEO can preview all dashboards)
  const effectiveViewRole = viewRole || currentRole

  const renderDashboard = () => {
    switch (effectiveViewRole) {
      case 'CEO': return <CEOView />
      case 'SALES': return <SalesView />
      case 'FARM_HAND': return <FarmHandView />
      case 'ACCOUNTANT': return <AccountantView />
      case 'VET': return <VetView />
      default: return null
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <RoleSidebar />
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        {currentRole && (
          <header className="md:hidden flex items-center gap-2 p-3 border-b bg-white sticky top-0 z-10">
            <RoleSidebar />
            <div className="flex items-center gap-2">
              <Bird className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-sm">WAFT MAM</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className={`w-6 h-6 rounded flex items-center justify-center ${roleConfig[currentRole].color} bg-gray-100`}>
                {roleConfig[currentRole].icon}
              </div>
              <span className="text-xs font-medium">{currentUser?.name || roleConfig[currentRole].label}</span>
            </div>
          </header>
        )}
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Shared Database Status Banner */}
          <div className="hidden md:flex items-center gap-2 mb-3 text-[10px] text-gray-400">
            <Database className="h-3 w-3" />
            <span>Shared Database Active — All staff see live updates from every farm location</span>
          </div>
          {renderDashboard()}
        </div>
      </main>
    </div>
  )
}

// Wrapped views with Announcement pane
function CEOView() {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid grid-cols-5 w-full mb-4">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="announcements">Announcements</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="access">Access Control</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard">
        <AnnouncementPane />
        <div className="mt-4">
          <CEODashboard />
        </div>
      </TabsContent>
      <TabsContent value="pending">
        <PendingAmendmentsPanel />
      </TabsContent>
      <TabsContent value="announcements">
        <AnnouncementManager />
      </TabsContent>
      <TabsContent value="settings">
        <CEOSettingsPanel />
      </TabsContent>
      <TabsContent value="access">
        <PasswordResetPanel />
      </TabsContent>
    </Tabs>
  )
}

function SalesView() {
  return (
    <>
      <AnnouncementPane />
      <div className="mt-4">
        <SalesDashboard />
      </div>
    </>
  )
}

function FarmHandView() {
  return (
    <Tabs defaultValue="operations" className="w-full">
      <TabsList className="grid grid-cols-2 w-full mb-4">
        <TabsTrigger value="operations">Daily Operations</TabsTrigger>
        <TabsTrigger value="sop">SOP Guide</TabsTrigger>
      </TabsList>
      <TabsContent value="operations">
        <AnnouncementPane />
        <div className="mt-4">
          <FarmHandDashboard />
        </div>
      </TabsContent>
      <TabsContent value="sop">
        <SOPSection />
      </TabsContent>
    </Tabs>
  )
}

function AccountantView() {
  return (
    <>
      <AnnouncementPane />
      <div className="mt-4">
        <AccountantDashboard />
      </div>
    </>
  )
}

function VetView() {
  return (
    <>
      <AnnouncementPane />
      <div className="mt-4">
        <VetDashboard />
      </div>
    </>
  )
}
