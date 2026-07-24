'use client'

import { useAppStore } from '@/store/app'
import { LoginScreen } from '@/components/farm/LoginScreen'
import { AppShell } from '@/components/farm/AppShell'
import { useEffect } from 'react'

export default function Home() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn)

  // Seed data on first load
  useEffect(() => {
    fetch('/api/seed', { method: 'POST' })
  }, [])

  if (!isLoggedIn) {
    return <LoginScreen />
  }

  return <AppShell />
}
