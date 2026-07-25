'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/store/app'
import { toast } from 'sonner'
import { Pencil, Loader2 } from 'lucide-react'

export interface AmendmentField {
  key: string
  label: string
  type: 'number' | 'text' | 'date'
  value: string | number
}

interface AmendmentRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordType: string
  recordId: string
  fields: AmendmentField[]
}

export function AmendmentRequestDialog({
  open,
  onOpenChange,
  recordType,
  recordId,
  fields,
}: AmendmentRequestDialogProps) {
  const { currentUser } = useAppStore()
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedField, setSelectedField] = useState<string | null>(null)

  // Reset when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setEditedValues({})
      setReason('')
      setSelectedField(null)
    }
    onOpenChange(newOpen)
  }

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!selectedField) {
      toast.error('Please select a field to amend')
      return
    }

    const originalField = fields.find(f => f.key === selectedField)
    if (!originalField) return

    const oldValue = String(originalField.value)
    const newValue = editedValues[selectedField]

    if (newValue === oldValue || newValue === undefined) {
      toast.error('No change detected in the selected field')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/amendments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType,
          recordId,
          field: selectedField,
          oldValue,
          newValue,
          reason: reason || null,
          requestedBy: currentUser?.username || currentUser?.name || 'Unknown',
        }),
      })

      if (res.ok) {
        toast.success('Amendment submitted for CEO approval')
        handleOpenChange(false)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to submit amendment')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4" />
            Request Amendment
          </DialogTitle>
          <DialogDescription>
            Select a field to modify. Changes require CEO approval before being applied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Field selection */}
          <div>
            <Label className="text-xs">Field to Amend *</Label>
            <div className="space-y-1 mt-1">
              {fields.map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={`w-full text-left p-2 rounded-lg border text-sm transition-colors ${
                    selectedField === f.key
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedField(f.key)}
                >
                  <span className="font-medium text-xs">{f.label}</span>
                  <p className="text-xs text-gray-500">Current: {String(f.value)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Edit value for selected field */}
          {selectedField && (
            <div>
              <Label className="text-xs">New Value *</Label>
              <Input
                type={fields.find(f => f.key === selectedField)?.type || 'text'}
                value={editedValues[selectedField] ?? String(fields.find(f => f.key === selectedField)?.value ?? '')}
                onChange={e => handleValueChange(selectedField, e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <Label className="text-xs">Reason for Amendment</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why this change is needed..."
              className="text-sm min-h-[60px] mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting || !selectedField} className="flex-1 h-9">
              {submitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Pencil className="h-3 w-3 mr-1" />
              )}
              Submit Amendment
            </Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)} className="h-9">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
