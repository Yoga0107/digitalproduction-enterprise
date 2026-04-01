"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { useState, useMemo } from "react"

import { BarChart2 } from "lucide-react"
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

import { saveAs } from "file-saver"
import ExcelJS from "exceljs"

import { availabilityData, AvailabilityRow } from "./data"
import AvailabilityRateTable from "@/components/oee/availability-rate-table"


export default function AvailabilityRatePage() {

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [month, setMonth] = useState("")

  const [exportOpen, setExportOpen] = useState(false)
  const [exportStart, setExportStart] = useState("")
  const [exportEnd, setExportEnd] = useState("")

  const data: AvailabilityRow[] = availabilityData

  const filteredData = useMemo(() => {
    let result = data
    if (month) result = result.filter(row => row.date.startsWith(month))
    if (fromDate) result = result.filter(row => row.date >= fromDate)
    if (toDate) result = result.filter(row => row.date <= toDate)
    return result
  }, [fromDate, toDate, month, data])

  async function exportExcel() {
    if (!exportStart || !exportEnd) {
      alert("Please select start date and end date")
      return
    }

    const filtered = data.filter(d => {
      if (exportStart && d.date < exportStart) return false
      if (exportEnd && d.date > exportEnd) return false
      return true
    })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Availability Rate")

    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Line 1", key: "line1", width: 12 },
      { header: "Line 2", key: "line2", width: 12 },
      { header: "Line 3A", key: "line3A", width: 12 },
      { header: "Line 3B", key: "line3B", width: 12 },
      { header: "Line 3A & 3B", key: "line3AB", width: 14 },
      { header: "Line 4", key: "line4", width: 12 },
      { header: "Line 5", key: "line5", width: 12 },
      { header: "Line 6A", key: "line6A", width: 12 },
      { header: "Line 6B", key: "line6B", width: 12 },
      { header: "Line 6A & 6B", key: "line6AB", width: 14 },
      { header: "All Line", key: "allLine", width: 14 }
    ]

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } }
      cell.alignment = { horizontal: "center", vertical: "middle" }
    })

    filtered.forEach(r => {
      const row = sheet.addRow({
        date: new Date(r.date).toLocaleDateString("id-ID"),
        line1: r.line1,
        line2: r.line2,
        line3A: r.line3A,
        line3B: r.line3B,
        line3AB: r.line3AB,
        line4: r.line4,
        line5: r.line5,
        line6A: r.line6A,
        line6B: r.line6B,
        line6AB: r.line6AB,
        allLine: r.allLine
      })
      row.eachCell(cell => { cell.alignment = { horizontal: "center" } })
    })

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      row.eachCell((cell, colNumber) => {
        if (colNumber === 1) return
        const v = cell.value as number
        if (v === null || v === undefined) return
        if (v >= 90) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } }
        } else if (v >= 75) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEB9C" } }
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } }
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), "availability-rate.xlsx")
    setExportOpen(false)
  }

  return (
    <OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-700 via-teal-600 to-emerald-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <BarChart2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Availability Rate</h1>
              <p className="text-white/70 text-sm mt-1">Persentase ketersediaan mesin</p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
            <CardHeader className="bg-emerald-50/60">
              <CardTitle className="text-emerald-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">From Date</p>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">To Date</p>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Monthly</p>
                <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={() => setExportOpen(true)}>Export Excel</Button>
              </div>
            </CardContent>
          </Card>

          <AvailabilityRateTable data={filteredData} />

          <Dialog open={exportOpen} onOpenChange={setExportOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Availability Rate</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Start Date</p>
                  <Input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">End Date</p>
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
