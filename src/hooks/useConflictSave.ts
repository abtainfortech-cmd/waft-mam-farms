'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface ConflictInfo {
  modifiedBy: string
  modifiedAt: string
  message: string
}

interface UseConflictSaveOptions {
  /** The API endpoint to POST/PUT to */
  endpoint: string
  /** Callback after successful save (no conflict) */
  onSuccess?: () => void
  /** Callback when conflict detected, receives the conflict info */
  onConflict?: (conflict: ConflictInfo) => void
  /** Show toast notifications */
  showToast?: boolean
}

/**
 * useConflictSave — wraps form submissions with conflict detection.
 * On 409 response, shows a conflict warning and triggers the onConflict callback
 * so the parent component can decide how to handle it (show diff, force reload, etc.)
 */
export function useConflictSave(options: UseConflictSaveOptions) {
  const { endpoint, onSuccess, onConflict, showToast = true } = options
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState<ConflictInfo | null>(null)

  const save = useCallback(async (data: any, method: 'POST' | 'PUT' = 'POST') => {
    setSaving(true)
    setConflict(null)

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (res.ok) {
        setConflict(null)
        if (showToast) toast.success('Saved successfully!')
        onSuccess?.()
        return { ok: true, data: result }
      }

      if (res.status === 409 && result.error === 'CONFLICT') {
        setConflict({
          modifiedBy: result.modifiedBy,
          modifiedAt: result.modifiedAt,
          message: result.message,
        })
        if (showToast) toast.error(result.message, { duration: 6000 })
        onConflict?.({
          modifiedBy: result.modifiedBy,
          modifiedAt: result.modifiedAt,
          message: result.message,
        })
        return { ok: false, conflict: result }
      }

      if (showToast) toast.error(result.error || 'Save failed')
      return { ok: false, error: result }
    } catch {
      if (showToast) toast.error('Network error. Please try again.')
      return { ok: false, error: { error: 'Network error' } }
    } finally {
      setSaving(false)
    }
  }, [endpoint, onSuccess, onConflict, showToast])

  const dismissConflict = useCallback(() => setConflict(null), [])

  return { save, saving, conflict, dismissConflict }
}
