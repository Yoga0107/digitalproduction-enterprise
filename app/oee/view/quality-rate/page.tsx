"use client"

import { useState, useMemo } from "react"

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

import { QualityRateTable } from "@/components/oee/quality-rate-table"
import { QualityRow } from "@/types/quality-types"

import { saveAs } from "file-saver"
import ExcelJS from "exceljs"

export default function QualityRatePage() {

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [month, setMonth] = useState("")

  const [exportOpen, setExportOpen] = useState(false)
  const [exportStart, setExportStart] = useState("")
  const [exportEnd, setExportEnd] = useState("")

  const data: QualityRow[] = [
    { date: "2026-03-01", line1: 94.22, line2: 96.71, line3: 77.78, line4: 90.17, line5: 97.68, line6: 93.30, allLine: 94.29 },
    { date: "2026-03-02", line1: 96.36, line2: 85.97, line3: 52.77, line4: 76.77, line5: 93.44, line6: 90.97, allLine: 88.96 },
    { date: "2026-03-03", line1: 92.34, line2: 87.40, line3: 73.75, line4: 88.88, line5: 96.65, line6: 94.71, allLine: 91.59 },
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
    const sheet = workbook.addWorksheet("Quality Rate")

    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Line 1", key: "line1", width: 12 },
      { header: "Line 2", key: "line2", width: 12 },
      { header: "Line 3A & 3B", key: "line3", width: 14 },
      { header: "Line 4", key: "line4", width: 12 },
      { header: "Line 5", key: "line5", width: 12 },
      { header: "Line 6A & 6B", key: "line6", width: 14 },
      { header: "All Line", key: "allLine", width: 14 }
    ]

    // Header style
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
        line3: r.line3,
        line4: r.line4,
        line5: r.line5,
        line6: r.line6,
        allLine: r.allLine
      })

      row.eachCell(cell => { cell.alignment = { horizontal: "center" } })
    })

    // Conditional color
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      row.eachCell((cell, colNumber) => {
        if (colNumber === 1) return
        const v = cell.value as number
        if (!v) return
        if (v >= 100) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } }
        } else if (v >= 90) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEB9C" } }
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } }
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), "quality-rate.xlsx")
    setExportOpen(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quality Rate</h1>

      <Card>
        <CardHeader><CardTitle>Filter</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-6">

          <div className="flex flex-col">
            <p className="text-sm">From Date</p>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>

          <div className="flex flex-col">
            <p className="text-sm">To Date</p>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>

          <div className="flex flex-col">
            <p className="text-sm">Monthly</p>
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>

          <Button onClick={() => setExportOpen(true)}>Export Excel</Button>

        </CardContent>
      </Card>

      <QualityRateTable data={filteredData} />

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Export Quality Rate</DialogTitle></DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <p className="text-sm">Start Date</p>
              <Input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} />
            </div>

            <div className="flex flex-col">
              <p className="text-sm">End Date</p>
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
  )

}