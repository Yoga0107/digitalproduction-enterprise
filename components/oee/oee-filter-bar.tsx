"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  dateFrom:      string
  dateTo:        string
  groupBy:       "daily" | "monthly"
  showDetail:    boolean
  loading:       boolean
  onDateFrom:    (v: string) => void
  onDateTo:      (v: string) => void
  onGroupBy:     (v: "daily" | "monthly") => void
  onToggleDetail: () => void
  onFetch:       () => void
}

export function OeeFilterBar({
  dateFrom, dateTo, groupBy, showDetail, loading,
  onDateFrom, onDateTo, onGroupBy, onToggleDetail, onFetch,
}: Props) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
      <CardHeader className="bg-emerald-50/60 pb-3">
        <CardTitle className="text-emerald-900 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-4 pt-4">

        <div>
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">From Date</p>
          <Input type="date" value={dateFrom} onChange={e => onDateFrom(e.target.value)} className="w-40" />
        </div>

        <div>
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">To Date</p>
          <Input type="date" value={dateTo} onChange={e => onDateTo(e.target.value)} className="w-40" />
        </div>

        <div>
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Group By</p>
          <Select value={groupBy} onValueChange={v => onGroupBy(v as "daily" | "monthly")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Button
            onClick={onFetch}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Memuat..." : "Tampilkan"}
          </Button>

          <Button
            variant="outline"
            onClick={onToggleDetail}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {showDetail ? "Sembunyikan Detail" : "Tampilkan Detail"}
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
