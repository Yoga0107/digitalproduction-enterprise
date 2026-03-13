'use client'

import { useState, useEffect } from "react"


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KodePakan } from "@/types/kode-pakan-types"
import { validateKodePakanUnique } from "@/lib/kode-pakan-utils"

type Props = {
  open: boolean
  onClose: () => void
  data: KodePakan[]
  editing?: KodePakan | null
  onSave: (item: KodePakan) => void
}

export function KodePakanFormDialog({
  open,
  onClose,
  data,
  editing,
  onSave
}: Props) {

  const [kode, setKode] = useState("")
  const [remarks, setRemarks] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    setKode(editing?.kode ?? "")
    setRemarks(editing?.remarks ?? "")
  }, [editing])

  function handleSubmit() {

    const valid = validateKodePakanUnique(
      data,
      kode,
      editing?.id
    )

    if (!valid) {
      setError("Kode pakan already exists")
      return
    }

    const newItem: KodePakan = {
      id: editing?.id ?? crypto.randomUUID(),
      kode,
      remarks
    }

    onSave(newItem)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>

      <DialogContent>

        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Kode Pakan" : "Add Kode Pakan"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div>
            <Label>Kode Pakan</Label>
            <Input
              value={kode}
              onChange={(e) => setKode(e.target.value)}
            />
          </div>

          <div>
            <Label>Remarks</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
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