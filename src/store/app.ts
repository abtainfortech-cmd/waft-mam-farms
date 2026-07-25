import { create } from 'zustand'

export type Role = 'CEO' | 'SALES' | 'FARM_HAND' | 'ACCOUNTANT' | 'VET'

export interface StaffUser {
  id: string
  name: string
  role: Role
  username: string
  phone?: string
  farmId?: string
  email?: string
  isActive: boolean
}

interface AppState {
  currentRole: Role | null
  currentUser: StaffUser | null
  isLoggedIn: boolean
  selectedFarmId: string | null
  sidebarOpen: boolean
  viewRole: Role | null // CEO can preview other role dashboards
  setRole: (role: Role | null) => void
  setUser: (user: StaffUser | null) => void
  login: (user: StaffUser) => void
  logout: () => void
  setFarm: (farmId: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setViewRole: (role: Role | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: null,
  currentUser: null,
  isLoggedIn: false,
  selectedFarmId: null,
  sidebarOpen: true,
  viewRole: null,
  setRole: (role) => set({ currentRole: role }),
  setUser: (user) => set({ currentUser: user }),
  login: (user) => set({ isLoggedIn: true, currentUser: user, currentRole: user.role, viewRole: user.role }),
  logout: () => set({ isLoggedIn: false, currentUser: null, currentRole: null, selectedFarmId: null, viewRole: null }),
  setFarm: (farmId) => set({ selectedFarmId: farmId }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setViewRole: (role) => set({ viewRole: role }),
}))
