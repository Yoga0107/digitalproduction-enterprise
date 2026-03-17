"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { useState, useMemo } from "react"

import { Timer } from "lucide-react"
import { BarChart2 } from "lucide-react"
import { TrendingUp } from "lucide-react"
import { LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

import { LoadingTimeTable } from "@/components/oee/loading-time-table"
import { LoadingRow } from "@/types/loading-types"

import { saveAs } from "file-saver"
import ExcelJS from "exceljs"

export default function LoadingTimePage() {

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [month, setMonth] = useState("")

  const [exportOpen, setExportOpen] = useState(false)
  const [exportStart, setExportStart] = useState("")
  const [exportEnd, setExportEnd] = useState("")

  const data: LoadingRow[] = [
    { date:"2026-02-01", line:"Line 1 (Extruder CPM)", shift:"Shift 3", loadingTime:8.00 },
    { date:"2026-02-01", line:"Line 1 (Extruder CPM)", shift:"Shift 1", loadingTime:8.00 },
    { date:"2026-02-01", line:"Line 1 (Extruder CPM)", shift:"Shift 2", loadingTime:8.00 },
    { date:"2026-02-01", line:"Line 2 (Extruder 30)", shift:"Shift 3", loadingTime:8.00 },
    { date:"2026-02-01", line:"Line 2 (Extruder 30)", shift:"Shift 1", loadingTime:8.00 },
    { date:"2026-02-01", line:"Line 2 (Extruder 30)", shift:"Shift 2", loadingTime:8.00 },
    { date:"2026-02-01", line:"Line 3A (IDAH 35A)", shift:"Shift 3", loadingTime:8.00 },
    { date:"2026-02-01", line:"Line 3A (IDAH 35A)", shift:"Shift 1", loadingTime:8.00 },
    { date:"2026-02-01", line:"Line 3A (IDAH 35A)", shift:"Shift 2", loadingTime:8.00 },
    { date:"2026-02-01", line:"Line 3B (IDAH 35B)", shift:"Shift 3", loadingTime:0.00 },
    { date:"2026-02-01", line:"Line 3B (IDAH 35B)", shift:"Shift 1", loadingTime:0.00 },
  ]

  const filteredData = useMemo(() => {
    let result = data
    if (month) result = result.filter(r => r.date.startsWith(month))
    if (fromDate) result = result.filter(r => r.date >= fromDate)
    if (toDate) result = result.filter(r => r.date <= toDate)
    return result
  }, [data, fromDate, toDate, month])

  async function exportExcel() {
    if (!exportStart || !exportEnd) {
      alert("Please select start date and end date")
      return
    }

    const filtered = data.filter(d => d.date >= exportStart && d.date <= exportEnd)

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Loading Time")

    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Line", key: "line", width: 25 },
      { header: "Shift", key: "shift", width: 15 },
      { header: "Loading Time", key: "loadingTime", width: 15 },
    ]

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold:true, color:{ argb:"FFFFFFFF" } }
      cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF1F4E78" } }
      cell.alignment = { horizontal:"center", vertical:"middle" }
    })

    filtered.forEach(r => {
      const row = sheet.addRow({
        date: new Date(r.date).toLocaleDateString("id-ID"),
        line: r.line,
        shift: r.shift,
        loadingTime: r.loadingTime,
      })
      row.eachCell(cell => { cell.alignment = { horizontal:"center" } })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), "loading-time.xlsx")
    setExportOpen(false)
  }

  

<OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Loading Time</h1>
              <p className="text-white/70 text-sm mt-1">Waktu pemuatan mesin per shift</p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">
      

      <Card>
        <CardHeader><CardTitle className="text-emerald-900 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"/>Filter</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-6">

          <div className="flex flex-col">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">From Date</p>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">To Date</p>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Monthly</p>
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>

          <Button onClick={() => setExportOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm gap-2">📊 Export Excel</Button>

        </CardContent>
      </Card>

      <LoadingTimeTable data={filteredData} />

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Export Loading Time</DialogTitle></DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Start Date</p>
              <Input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} />
            </div>

            <div className="flex flex-col">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">End Date</p>
              <Input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={exportExcel}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        </div>
      </div>
    </OeeGuard>
  )
}