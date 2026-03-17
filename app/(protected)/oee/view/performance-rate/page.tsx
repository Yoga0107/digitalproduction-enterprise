"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
import { useState, useMemo } from "react"

import { Clock } from "lucide-react"
import { Timer } from "lucide-react"
import { BarChart2 } from "lucide-react"
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

import { PerformanceRateTable } from "@/components/oee/performance-rate-table"

import { PerformanceRow } from "@/types/performance-types"

import { saveAs } from "file-saver"
import ExcelJS from "exceljs"

export default function PerformanceRatePage() {

    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [month, setMonth] = useState("")

    const [exportOpen, setExportOpen] = useState(false)
    const [exportStart, setExportStart] = useState("")
    const [exportEnd, setExportEnd] = useState("")

    const data: PerformanceRow[] = [

        {
            date: "2026-03-01",
            line1: 99.94,
            line2: 96.40,
            line3: 100,
            line4: 87.50,
            line5: 100,
            line6: 77.30,
            allLine: 92.35
        },

        {
            date: "2026-03-02",
            line1: 100,
            line2: 86.32,
            line3: 99.32,
            line4: 100,
            line5: 99.67,
            line6: 100,
            allLine: 100
        },

        {
            date: "2026-03-03",
            line1: 100,
            line2: 100,
            line3: 100,
            line4: 100,
            line5: 87.36,
            line6: 43.40,
            allLine: 91.52
        }

    ]

    const filteredData = useMemo(() => {

        let result = data

        if (month) {
            result = result.filter(row => row.date.startsWith(month))
        }

        if (fromDate) {
            result = result.filter(row => row.date >= fromDate)
        }

        if (toDate) {
            result = result.filter(row => row.date <= toDate)
        }

        return result

    }, [data, fromDate, toDate, month])


    async function exportExcel() {

        if (!exportStart || !exportEnd) {

            alert("Please select start date and end date")

            return
        }

        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet("Performance Rate")

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

        data.forEach(r => {

            sheet.addRow({

                date: new Date(r.date).toLocaleDateString("id-ID"),

                line1: r.line1,
                line2: r.line2,
                line3: r.line3,
                line4: r.line4,
                line5: r.line5,
                line6: r.line6,

                allLine: r.allLine

            })

        })

        const buffer = await workbook.xlsx.writeBuffer()

        saveAs(
            new Blob([buffer]),
            "performance-rate.xlsx"
        )

        setExportOpen(false)

    }

    

<OeeGuard section="view">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">OEE Data View</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Performance Rate</h1>
              <p className="text-white/70 text-sm mt-1">Persentase kinerja mesin</p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">

            

            <Card>

                <CardHeader>
                    <CardTitle className="text-emerald-900 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"/>Filter</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-wrap items-end gap-6">

                    <div className="flex flex-col">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">From Date</p>
                        <Input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">To Date</p>
                        <Input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Monthly</p>
                        <Input
                            type="month"
                            value={month}
                            onChange={e => setMonth(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={() => setExportOpen(true)}
                    >
                        Export Excel
                    </Button>

                </CardContent>

            </Card>

            <PerformanceRateTable
                data={filteredData}
            />

            <Dialog
                open={exportOpen}
                onOpenChange={setExportOpen}
            >

                <DialogContent>

                    <DialogHeader>

                        <DialogTitle>
                            Export Performance Rate
                        </DialogTitle>

                    </DialogHeader>

                    <Input
                        type="date"
                        value={exportStart}
                        onChange={e => setExportStart(e.target.value)}
                    />

                    <Input
                        type="date"
                        value={exportEnd}
                        onChange={e => setExportEnd(e.target.value)}
                    />

                    <DialogFooter>

                        <Button
                            variant="outline"
                            onClick={() => setExportOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={exportExcel}
                        >
                            Export
                        </Button>

                    </DialogFooter>

                </DialogContent>

            </Dialog>

        </div>

    )

}