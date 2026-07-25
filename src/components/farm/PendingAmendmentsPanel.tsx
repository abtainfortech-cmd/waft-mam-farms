'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Clock, Pencil, RefreshCw, FileEdit } from 'lucide-react'

interface PendingAmendment {
  id: string
  recordType: string
  recordId: string
  field: string
  oldValue: string
  newValue: string
  reason: string | null
  requestedBy: string
  requestedAt: string
  status: string
  reviewedBy: string | null
  reviewedAt: string | null
}

export function PendingAmendmentsPanel() {
  const { currentUser } = useAppStore()
  const [amendments, setAmendments] = useState<PendingAmendment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAmendments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/amendments?status=Pending')
      if (res.ok) setAmendments(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAmendments() }, [fetchAmendments])

  const handleReview = async (id: string, status: 'Approved' | 'Rejected') => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/amendments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          reviewedBy: currentUser?.username || currentUser?.name || 'CEO',
        }),
      })

      if (res.ok) {
        toast.success(`Amendment ${status.toLowerCase()}`)
        fetchAmendments()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || `Failed to ${status.toLowerCase()} amendment`)
      }
    } catch {
      toast.error('Network error')
    } finally {
      setActionLoading(null)
    }
  }

  const formatRecordType = (type: string) => {
    const labels: Record<string, string> = {
      DailyEggCollection: 'Egg Collection',
      BirdMortality: 'Mortality',
      FeedRecord: 'Feed Record',
      EggSale: 'Egg Sale',
      BirdSale: 'Bird Sale',
      Expense: 'Expense',
      Vaccination: 'Vaccination',
      Treatment: 'Treatment',
      HealthCheck: 'Health Check',
    }
    return labels[type] || type
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-amber-600" />
            Pending Amendments
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Review and approve or reject record amendment requests from staff
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {amendments.length} pending
          </Badge>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={fetchAmendments}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>

      {/* Amendments List */}
      {amendments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">All Caught Up!</p>
            <p className="text-xs text-gray-400 mt-1">No pending amendments to review</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {amendments.map((a) => (
              <Card key={a.id} className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Pencil className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {formatRecordType(a.recordType)}
                        </Badge>
                        <span className="text-[10px] text-gray-500">
                          Field: <strong>{a.field}</strong>
                        </span>
                      </div>

                      {/* Values comparison */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="p-2 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-[10px] text-red-500 font-medium">Old Value</p>
                          <p className="text-sm font-medium text-red-700 break-all">{a.oldValue}</p>
                        </div>
                        <div className="p-2 bg-green-50 border border-green-100 rounded-lg">
                          <p className="text-[10px] text-green-500 font-medium">Proposed Value</p>
                          <p className="text-sm font-medium text-green-700 break-all">{a.newValue}</p>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-2 flex-wrap">
                        <span>Requested by: <strong>{a.requestedBy}</strong></span>
                        <span>·</span>
                        <span>{formatDate(a.requestedAt)}</span>
                        {a.reason && (
                          <>
                            <span>·</span>
                            <span className="text-amber-700">Reason: &quot;{a.reason}&quot;</span>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleReview(a.id, 'Approved')}
                          disabled={actionLoading === a.id}
                        >
                          {actionLoading === a.id ? (
                            <Clock className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleReview(a.id, 'Rejected')}
                          disabled={actionLoading === a.id}
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
