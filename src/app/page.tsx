'use client'

import { useAppStore } from '@/store/app'
import { RoleSelection } from '@/components/farm/RoleSelection'
import { AppShell } from '@/components/farm/AppShell'
import { useEffect } from 'react'

export default function Home() {
  const currentRole = useAppStore((s) => s.currentRole)

  // Seed data on first load
  useEffect(() => {
    fetch('/api/seed', { method: 'POST' })
  }, [])

  if (!currentRole) {
    return <RoleSelection />
  }

  return <AppShell />
}
