/**
 * hooks/useEquipmentTable.ts
 * Server-side pagination hook untuk Equipment table view.
 *
 * Optimisasi:
 * - Search di-debounce 400ms — tidak fetch saat tiap keystroke
 * - Reset ke page 1 otomatis saat filter berubah
 * - AbortController — cancel request lama jika filter berubah cepat
 * - Tidak fetch ulang jika params tidak berubah
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getEquipmentPaginated, EquipmentFilterParams } from "@/services/equipmentService"
import { ApiEquipmentTree } from "@/types/equipment-types"

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const
export type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number]

interface State {
  rows:       ApiEquipmentTree[]
  total:      number
  totalPages: number
  loading:    boolean
  error:      string | null
}

export function useEquipmentTable(filters: EquipmentFilterParams) {
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(25)
  const [state,    setState]    = useState<State>({
    rows: [], total: 0, totalPages: 1, loading: false, error: null,
  })

  // Debounced search — delay fetch while user is typing
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? "")
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search ?? "")
      setPage(1)  // reset ke page 1 saat search berubah
    }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [filters.search])

  // Reset page saat filter (selain search) berubah
  const prevFilters = useRef(filters)
  useEffect(() => {
    const prev = prevFilters.current
    const changed =
      prev.is_verified  !== filters.is_verified  ||
      prev.sistem       !== filters.sistem        ||
      prev.unit_mesin   !== filters.unit_mesin
    if (changed) {
      setPage(1)
      prevFilters.current = filters
    }
  }, [filters.is_verified, filters.sistem, filters.unit_mesin])

  // AbortController untuk cancel request yang sudah stale
  const abortRef = useRef<AbortController | null>(null)

  const fetchPage = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await getEquipmentPaginated({
        ...filters,
        search:    debouncedSearch || undefined,
        page,
        page_size: pageSize,
      })
      setState({
        rows:       res.data,
        total:      res.total,
        totalPages: res.total_pages,
        loading:    false,
        error:      null,
      })
    } catch (e: unknown) {
      if ((e as Error)?.name === "AbortError") return
      setState(s => ({
        ...s, loading: false,
        error: (e instanceof Error ? e.message : "Gagal memuat data"),
      }))
    }
  }, [page, pageSize, debouncedSearch, filters.is_verified, filters.sistem, filters.unit_mesin])

  useEffect(() => { fetchPage() }, [fetchPage])

  function handlePageSize(size: PageSizeOption) {
    setPageSize(size)
    setPage(1)
  }

  return {
    ...state,
    page, setPage,
    pageSize, setPageSize: handlePageSize,
    refresh: fetchPage,
  }
}
