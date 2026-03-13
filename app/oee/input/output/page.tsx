'use client'

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"

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
import OutputModal from "@/components/oee/output-modal"



export default function OutputPage(){

const [open,setOpen] = useState(false)

return(

<ProtectedRoute>

<div className="p-8 space-y-6">

{/* HEADER */}

<div className="flex justify-between items-center">

<h1 className="text-3xl font-bold">Production Output</h1>

<Button onClick={()=>setOpen(true)}>
<Plus className="h-4 w-4 mr-2"/>
Add Output
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
<SelectItem value="1">Line 1</SelectItem>
<SelectItem value="2">Line 2</SelectItem>
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

<Input placeholder="Search Kode Pakan"/>

<Button>
<Search className="h-4 w-4 mr-2"/>
Search
</Button>

</CardContent>

</Card>

{/* KPI */}

<div className="grid grid-cols-4 gap-4">

<Card>
<CardHeader>
<CardTitle>Total Plan</CardTitle>
</CardHeader>
<CardContent className="text-2xl font-bold">
10,000 kg
</CardContent>
</Card>

<Card>
<CardHeader>
<CardTitle>Total Output</CardTitle>
</CardHeader>
<CardContent className="text-2xl font-bold">
9,200 kg
</CardContent>
</Card>

<Card>
<CardHeader>
<CardTitle>Good Product</CardTitle>
</CardHeader>
<CardContent className="text-2xl font-bold">
8,950 kg
</CardContent>
</Card>

<Card>
<CardHeader>
<CardTitle>Reject</CardTitle>
</CardHeader>
<CardContent className="text-2xl font-bold">
250 kg
</CardContent>
</Card>

</div>

{/* TABLE */}

<Card>

<CardHeader>
<CardTitle>Production History</CardTitle>
</CardHeader>

<CardContent>

<Table>

<TableHeader>

<TableRow>
<TableHead>Date</TableHead>
<TableHead>Line</TableHead>
<TableHead>Shift</TableHead>
<TableHead>Kode Pakan</TableHead>
<TableHead>Plan</TableHead>
<TableHead>Output</TableHead>
<TableHead>Good</TableHead>
<TableHead>Reject</TableHead>
<TableHead>Quality %</TableHead>
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
<TableCell>1000</TableCell>
<TableCell>950</TableCell>
<TableCell>930</TableCell>
<TableCell>20</TableCell>
<TableCell>97.8%</TableCell>
<TableCell>Normal</TableCell>
<TableCell>
<Button size="sm" variant="outline">
Edit
</Button>
</TableCell>
</TableRow>

</TableBody>

</Table>

</CardContent>

</Card>

<OutputModal open={open} setOpen={setOpen}/>

</div>

</ProtectedRoute>

)
}