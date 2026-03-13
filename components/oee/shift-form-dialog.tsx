'use client'

import { useState } from "react"


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shift } from "@/types/shift-types"
import { validateShiftOverlap } from "@/lib/shift-utils"

type Props = {
  open: boolean
  onClose: () => void
  shifts: Shift[]
  onSave: (shift: Shift) => void
  editing?: Shift | null
}

export function ShiftFormDialog({
  open,
  onClose,
  shifts,
  onSave,
  editing,
}: Props) {

  const [name, setName] = useState(editing?.name ?? "")
  const [from, setFrom] = useState(editing?.from ?? "")
  const [to, setTo] = useState(editing?.to ?? "")
  const [error, setError] = useState("")

  function handleSubmit() {

    const newShift: Shift = {
      id: editing?.id ?? crypto.randomUUID(),
      name,
      from,
      to,
    }

    const valid = validateShiftOverlap(shifts, newShift, editing?.id)

    if (!valid) {
      setError("Shift time overlaps with existing shift")
      return
    }

    onSave(newShift)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>

      <DialogContent>

        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Shift" : "Add Shift"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div>
            <Label>Shift Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>From</Label>
            <Input
              type="time"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div>
            <Label>To</Label>
            <Input
              type="time"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button onClick={handleSubmit}>
            Save
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  )
}