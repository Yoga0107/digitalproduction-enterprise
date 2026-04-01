"use client"

import { AvailabilityRow } from "@/app/(protected)/oee/view/availability-rate/data"





type Props = {
  data: AvailabilityRow[]
}

export default function AvailabilityRateTable({ data }: Props) {

  return (

    <div className="overflow-x-auto border rounded-lg">

      <table className="w-full text-sm">

        <thead className="bg-muted">

          <tr>

            <th className="p-2 text-left">Date</th>

            <th className="p-2">Line 1</th>
            <th className="p-2">Line 2</th>

            <th className="p-2">Line 3A</th>
            <th className="p-2">Line 3B</th>
            <th className="p-2">Line 3A & 3B</th>

            <th className="p-2">Line 4</th>
            <th className="p-2">Line 5</th>

            <th className="p-2">Line 6A</th>
            <th className="p-2">Line 6B</th>
            <th className="p-2">Line 6A & 6B</th>

            <th className="p-2 font-bold">All Line</th>

          </tr>

        </thead>

        <tbody>

          {data.map((row,i)=>(

            <tr
              key={i}
              className="border-t hover:bg-muted/50"
            >

              <td className="p-2">
                {new Date(row.date).toLocaleDateString("id-ID")}
              </td>

              <td className="text-center">{row.line1 ?? "N/A"}</td>
              <td className="text-center">{row.line2 ?? "N/A"}</td>

              <td className="text-center">{row.line3A ?? "N/A"}</td>
              <td className="text-center">{row.line3B ?? "N/A"}</td>
              <td className="text-center">{row.line3AB ?? "N/A"}</td>

              <td className="text-center">{row.line4 ?? "N/A"}</td>
              <td className="text-center">{row.line5 ?? "N/A"}</td>

              <td className="text-center">{row.line6A ?? "N/A"}</td>
              <td className="text-center">{row.line6B ?? "N/A"}</td>
              <td className="text-center">{row.line6AB ?? "N/A"}</td>

              <td className="text-center font-semibold">
                {row.allLine ?? "N/A"}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}