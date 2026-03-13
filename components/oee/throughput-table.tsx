"use client"

import { StandardThroughput } from "@/app/oee/master/standard-throughput/page"
import { Button } from "@/components/ui/button"

type Props = {
  data: StandardThroughput[]
  onEdit: (item: StandardThroughput) => void
  onDelete: (id: string) => void
}

export function ThroughputTable({
  data,
  onEdit,
  onDelete
}: Props) {

  return (

    <table className="w-full border">

      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Line</th>
          <th className="p-2 text-left">Kode Pakan</th>
          <th className="p-2 text-left">Standard Throughput</th>
          <th className="p-2 text-left">Remarks</th>
          <th className="p-2 text-left">Action</th>
        </tr>
      </thead>

      <tbody>

        {data.map(item => (

          <tr key={item.id} className="border-t">

            <td className="p-2">
              {item.line}
            </td>

            <td className="p-2">
              {item.kodePakan}
            </td>

            <td className="p-2">
              {item.throughput.toLocaleString()}
            </td>

            <td className="p-2">
              {item.remarks}
            </td>

            <td className="p-2 space-x-2">

              <Button
                size="sm"
                onClick={() => onEdit(item)}
              >
                Edit
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(item.id)}
              >
                Delete
              </Button>

            </td>

          </tr>

        ))}

      </tbody>

    </table>
  )
}