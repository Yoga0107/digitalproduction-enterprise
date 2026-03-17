"use client"

import { OeeGuard } from '@/components/oee/oee-guard'
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
 className="space-y-6">

            <h1 className="text-2xl font-bold">
                Performance Rate
            </h1>

            <Card>

                <CardHeader>
                    <CardTitle>Filter</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-wrap items-end gap-6">

                    <div className="flex flex-col">
                        <p className="text-sm">From Date</p>
                        <Input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <p className="text-sm">To Date</p>
                        <Input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <p className="text-sm">Monthly</p>
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