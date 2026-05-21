"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { getTimeMetrics } from "@/services/oeeService"
import { getLines } from "@/services/masterService"
import { OeeRow } from "@/types/oee-types"
import { ApiLine } from "@/types/api"

// ── Config ────────────────────────────────────────────────────────────────────
const PAGE_SIZE_DAILY   = 7   // 7 hari per page
const PAGE_SIZE_MONTHLY = 3   // 3 bulan per page

function defaultRange() {
  const now  = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fmt  = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00")
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().slice(0, 10)
}

function addMonths(d: string, n: number) {
  const dt = new Date(d + "T00:00:00")
  dt.setMonth(dt.getMonth() + n)
  return dt.toISOString().slice(0, 10)
}

function minDate(a: string, b: string) { return a < b ? a : b }

/** Split full range into page chunks */
function buildPages(dateFrom: string, dateTo: string, groupBy: "daily" | "monthly"): { from: string; to: string }[] {
  const pages: { from: string; to: string }[] = []
  let cursor = dateFrom
  const step = groupBy === "monthly" ? PAGE_SIZE_MONTHLY : PAGE_SIZE_DAILY

  while (cursor <= dateTo) {
    const nextRaw = groupBy === "monthly"
      ? addMonths(cursor, step)
      : addDays(cursor, step)
    // end of page = min(nextRaw - 1day, dateTo)
    const pageEnd = groupBy === "monthly"
      ? minDate(addDays(nextRaw, -1), dateTo)
      : minDate(addDays(cursor, step - 1), dateTo)
    pages.push({ from: cursor, to: pageEnd })
    cursor = groupBy === "monthly" ? nextRaw : addDays(cursor, step)
  }
  return pages
}

export function useOeeMetrics() {
  const range = defaultRange()

  const [dateFrom,   setDateFrom]   = useState(range.from)
  const [dateTo,     setDateTo]     = useState(range.to)
  const [groupBy,    setGroupBy]    = useState<"daily" | "monthly">("daily")
  const [showDetail, setShowDetail] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageCache,   setPageCache]   = useState<Record<number, OeeRow[]>>({})
  const [pageLoading, setPageLoading] = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [lines,       setLines]       = useState<ApiLine[]>([])

  // Pre-compute all page ranges from full range
  const pages = useMemo(
    () => buildPages(dateFrom, dateTo, groupBy),
    [dateFrom, dateTo, groupBy]
  )
  const totalPages = pages.length

  // Current page rows (from cache if available)
  const rows: OeeRow[] = pageCache[currentPage] ?? []
  const loading = pageLoading

  // Fetch lines once
  useEffect(() => {
    getLines()
      .then(setLines)
      .catch(() => setError("Gagal memuat data line."))
  }, [])

  // Fetch current page
  const fetchPage = useCallback(async (pageIdx: number, invalidateCache = false) => {
    if (!pages[pageIdx]) return
    if (!invalidateCache && pageCache[pageIdx]) return  // already cached

    const { from, to } = pages[pageIdx]
    setPageLoading(true)
    setError(null)
    try {
      const res = await getTimeMetrics({ date_from: from, date_to: to, group_by: groupBy })
      setPageCache(prev => ({ ...prev, [pageIdx]: res.data }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.")
    } finally {
      setPageLoading(false)
    }
  }, [pages, pageCache, groupBy])

  // When filter changes, reset to page 0 and clear cache
  const fetchData = useCallback(() => {
    setCurrentPage(0)
    setPageCache({})
  }, [])

  // Auto-fetch when currentPage or pages change
  useEffect(() => {
    if (pages.length === 0) return
    fetchPage(currentPage)
  }, [currentPage, pages]) // eslint-disable-line

  // Pre-fetch next page in background
  useEffect(() => {
    if (currentPage + 1 < totalPages && pages[currentPage + 1]) {
      const timer = setTimeout(() => fetchPage(currentPage + 1), 400)
      return () => clearTimeout(timer)
    }
  }, [currentPage, totalPages, pages]) // eslint-disable-line

  function goToPage(p: number) {
    if (p < 0 || p >= totalPages) return
    setCurrentPage(p)
  }

  // Page label for display
  function pageLabel(idx: number) {
    const pg = pages[idx]
    if (!pg) return ""
    if (groupBy === "monthly") {
      const from = new Date(pg.from + "T00:00:00").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
      const to   = new Date(pg.to   + "T00:00:00").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
      return from === to ? from : `${from} – ${to}`
    }
    const from = new Date(pg.from + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    const to   = new Date(pg.to   + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    return pg.from === pg.to ? from : `${from} – ${to}`
  }

  return {
    // filter state
    dateFrom, setDateFrom,
    dateTo,   setDateTo,
    groupBy,  setGroupBy,
    showDetail, setShowDetail,
    // data
    rows, lines, loading, error,
    // pagination
    currentPage, totalPages, pages,
    goToPage,
    pageLabel,
    cachedPages: Object.keys(pageCache).map(Number),
    // actions
    fetchData,
  }
}
