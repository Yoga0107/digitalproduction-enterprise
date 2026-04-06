"use client"

import { OeeRow } from "@/types/oee-types"
import { ApiLine } from "@/types/api"

interface Props {
  data:       OeeRow[]
  lines:      ApiLine[]
  showDetail: boolean
}

function rateColor(rate: number | null): string {
  if (rate === null) return "text-gray-400 bg-gray-50"
  if (rate >= 90)    return "text-emerald-700 bg-emerald-50"
  if (rate >= 75)    return "text-yellow-700 bg-yellow-50"
  return "text-red-700 bg-red-50"
}

const fmtPct = (v: number | null) => v === null ? "N/A" : `${v.toFixed(1)}%`
const fmtH   = (h: number) => `${h.toFixed(2)}h`

export default function AvailabilityRateTable({ data, lines, showDetail }: Props) {
  if (!data.length)
    return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border rounded-lg">Tidak ada data untuk filter yang dipilih.</div>

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-emerald-700 text-white">
            <th className="p-3 text-left font-semibold whitespace-nowrap" rowSpan={showDetail ? 2 : 1}>Tanggal</th>
            {lines.map(l => (
              <th key={l.id} className="p-3 text-center font-semibold whitespace-nowrap" colSpan={showDetail ? 3 : 1}>{l.name}</th>
            ))}
            <th className="p-3 text-center font-semibold whitespace-nowrap bg-emerald-900" colSpan={showDetail ? 3 : 1}>All Line</th>
          </tr>
          {showDetail && (
            <tr className="bg-emerald-100 text-emerald-800 text-xs">
              {lines.map(l => (
                <>
                  <th key={`${l.id}-op`} className="p-2 text-center">Op. Time</th>
                  <th key={`${l.id}-ld`} className="p-2 text-center">Load Time</th>
                  <th key={`${l.id}-rt`} className="p-2 text-center font-bold">Rate</th>
                </>
              ))}
              <th className="p-2 text-center">Op. Time</th>
              <th className="p-2 text-center">Load Time</th>
              <th className="p-2 text-center font-bold">Rate</th>
            </tr>
          )}
        </thead>
        <tbody>
          {data.map((row, i) => {
            const al = row.all_line
            return (
              <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                <td className="p-3 font-medium text-gray-700 whitespace-nowrap">{row.date}</td>
                {lines.map(l => {
                  const d = row.lines[l.id]
                  const rate = d?.availability ?? null
                  return showDetail ? (
                    <>
                      <td key={`${l.id}-op`} className="p-2 text-center text-xs text-gray-500">{d ? fmtH(d.operating_h) : "—"}</td>
                      <td key={`${l.id}-ld`} className="p-2 text-center text-xs text-gray-500">{d ? fmtH(d.loading_h)   : "—"}</td>
                      <td key={`${l.id}-rt`} className={`p-2 text-center font-semibold ${rateColor(rate)}`}>{fmtPct(rate)}</td>
                    </>
                  ) : (
                    <td key={l.id} className={`p-3 text-center font-semibold ${rateColor(rate)}`}>{fmtPct(rate)}</td>
                  )
                })}
                {showDetail ? (
                  <>
                    <td className="p-2 text-center text-xs text-gray-500 bg-emerald-50">{fmtH(al.operating_h)}</td>
                    <td className="p-2 text-center text-xs text-gray-500 bg-emerald-50">{fmtH(al.loading_h)}</td>
                    <td className={`p-2 text-center font-bold bg-emerald-50 ${rateColor(al.availability)}`}>{fmtPct(al.availability)}</td>
                  </>
                ) : (
                  <td className={`p-3 text-center font-bold bg-emerald-50 ${rateColor(al.availability)}`}>{fmtPct(al.availability)}</td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
