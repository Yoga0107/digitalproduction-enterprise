"use client"

import { useState } from "react"

import { ProtectedRoute } from "@/components/protected-route"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { ThroughputTable } from "@/components/oee/throughput-table"
import { ThroughputFormDialog } from "@/components/oee/throughput-form"

import { ConfirmDialog } from "@/components/confirm-dialog"



export type StandardThroughput = {
  id: string
  line: string
  kodePakan: string
  throughput: number
  remarks?: string
}

export default function StandardThroughputPage() {

  const [data, setData] = useState<StandardThroughput[]>([
    {
      id: "1",
      line: "Line 1 (Extruder CPM)",
      kodePakan: "771-2S",
      throughput: 2495.74,
      remarks: "Berdasar analisa actual throughput bulan Okt-25"
    },
    {
      id: "2",
      line: "Line 1 (Extruder CPM)",
      kodePakan: "771-3S",
      throughput: 9317.33,
      remarks: "Berdasar analisa actual throughput bulan Okt-25"
    },
  ])

  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<StandardThroughput | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmType, setConfirmType] = useState<"add" | "edit" | "delete" | null>(null)

  const [pendingItem, setPendingItem] = useState<StandardThroughput | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)


  function requestSave(item: StandardThroughput) {

    const duplicate = data.find(
      d =>
        d.line === item.line &&
        d.kodePakan === item.kodePakan &&
        d.id !== item.id
    )

    if (duplicate) {
      alert("Line + Kode Pakan already exists")
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

      setData(prev =>
        prev.map(i =>
          i.id === pendingItem.id ? pendingItem : i
        )
      )

    } else {

      setData(prev => [...prev, pendingItem])

    }

    setConfirmOpen(false)
    setPendingItem(null)
    setEditing(null)
    setOpenForm(false)
  }


  function requestDelete(id: string) {

    setPendingDelete(id)
    setConfirmType("delete")
    setConfirmOpen(true)

  }


  function confirmDelete() {

    if (pendingDelete) {
      setData(prev =>
        prev.filter(i => i.id !== pendingDelete)
      )
    }

    setConfirmOpen(false)
    setPendingDelete(null)
  }


  return (

    <ProtectedRoute>

      <div className="p-8 space-y-8">

        <div className="flex justify-between">

          <h1 className="text-3xl font-bold">
            Master Standard Throughput
          </h1>

          <Button
            onClick={() => {
              setEditing(null)
              setOpenForm(true)
            }}
          >
            Add Standard Throughput
          </Button>

        </div>


        <Card>

          <CardHeader>
            <CardTitle>
              List Standard Throughput
            </CardTitle>
          </CardHeader>

          <CardContent>

            <ThroughputTable
              data={data}
              onEdit={(item) => {
                setEditing(item)
                setOpenForm(true)
              }}
              onDelete={requestDelete}
            />

          </CardContent>

        </Card>


        <ThroughputFormDialog
          open={openForm}
          onOpenChange={setOpenForm}
          editing={editing}
          onSave={requestSave}
        />


        <ConfirmDialog
          open={confirmOpen}
          title={
            confirmType === "delete"
              ? "Delete Standard Throughput"
              : confirmType === "edit"
              ? "Update Standard Throughput"
              : "Add Standard Throughput"
          }
          description={
            confirmType === "delete"
              ? "Are you sure you want to delete this record?"
              : confirmType === "edit"
              ? "Are you sure you want to update this record?"
              : "Are you sure you want to add this record?"
          }
          confirmText={
            confirmType === "delete"
              ? "Delete"
              : "Confirm"
          }
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