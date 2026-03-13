"use client"

import { useEffect, useState } from "react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { Line } from "@/types/line-types"

type Props = {
    open: boolean
    onClose: () => void
    editing: Line | null
    lines: Line[]
    onSave: (line: Line) => void
}

export function LineFormDialog({
    open,
    onClose,
    editing,
    onSave
}: Props) {

    const [name, setName] = useState("")
    const [remarks, setRemarks] = useState("")

    useEffect(() => {

        if (editing) {
            setName(editing.name)
            setRemarks(editing.remarks)
        } else {
            setName("")
            setRemarks("")
        }

    }, [editing])

    function handleSubmit() {

        if (!name.trim()) {
            alert("Line name required")
            return
        }

        const line: Line = {
            id: editing ? editing.id : crypto.randomUUID(),
            name,
            remarks
        }

        onSave(line)
        onClose()
    }

    return (

        <Dialog open={open} onOpenChange={onClose}>

            <DialogContent>

                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Edit Line" : "Add Line"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">

                    <Input
                        placeholder="Line Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />

                    <Input
                        placeholder="Remarks"
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                    />

                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                    >
                        Save
                    </Button>

                </div>

            </DialogContent>

        </Dialog>
    )
}