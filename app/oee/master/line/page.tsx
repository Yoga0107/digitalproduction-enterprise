"use client"

import { useState } from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { ConfirmDialog } from "@/components/confirm-dialog"

import { Line } from "@/types/line-types"
import { LineTable } from "@/components/oee/line-table"
import { LineFormDialog } from "@/components/oee/line-form-dialog"

export default function MasterLinePage() {

    const [lines, setLines] = useState<Line[]>([
        { id: "1", name: "Line 1", remarks: "Extruder CPM" },
        { id: "2", name: "Line 2", remarks: "Extruder 30" },
        { id: "3", name: "Line 3A", remarks: "IDAH 35A" },
        { id: "4", name: "Line 3B", remarks: "IDAH 35B" },
        { id: "5", name: "Line 4", remarks: "Extruder 40" },
    ])

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<Line | null>(null)

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<string | null>(null)

    function handleSave(line: Line) {

        const duplicate = lines.some(
            l =>
                l.name.toLowerCase() === line.name.toLowerCase() &&
                l.id !== line.id
        )

        if (duplicate) {
            alert("Line name already exists")
            return
        }

        if (editing) {
            setLines(prev =>
                prev.map(l => (l.id === line.id ? line : l))
            )
        } else {
            setLines(prev => [...prev, line])
        }
    }

    function handleEdit(line: Line) {
        setEditing(line)
        setDialogOpen(true)
    }

    function requestDelete(id: string) {
        setPendingDelete(id)
        setConfirmOpen(true)
    }

    function confirmDelete() {

        if (!pendingDelete) return

        setLines(prev =>
            prev.filter(l => l.id !== pendingDelete)
        )

        setPendingDelete(null)
        setConfirmOpen(false)
    }

    return (

        <ProtectedRoute>

            <div className="p-8 space-y-8">

                <div className="flex justify-between">

                    <h1 className="text-3xl font-bold">
                        Master Line
                    </h1>

                    <Button
                        onClick={() => {
                            setEditing(null)
                            setDialogOpen(true)
                        }}
                    >
                        Add Line
                    </Button>

                </div>

                <Card>

                    <CardHeader>
                        <CardTitle>Production Line</CardTitle>
                    </CardHeader>

                    <CardContent>

                        <LineTable
                            lines={lines}
                            onEdit={handleEdit}
                            onDelete={requestDelete}
                        />

                    </CardContent>

                </Card>

                <LineFormDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    editing={editing}
                    lines={lines}
                    onSave={handleSave}
                />

                <ConfirmDialog
                    open={confirmOpen}
                    title="Delete Line"
                    description="Are you sure you want to delete this line?"
                    confirmText="Delete"
                    onConfirm={confirmDelete}
                    onCancel={() => setConfirmOpen(false)}
                />

            </div>

        </ProtectedRoute>
    )
}