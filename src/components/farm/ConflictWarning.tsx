'use client'

import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConflictInfo {
  modifiedBy: string
  modifiedAt: string
  message: string
  currentData?: any
}

interface ConflictWarningProps {
  conflict: ConflictInfo | null
  onDismiss: () => void
  onReload: () => void
  /** Optional: show a "Force Save" button for CEO override */
  canForce?: boolean
  onForceSave?: () => void
}

export function ConflictWarning({ conflict, onDismiss, onReload, canForce = false, onForceSave }: ConflictWarningProps) {
  if (!conflict) return null

  const timeStr = new Date(conflict.modifiedAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 md:p-4 space-y-2">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">Data Conflict Detected</p>
          <p className="text-xs text-amber-700 mt-1">{conflict.message}</p>
          <p className="text-[10px] text-amber-600 mt-1">
            Modified by <strong>{conflict.modifiedBy}</strong> at {timeStr}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onDismiss}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-2 ml-8">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onReload}>
          <RefreshCw className="h-3 w-3" /> Reload Latest
        </Button>
        {canForce && onForceSave && (
          <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={onForceSave}>
            Force Save (Override)
          </Button>
        )}
      </div>
    </div>
  )
}
