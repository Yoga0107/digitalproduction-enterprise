"use client"

import { useEffect, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

import { StandardThroughput } from "@/app/oee/master/standard-throughput/page"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: StandardThroughput | null
  onSave: (item: StandardThroughput) => void
}

export function ThroughputFormDialog({
  open,
  onOpenChange,
  editing,
  onSave
}: Props) {

  const [line, setLine] = useState("")
  const [kodePakan, setKodePakan] = useState("")
  const [throughput, setThroughput] = useState("")
  const [remarks, setRemarks] = useState("")

  useEffect(() => {

    if (editing) {
      setLine(editing.line)
      setKodePakan(editing.kodePakan)
      setThroughput(editing.throughput.toString())
      setRemarks(editing.remarks ?? "")
    } else {
      setLine("")
      setKodePakan("")
      setThroughput("")
      setRemarks("")
    }

  }, [editing])

  function submit() {

    const item: StandardThroughput = {
      id: editing?.id ?? crypto.randomUUID(),
      line,
      kodePakan,
      throughput: Number(throughput),
      remarks
    }

    onSave(item)
    onOpenChange(false)
  }

  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="sm:max-w-[420px]">

        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit" : "Add"} Standard Throughput
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Line
            </label>
            <Input
              placeholder="Line"
              value={line}
              onChange={e => setLine(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Kode Pakan
            </label>
            <Input
              placeholder="Kode Pakan"
              value={kodePakan}
              onChange={e => setKodePakan(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Standard Throughput
            </label>
            <Input
              type="number"
              placeholder="Standard Throughput"
              value={throughput}
              onChange={e => setThroughput(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Remarks
            </label>
            <Textarea
              placeholder="Remarks"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>

        </div>

        <DialogFooter className="pt-4">

          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button onClick={submit}>
            Save
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  )
}