'use client'

import { OeeGuard } from '@/components/oee/oee-guard'
import { useState } from "react"

import {
Card,CardContent,CardHeader,CardTitle
} from "@/components/ui/card"

import {
Table,TableBody,TableCell,TableHead,TableHeader,TableRow
} from "@/components/ui/table"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select"

import { Plus,Search } from "lucide-react"
import MachineLossModal from "@/components/oee/machine-loss-modal"


export default function MachineLossPage(){

const [open,setOpen] = useState(false)

return(



<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 to-emerald-600 px-8 py-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Factory className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Input Data</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Input Machine Loss</h2>
              <p className="text-white/70 text-sm mt-1">Pencatatan kerugian mesin harian</p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">

{/* HEADER */}

<div className="flex justify-between items-center">
<h1 className="text-3xl font-bold text-emerald-900">Machine Losses</h1>

<Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm gap-2" onClick={()=>setOpen(true)}>
<Plus className="h-4 w-4 mr-2"/>
Add New
</Button>
</div>

{/* FILTER */}

<Card>
<CardContent className="p-4 grid grid-cols-5 gap-4">

<Input type="date"/>

<Select>
<SelectTrigger>
<SelectValue placeholder="Line"/>
</SelectTrigger>
<SelectContent>
<SelectItem value="line1">Line 1</SelectItem>
<SelectItem value="line2">Line 2</SelectItem>
</SelectContent>
</Select>

<Select>
<SelectTrigger>
<SelectValue placeholder="Shift"/>
</SelectTrigger>
<SelectContent>
<SelectItem value="1">Shift 1</SelectItem>
<SelectItem value="2">Shift 2</SelectItem>
<SelectItem value="3">Shift 3</SelectItem>
</SelectContent>
</Select>

<Input placeholder="Search feed code"/>

<Button>
<Search className="h-4 w-4 mr-2"/>
Search
</Button>

</CardContent>
</Card>

{/* KPI SUMMARY */}

<div className="grid grid-cols-4 gap-4">

<Card>
<CardHeader>
<CardTitle>Total Loss</CardTitle>
</CardHeader>
<CardContent className="text-2xl font-bold text-emerald-900">
4.5 hr
</CardContent>
</Card>

<Card>
<CardHeader>
<CardTitle>Breakdown</CardTitle>
</CardHeader>
<CardContent className="text-2xl font-bold text-emerald-900">
2.1 hr
</CardContent>
</Card>

<Card>
<CardHeader>
<CardTitle>Setup</CardTitle>
</CardHeader>
<CardContent className="text-2xl font-bold text-emerald-900">
1.3 hr
</CardContent>
</Card>

<Card>
<CardHeader>
<CardTitle>Cleaning</CardTitle>
</CardHeader>
<CardContent className="text-2xl font-bold text-emerald-900">
1.1 hr
</CardContent>
</Card>

</div>

{/* TABLE */}

<Card>

<CardHeader>
<CardTitle>Machine Loss History</CardTitle>
</CardHeader>

<CardContent>

<Table>

<TableHeader>

<TableRow>
<TableHead>Date</TableHead>
<TableHead>Line</TableHead>
<TableHead>Shift</TableHead>
<TableHead>Kode Pakan</TableHead>
<TableHead>L1</TableHead>
<TableHead>L2</TableHead>
<TableHead>L3</TableHead>
<TableHead>From</TableHead>
<TableHead>To</TableHead>
<TableHead>Duration</TableHead>
<TableHead>Remarks</TableHead>
<TableHead>Action</TableHead>
</TableRow>

</TableHeader>

<TableBody>

<TableRow>
<TableCell>2026-03-01</TableCell>
<TableCell>Line 1</TableCell>
<TableCell>1</TableCell>
<TableCell>PKN01</TableCell>
<TableCell>Breakdown</TableCell>
<TableCell>Motor</TableCell>
<TableCell>Bearing</TableCell>
<TableCell>08:00</TableCell>
<TableCell>09:00</TableCell>
<TableCell>1</TableCell>
<TableCell>Replace bearing</TableCell>
<TableCell>
<Button size="sm" variant="outline">Edit</Button>
</TableCell>
</TableRow>

</TableBody>

</Table>

</CardContent>

</Card>

<MachineLossModal open={open} setOpen={setOpen}/>

</div>
      </div>


)
}