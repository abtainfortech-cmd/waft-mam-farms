'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseAutoRefreshOptions {
  /** API endpoint(s) to poll. If array, all are fetched in parallel. */
  endpoints: string | string[]
  /** Polling interval in milliseconds. Default: 15000 (15 seconds) */
  interval?: number
  /** Whether auto-refresh is enabled. Default: true */
  enabled?: boolean
  /** Callback with fetched data */
  onData?: (data: any) => void
  /** Callback on each successful refresh cycle */
  onRefresh?: () => void
  /** Query parameters to append */
  queryParams?: Record<string, string>
}

interface SyncState {
  isSyncing: boolean
  lastSync: Date | null
  syncCount: number
}

/**
 * useAutoRefresh — polls API endpoints at a regular interval so all
 * connected users see changes made by other users in near-real-time.
 *
 * Returns the sync state and manual trigger functions.
 */
export function useAutoRefresh(options: UseAutoRefreshOptions) {
  const {
    endpoints,
    interval = 15000,
    enabled = true,
    onData,
    onRefresh,
    queryParams = {},
  } = options

  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSync: null,
    syncCount: 0,
  })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const buildUrl = useCallback((endpoint: string) => {
    const params = new URLSearchParams(queryParams)
    const qs = params.toString()
    return qs ? `${endpoint}?${qs}` : endpoint
  }, [queryParams])

  const doRefresh = useCallback(async () => {
    if (!mountedRef.current) return
    setSyncState(prev => ({ ...prev, isSyncing: true }))

    try {
      const urls = Array.isArray(endpoints) ? endpoints : [endpoints]
      const results = await Promise.all(
        urls.map(url =>
          fetch(buildUrl(url))
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        )
      )

      if (mountedRef.current) {
        // If single endpoint, return data directly; if multiple, return as array
        const data = results.length === 1 ? results[0] : results
        onData?.(data)
        setSyncState(prev => ({
          ...prev,
          isSyncing: false,
          lastSync: new Date(),
          syncCount: prev.syncCount + 1,
        }))
        onRefresh?.()
      }
    } catch {
      if (mountedRef.current) {
        setSyncState(prev => ({ ...prev, isSyncing: false }))
      }
    }
  }, [endpoints, buildUrl, onData, onRefresh])

  // Auto-refresh timer
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    mountedRef.current = true

    // Initial fetch
    doRefresh()

    // Set up polling
    timerRef.current = setInterval(doRefresh, interval)

    return () => {
      mountedRef.current = false
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, interval, doRefresh])

  return {
    ...syncState,
    refresh: doRefresh, // manual refresh trigger
  }
}

/**
 * Format a last-sync timestamp for display
 */
export function formatLastSync(date: Date | null): string {
  if (!date) return 'Not synced yet'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 5) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
