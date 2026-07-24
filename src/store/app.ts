import { create } from 'zustand'

export type Role = 'CEO' | 'SALES' | 'FARM_HAND' | 'ACCOUNTANT' | 'VET'

interface AppState {
  currentRole: Role | null
  selectedFarmId: string | null
  sidebarOpen: boolean
  setRole: (role: Role) => void
  setFarm: (farmId: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: null,
  selectedFarmId: null,
  sidebarOpen: true,
  setRole: (role) => set({ currentRole: role }),
  setFarm: (farmId) => set({ selectedFarmId: farmId }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
