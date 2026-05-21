'use client'

/**
 * ============================================================
 *  ImportExportButtons — komponen reusable untuk semua halaman
 *  master data. Digunakan di:
 *    - Master Shift
 *    - Master Line
 *    - Master Kode Pakan
 *    - Master Machine Losses
 *    - Master Output Type
 *    - Master Standard Throughput
 * ============================================================
 *
 *  CARA NONAKTIFKAN:
 *  Di file halaman yang menggunakan komponen ini, cukup comment
 *  satu baris konstanta:
 *
 *    const ENABLE_IMPORT_EXPORT = true   // aktif
 *    // const ENABLE_IMPORT_EXPORT = true  // nonaktif (comment ini)
 *
 *  lalu comment juga baris <ImportExportButtons ... /> di JSX-nya.
 * ============================================================
 */

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, Upload, Loader2, FileDown } from 'lucide-react'

// ─── Tipe generik ────────────────────────────────────────────────────────────
export interface ImportExportConfig<T extends object> {
  /** Nama entitas untuk pesan toast & nama file, mis: "shift", "line" */
  entityName: string

  /** Kolom yang akan diekspor / template yang disiapkan untuk impor */
  columns: {
    key: keyof T | string
    label: string
  }[]

  /**
   * Data yang akan diekspor.
   * Terima array baris, kembalikan array objek CSV-friendly.
   */
  dataToExport: () => Record<string, unknown>[]

  /**
   * Callback yang dipanggil setelah CSV di-parse.
   * Implementasi CRUD di sini (loop createXxx).
   * Harus throw Error jika ada baris yang gagal.
   */
  onImport: (rows: Record<string, string>[]) => Promise<void>

  /** Apakah tombol dalam keadaan disabled (mis. saat loading) */
  disabled?: boolean
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','))
  }
  return lines.join('\r\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const result: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i])
    if (vals.length === 0) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (vals[idx] ?? '').trim()
    })
    result.push(row)
  }
  return result
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += line[i]
    }
  }
  result.push(current)
  return result
}

// ─── Komponen utama ──────────────────────────────────────────────────────────
export function ImportExportButtons<T extends object>({
  entityName,
  columns,
  dataToExport,
  onImport,
  disabled = false,
}: ImportExportConfig<T>) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const headers = columns.map(c => c.label)
  const keys = columns.map(c => c.key as string)

  // ── Export data saat ini ─────────────────────────────────────────────────
  function handleExport() {
    const raw = dataToExport()
    if (raw.length === 0) {
      toast.info(`Tidak ada data ${entityName} untuk diekspor`)
      return
    }
    const rows = raw.map(r =>
      Object.fromEntries(keys.map((k, i) => [headers[i], r[k] ?? '']))
    )
    const csv = toCSV(rows, headers)
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(csv, `master-${entityName}-${date}.csv`)
    toast.success(`Data ${entityName} berhasil diekspor`)
  }

  // ── Download template kosong ─────────────────────────────────────────────
  function handleTemplate() {
    const csv = headers.join(',')
    downloadCSV(csv, `template-${entityName}.csv`)
    toast.success('Template CSV berhasil diunduh')
  }

  // ── Import CSV ──────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      toast.error('Hanya file CSV yang didukung')
      return
    }

    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        toast.error('File CSV kosong atau format tidak sesuai')
        return
      }
      await onImport(rows)
      toast.success(`${rows.length} baris ${entityName} berhasil diimpor`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengimpor data'
      toast.error(msg)
    } finally {
      setImporting(false)
      // reset file input agar file yang sama bisa diupload ulang
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Template */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleTemplate}
        disabled={disabled || importing}
        title="Unduh template CSV kosong"
        className="gap-1.5"
      >
        <FileDown className="h-3.5 w-3.5" />
        Template
      </Button>

      {/* Export */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleExport}
        disabled={disabled || importing}
        title="Ekspor semua data ke CSV"
        className="gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>

      {/* Import */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || importing}
        title="Import data dari CSV"
        className="gap-1.5"
      >
        {importing
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Upload className="h-3.5 w-3.5" />}
        Import
      </Button>

      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
