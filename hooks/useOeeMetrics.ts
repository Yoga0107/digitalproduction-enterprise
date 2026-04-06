/**
 * hooks/useOeeMetrics.ts
 * ───────────────────────
 * Shared hook untuk Loading Time, Operating Time, Availability Rate.
 * Satu fetch, tiga halaman pakai.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { getTimeMetrics } from "@/services/oeeService"
import { getLines } from "@/services/masterService"
import { OeeRow } from "@/types/oee-types"
import { ApiLine } from "@/types/api"

function defaultRange() {
  const now  = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fmt  = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

export function useOeeMetrics() {
  const range = defaultRange()

  const [dateFrom,   setDateFrom]   = useState(range.from)
  const [dateTo,     setDateTo]     = useState(range.to)
  const [groupBy,    setGroupBy]    = useState<"daily" | "monthly">("daily")
  const [showDetail, setShowDetail] = useState(false)

  const [rows,    setRows]    = useState<OeeRow[]>([])
  const [lines,   setLines]   = useState<ApiLine[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Fetch lines sekali
  useEffect(() => {
    getLines()
      .then(setLines)
      .catch(() => setError("Gagal memuat data line."))
  }, [])

  const fetchData = useCallback(async () => {
    if (!dateFrom || !dateTo) return
    setLoading(true)
    setError(null)
    try {
      const res = await getTimeMetrics({ date_from: dateFrom, date_to: dateTo, group_by: groupBy })
      setRows(res.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, groupBy])

  useEffect(() => { fetchData() }, [fetchData])

  return {
    // state
    dateFrom, setDateFrom,
    dateTo,   setDateTo,
    groupBy,  setGroupBy,
    showDetail, setShowDetail,
    // data
    rows, lines, loading, error,
    // actions
    fetchData,
  }
}
