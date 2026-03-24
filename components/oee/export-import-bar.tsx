'use client'

/**
 * ExportImportBar
 * ──────────────
 * Reusable toolbar for Export/Import Excel operations.
 * - Export: admin, manager (plant_manager), operator (user)
 * - Import: admin, manager (plant_manager) only
 */

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  Download, Upload, FileSpreadsheet, CheckCircle2,
  AlertTriangle, Loader2, X, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/role-map'

interface ImportError { row: number; errors: string[] }

interface ExportImportBarProps {
  /** Current user role */
  role: UserRole
  /** Called when user clicks Export — parent should trigger download */
  onExport: () => Promise<void>
  /** Called when user selects a file for import — parent handles the API call */
  onImport: (file: File) => Promise<{ imported: number; errors: ImportError[]; message: string }>
  /** Label shown in buttons, e.g. "Production Output" */
  label: string
  /** Whether an export/download is in progress */
  exportLoading?: boolean
  className?: string
}

const CAN_EXPORT: UserRole[] = ['admin', 'manager', 'user']
const CAN_IMPORT: UserRole[] = ['admin', 'manager']

export function ExportImportBar({
  role, onExport, onImport, label, exportLoading, className,
}: ExportImportBarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    imported: number; errors: ImportError[]; message: string
  } | null>(null)
  const [showResult, setShowResult] = useState(false)

  const canExport = CAN_EXPORT.includes(role)
  const canImport = CAN_IMPORT.includes(role)

  async function handleExport() {
    try { await onExport() }
    catch { toast.error('Export gagal. Coba lagi.') }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.xlsx')) {
      toast.error('File harus berformat .xlsx')
      e.target.value = ''
      return
    }
    setImporting(true)
    try {
      const res = await onImport(file)
      setResult(res)
      setShowResult(true)
      if (res.imported > 0) toast.success(`${res.imported} baris berhasil diimport`)
      if (res.errors.length > 0) toast.warning(`${res.errors.length} baris gagal — lihat detail`)
    } catch (err: any) {
      toast.error(err.message || 'Import gagal')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {canExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportLoading}
            className="h-8 gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors"
          >
            {exportLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
            Export Excel
          </Button>
        )}

        {canImport && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="h-8 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
            >
              {importing
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Upload className="h-3.5 w-3.5" />}
              Import Excel
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}

        {!canExport && !canImport && (
          <span className="text-xs text-muted-foreground italic flex items-center gap-1">
            <Info className="h-3 w-3" />
            Export/Import tidak tersedia untuk role Anda
          </span>
        )}
      </div>

      {/* Import Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Hasil Import — {label}
            </DialogTitle>
          </DialogHeader>

          {result && (
            <div className="space-y-4 py-1">
              {/* Summary chips */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">{result.imported} berhasil</span>
                </div>
                {result.errors.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-600">{result.errors.length} gagal</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {result.imported + result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sukses rate</span>
                    <span>{Math.round(result.imported / (result.imported + result.errors.length) * 100)}%</span>
                  </div>
                  <Progress
                    value={result.imported / (result.imported + result.errors.length) * 100}
                    className="h-2"
                  />
                </div>
              )}

              {/* Error list */}
              {result.errors.length > 0 && (
                <div className="rounded-xl border border-red-100 overflow-hidden">
                  <div className="bg-red-50 px-4 py-2.5 border-b border-red-100">
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-widest">
                      Detail Error ({result.errors.length} baris)
                    </span>
                  </div>
                  <div className="divide-y max-h-56 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <div key={i} className="px-4 py-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">
                            Baris {e.row}
                          </Badge>
                        </div>
                        <ul className="space-y-0.5">
                          {e.errors.map((msg, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                              <X className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setShowResult(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
