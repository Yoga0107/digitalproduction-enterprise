"use client"

import { Line } from "@/types/line-types"
import { Button } from "@/components/ui/button"

type Props = {
    lines: Line[]
    onEdit: (line: Line) => void
    onDelete: (id: string) => void
}

export function LineTable({
    lines,
    onEdit,
    onDelete
}: Props) {

    return (

        <table className="w-full">

            <thead>

                <tr className="border-b">

                    <th className="text-left p-2 w-[40%]">
                        Line Name
                    </th>

                    <th className="text-left p-2 w-[40%]">
                        Remarks
                    </th>

                    <th className="text-center p-2 w-[20%]">
                        Actions
                    </th>

                </tr>

            </thead>

            <tbody>

                {lines.map(line => (

                    <tr key={line.id} className="border-b">

                        <td className="p-2">{line.name}</td>

                        <td className="p-2">{line.remarks}</td>

                        <td className="p-2">

                            <div className="flex justify-center gap-2">

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(line)}
                                >
                                    Edit
                                </Button>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onDelete(line.id)}
                                >
                                    Delete
                                </Button>

                            </div>

                        </td>

                    </tr>

                ))}

            </tbody>

        </table>
    )
}