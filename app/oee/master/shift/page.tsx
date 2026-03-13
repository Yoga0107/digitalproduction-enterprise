'use client'

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Shift } from "@/types/shift-types"

import { ShiftTable } from "@/components/oee/shift-table"
import { ShiftFormDialog } from "@/components/oee/shift-form-dialog"

import { ConfirmDialog } from "@/components/confirm-dialog"



export default function MasterShiftPage() {

  const [shifts, setShifts] = useState<Shift[]>([
    { id: "1", name: "Shift 2", from: "07:00", to: "15:00" },
    { id: "2", name: "Shift 3", from: "15:00", to: "23:00" },
    { id: "3", name: "Shift 1", from: "23:00", to: "07:00" },
  ])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<"add" | "edit" | "delete" | null>(null)

  const [pendingShift, setPendingShift] = useState<Shift | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)



  function timeToMinutes(time: string) {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
  }



  function isOverlap(newShift: Shift) {

    const start = timeToMinutes(newShift.from)
    const end = timeToMinutes(newShift.to)

    return shifts.some((s) => {

      if (s.id === newShift.id) return false

      const sStart = timeToMinutes(s.from)
      const sEnd = timeToMinutes(s.to)

      if (start < sEnd && end > sStart) {
        return true
      }

      return false
    })
  }



  function requestSave(shift: Shift) {

    const duplicate = shifts.find(
      (s) =>
        s.name === shift.name &&
        s.id !== shift.id
    )

    if (duplicate) {
      alert("Shift name already exists")
      return
    }

    if (isOverlap(shift)) {
      alert("Shift time overlaps with another shift")
      return
    }

    setPendingShift(shift)

    if (editing) {
      setConfirmType("edit")
    } else {
      setConfirmType("add")
    }

    setConfirmOpen(true)
  }



  function confirmSave() {

    if (!pendingShift) return

    if (confirmType === "edit") {

      setShifts((prev) =>
        prev.map((s) =>
          s.id === pendingShift.id ? pendingShift : s
        )
      )

    } else {

      setShifts((prev) => [...prev, pendingShift])

    }

    setPendingShift(null)
    setConfirmOpen(false)
    setDialogOpen(false)
    setEditing(null)
  }



  function requestDelete(id: string) {

    setPendingDeleteId(id)
    setConfirmType("delete")
    setConfirmOpen(true)

  }



  function confirmDelete() {

    if (pendingDeleteId) {
      setShifts((prev) =>
        prev.filter((s) => s.id !== pendingDeleteId)
      )
    }

    setPendingDeleteId(null)
    setConfirmOpen(false)
  }



  function handleEdit(shift: Shift) {
    setEditing(shift)
    setDialogOpen(true)
  }



  return (
    <ProtectedRoute>

      <div className="p-8 space-y-8">

        <div className="flex justify-between">

          <h1 className="text-3xl font-bold">
            Master Shift
          </h1>

          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            Add Shift
          </Button>

        </div>


        <Card>

          <CardHeader>
            <CardTitle>Shift Schedule</CardTitle>
          </CardHeader>

          <CardContent>

            <ShiftTable
              shifts={shifts}
              onEdit={handleEdit}
              onDelete={requestDelete}
            />

          </CardContent>

        </Card>


        <ShiftFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          shifts={shifts}
          editing={editing}
          onSave={requestSave}
        />


        <ConfirmDialog
          open={confirmOpen}
          title={
            confirmType === "delete"
              ? "Delete Shift"
              : confirmType === "edit"
              ? "Update Shift"
              : "Add Shift"
          }
          description={
            confirmType === "delete"
              ? "Are you sure you want to delete this shift?"
              : confirmType === "edit"
              ? "Are you sure you want to update this shift?"
              : "Are you sure you want to add this shift?"
          }
          confirmText={
            confirmType === "delete"
              ? "Delete"
              : "Confirm"
          }
          cancelText="Cancel"
          onConfirm={
            confirmType === "delete"
              ? confirmDelete
              : confirmSave
          }
          onCancel={() => setConfirmOpen(false)}
        />

      </div>

    </ProtectedRoute>
  )
}