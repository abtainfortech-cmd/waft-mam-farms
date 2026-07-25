'use client'

import { useAutoRefresh, formatLastSync } from '@/hooks/useAutoRefresh'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LiveSyncIndicatorProps {
  /** Endpoints to poll for changes */
  endpoints: string[]
  /** Polling interval in ms (default: 15000) */
  interval?: number
  /** Whether syncing is enabled */
  enabled?: boolean
  /** Query params to append */
  queryParams?: Record<string, string>
  /** Callback when new data arrives */
  onData?: (data: any) => void
  /** Show compact version (just icon) */
  compact?: boolean
}

/**
 * LiveSyncIndicator — shows a small sync status badge and triggers
 * automatic data refresh across all connected users.
 * Changes made by any staff member are visible to everyone within seconds.
 */
export function LiveSyncIndicator({
  endpoints,
  interval = 15000,
  enabled = true,
  queryParams,
  onData,
  compact = false,
}: LiveSyncIndicatorProps) {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const { isSyncing, lastSync } = useAutoRefresh({
    endpoints,
    interval: online && enabled ? interval : 0,
    enabled: online && enabled,
    onData,
  })

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500" title="Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'never'}">
        {online ? (
          isSyncing ? (
            <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
          ) : (
            <Wifi className="h-3 w-3 text-green-500" />
          )
        ) : (
          <WifiOff className="h-3 w-3 text-red-400" />
        )}
        <span>{online ? formatLastSync(lastSync) : 'Offline'}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
        online
          ? isSyncing
            ? 'bg-blue-50 text-blue-600'
            : 'bg-green-50 text-green-600'
          : 'bg-red-50 text-red-500'
      }`}>
        {online ? (
          isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </>
          )
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </div>
      {lastSync && online && (
        <span className="text-[10px]">Updated {formatLastSync(lastSync)}</span>
      )}
    </div>
  )
}
