'use client'

import { useState,useEffect } from "react"

import {
Dialog,DialogContent,DialogHeader,DialogTitle
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function MachineLossModal({open,setOpen}:any){

const [from,setFrom] = useState("")
const [to,setTo] = useState("")
const [duration,setDuration] = useState("")

useEffect(()=>{

if(from && to){

const start = new Date(`1970-01-01T${from}:00`)
const end = new Date(`1970-01-01T${to}:00`)

const diff = (end.getTime()-start.getTime())/(1000*60*60)

setDuration(diff.toFixed(2))

}

},[from,to])

return(

<Dialog open={open} onOpenChange={setOpen}>

<DialogContent className="max-w-4xl">

<DialogHeader>
<DialogTitle>Add Machine Loss</DialogTitle>
</DialogHeader>

<div className="grid grid-cols-3 gap-4">

<div>
<Label>Date</Label>
<Input type="date"/>
</div>

<div>
<Label>Line</Label>
<Select>
<SelectTrigger>
<SelectValue placeholder="Line"/>
</SelectTrigger>
<SelectContent>
<SelectItem value="1">Line 1</SelectItem>
<SelectItem value="2">Line 2</SelectItem>
</SelectContent>
</Select>
</div>

<div>
<Label>Shift</Label>
<Select>
<SelectTrigger>
<SelectValue placeholder="Shift"/>
</SelectTrigger>
<SelectContent>
<SelectItem value="1">1</SelectItem>
<SelectItem value="2">2</SelectItem>
<SelectItem value="3">3</SelectItem>
</SelectContent>
</Select>
</div>

<div>
<Label>Kode Pakan</Label>
<Input/>
</div>

<div>
<Label>Machine Loss Level 1</Label>
<Select>
<SelectTrigger>
<SelectValue placeholder="Select"/>
</SelectTrigger>
<SelectContent>
<SelectItem value="breakdown">Breakdown</SelectItem>
<SelectItem value="setup">Setup</SelectItem>
<SelectItem value="cleaning">Cleaning</SelectItem>
</SelectContent>
</Select>
</div>

<div>
<Label>Machine Loss Level 2</Label>
<Input/>
</div>

<div>
<Label>Machine Loss Level 3</Label>
<Input/>
</div>

<div>
<Label>From</Label>
<Input type="time" value={from} onChange={(e)=>setFrom(e.target.value)}/>
</div>

<div>
<Label>To</Label>
<Input type="time" value={to} onChange={(e)=>setTo(e.target.value)}/>
</div>

<div>
<Label>Duration (hour)</Label>
<Input value={duration} readOnly/>
</div>

<div className="col-span-3">
<Label>Remarks</Label>
<Textarea/>
</div>

</div>

<Button className="w-full mt-6">
Save Data
</Button>

</DialogContent>

</Dialog>

)
}