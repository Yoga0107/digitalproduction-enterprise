"use client"

import { useState } from "react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Row = {
  date: string
  line1: number | null
  line2: number | null
  line3: number | null
  line4: number | null
  line5: number | null
  line6: number | null
  allLine: number | null
}

export function ExportPerformanceDialog({
  open,
  onOpenChange,
  data
}:{
  open:boolean
  onOpenChange:(v:boolean)=>void
  data:Row[]
}){

  const [start,setStart] = useState("")
  const [end,setEnd] = useState("")

  async function exportExcel(){

    const filtered = data.filter(d => {

      if(start && d.date < start) return false
      if(end && d.date > end) return false

      return true
    })

    const workbook = new ExcelJS.Workbook()

    const sheet = workbook.addWorksheet("Performance Rate")

    sheet.columns = [

      {header:"Date", key:"date", width:15},

      {header:"Line 1", key:"line1", width:12},
      {header:"Line 2", key:"line2", width:12},
      {header:"Line 3A & 3B", key:"line3", width:14},
      {header:"Line 4", key:"line4", width:12},
      {header:"Line 5", key:"line5", width:12},
      {header:"Line 6A & 6B", key:"line6", width:14},

      {header:"All Line", key:"allLine", width:14}

    ]

    // HEADER STYLE
    sheet.getRow(1).eachCell((cell:any)=>{

      cell.font = {bold:true,color:{argb:"FFFFFFFF"}}

      cell.fill = {
        type:"pattern",
        pattern:"solid",
        fgColor:{argb:"FF1F4E78"}
      }

      cell.alignment = {vertical:"middle",horizontal:"center"}

    })

    filtered.forEach(r=>{

      const row = sheet.addRow({

        date:new Date(r.date).toLocaleDateString("id-ID"),

        line1:r.line1,
        line2:r.line2,
        line3:r.line3,
        line4:r.line4,
        line5:r.line5,
        line6:r.line6,

        allLine:r.allLine

      })

      row.eachCell((cell:any)=>{

        cell.alignment = {horizontal:"center"}

      })

    })

    // CONDITIONAL COLOR (Heatmap)
    sheet.eachRow((row:any,rowNumber:any)=>{

      if(rowNumber === 1) return

      row.eachCell((cell:any,colNumber:any)=>{

        if(colNumber === 1) return

        const v = cell.value as number

        if(v === null) return

        if(v >= 100){

          cell.fill = {
            type:"pattern",
            pattern:"solid",
            fgColor:{argb:"FFC6EFCE"}
          }

        }else if(v >= 90){

          cell.fill = {
            type:"pattern",
            pattern:"solid",
            fgColor:{argb:"FFFFEB9C"}
          }

        }else{

          cell.fill = {
            type:"pattern",
            pattern:"solid",
            fgColor:{argb:"FFFFC7CE"}
          }

        }

      })

    })

    const buffer = await workbook.xlsx.writeBuffer()

    const blob = new Blob([buffer])

    saveAs(blob,"performance-rate.xlsx")

    onOpenChange(false)

  }

  return(

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent>

        <DialogHeader>

          <DialogTitle>
            Export Performance Rate
          </DialogTitle>

        </DialogHeader>

        <div className="space-y-4">

          <div>

            <p className="text-sm mb-1">
              Start Date
            </p>

            <Input
              type="date"
              value={start}
              onChange={e=>setStart(e.target.value)}
            />

          </div>

          <div>

            <p className="text-sm mb-1">
              End Date
            </p>

            <Input
              type="date"
              value={end}
              onChange={e=>setEnd(e.target.value)}
            />

          </div>

        </div>

        <DialogFooter>

          <Button
            variant="outline"
            onClick={()=>onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            onClick={exportExcel}
          >
            Export Excel
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  )

}