'use client'

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { KodePakan } from "@/types/kode-pakan-types"
import { KodePakanTable } from "@/components/oee/kode-pakan-table"
import { KodePakanFormDialog } from "@/components/oee/kode-pakan-form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"



export default function MasterKodePakanPage() {

  const [data, setData] = useState<KodePakan[]>([
    { id: "1", kode: "771-2S", remarks: "" },
    { id: "2", kode: "771-3S", remarks: "" },
    { id: "3", kode: "781-1", remarks: "" },
    { id: "4", kode: "781-2", remarks: "" },
  ])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<KodePakan | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<"add" | "edit" | "delete" | null>(null)

  const [pendingItem, setPendingItem] = useState<KodePakan | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)


  function requestSave(item: KodePakan) {

    const duplicate = data.find(
      (d) =>
        d.kode === item.kode &&
        d.id !== item.id
    )

    if (duplicate) {
      alert("Kode Pakan already exists")
      return
    }

    setPendingItem(item)

    if (editing) {
      setConfirmType("edit")
    } else {
      setConfirmType("add")
    }

    setConfirmOpen(true)
  }


  function confirmSave() {

    if (!pendingItem) return

    if (confirmType === "edit") {

      setData((prev) =>
        prev.map((i) =>
          i.id === pendingItem.id ? pendingItem : i
        )
      )

    } else {

      setData((prev) => [...prev, pendingItem])

    }

    setPendingItem(null)
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
      setData((prev) =>
        prev.filter((i) => i.id !== pendingDeleteId)
      )
    }

    setPendingDeleteId(null)
    setConfirmOpen(false)
  }


  function handleEdit(item: KodePakan) {
    setEditing(item)
    setDialogOpen(true)
  }


  return (
    <ProtectedRoute>

      <div className="p-8 space-y-8">

        <div className="flex justify-between">

          <h1 className="text-3xl font-bold">
            Master Kode Pakan
          </h1>

          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            Add Kode Pakan
          </Button>

        </div>

        <Card>

          <CardHeader>
            <CardTitle>List Kode Pakan</CardTitle>
          </CardHeader>

          <CardContent>

            <KodePakanTable
              data={data}
              onEdit={handleEdit}
              onDelete={requestDelete}
            />

          </CardContent>

        </Card>

        <KodePakanFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          data={data}
          editing={editing}
          onSave={requestSave}
        />

        <ConfirmDialog
          open={confirmOpen}
          title={
            confirmType === "delete"
              ? "Delete Kode Pakan"
              : confirmType === "edit"
              ? "Update Kode Pakan"
              : "Add Kode Pakan"
          }
          description={
            confirmType === "delete"
              ? "Are you sure you want to delete this kode pakan?"
              : confirmType === "edit"
              ? "Are you sure you want to update this kode pakan?"
              : "Are you sure you want to add this kode pakan?"
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