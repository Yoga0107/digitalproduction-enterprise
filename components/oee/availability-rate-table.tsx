"use client"


import { AvailabilityRow } from "@/app/(protected)/oee/view/availability-rate/data"
import { ApiLine } from "@/types/api"


interface Props {
  data:  AvailabilityRow[]
  lines: ApiLine[]
  showDetail?: boolean   // tampilkan loading_h & operating_h
}

// ─── Warna heatmap ─────────────────────────────────────────────────────────

function rateColor(rate: number | null): string {
  if (rate === null)  return "text-gray-400 bg-gray-50"
  if (rate >= 90)     return "text-emerald-700 bg-emerald-50"
  if (rate >= 75)     return "text-yellow-700 bg-yellow-50"
  return "text-red-700 bg-red-50"
}

function fmtRate(rate: number | null): string {
  if (rate === null) return "N/A"
  return `${rate.toFixed(1)}%`
}

function fmtHour(h: number): string {
  return `${h.toFixed(2)}h`
}

// ─── Component ────────────────────────────────────────────────────────────

export default function AvailabilityRateTable({ data, lines, showDetail = false }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border rounded-lg">
        Tidak ada data untuk filter yang dipilih.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-emerald-700 text-white">
            <th className="p-3 text-left font-semibold whitespace-nowrap">Tanggal</th>

            {lines.map(line => (
              <th
                key={line.id}
                className="p-3 text-center font-semibold whitespace-nowrap"
                colSpan={showDetail ? 3 : 1}
              >
                {line.name}
              </th>
            ))}

            <th
              className="p-3 text-center font-semibold whitespace-nowrap bg-emerald-900"
              colSpan={showDetail ? 3 : 1}
            >
              All Line
            </th>
          </tr>

          {/* Sub-header saat showDetail aktif */}
          {showDetail && (
            <tr className="bg-emerald-100 text-emerald-800 text-xs">
              <th className="p-2" />
              {lines.map(line => (
                <>
                  <th key={`${line.id}-op`}  className="p-2 text-center">Op. Time</th>
                  <th key={`${line.id}-ld`}  className="p-2 text-center">Load Time</th>
                  <th key={`${line.id}-rt`}  className="p-2 text-center font-bold">Rate</th>
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
            // Aggregate all_line operating & loading dari lines
            const allOpH   = lines.reduce((s, l) => s + (row.lines[l.id]?.operating_h ?? 0), 0)
            const allLoadH = lines.reduce((s, l) => s + (row.lines[l.id]?.loading_h ?? 0), 0)

            return (
              <tr key={i} className="border-t hover:bg-muted/40 transition-colors">
                {/* Tanggal */}
                <td className="p-3 font-medium text-gray-700 whitespace-nowrap">
                  {row.date}
                </td>

                {/* Per line */}
                {lines.map(line => {
                  const d = row.lines[line.id]
                  return showDetail ? (
                    <>
                      <td key={`${line.id}-op`}  className="p-2 text-center text-xs text-gray-500">{d ? fmtHour(d.operating_h) : "—"}</td>
                      <td key={`${line.id}-ld`}  className="p-2 text-center text-xs text-gray-500">{d ? fmtHour(d.loading_h)   : "—"}</td>
                      <td key={`${line.id}-rt`}  className={`p-2 text-center font-semibold rounded ${d ? rateColor(d.rate) : "text-gray-400"}`}>
                        {d ? fmtRate(d.rate) : "—"}
                      </td>
                    </>
                  ) : (
                    <td
                      key={line.id}
                      className={`p-3 text-center font-semibold ${d ? rateColor(d.rate) : "text-gray-400 bg-gray-50"}`}
                    >
                      {d ? fmtRate(d.rate) : "—"}
                    </td>
                  )
                })}

                {/* All Line */}
                {showDetail ? (
                  <>
                    <td className="p-2 text-center text-xs text-gray-500 bg-emerald-50">{fmtHour(allOpH)}</td>
                    <td className="p-2 text-center text-xs text-gray-500 bg-emerald-50">{fmtHour(allLoadH)}</td>
                    <td className={`p-2 text-center font-bold bg-emerald-50 ${rateColor(row.all_line)}`}>
                      {fmtRate(row.all_line)}
                    </td>
                  </>
                ) : (
                  <td className={`p-3 text-center font-bold ${rateColor(row.all_line)} bg-emerald-50`}>
                    {fmtRate(row.all_line)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
