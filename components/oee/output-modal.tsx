'use client'

import { useState,useEffect } from "react"

import {
Dialog,DialogContent,DialogHeader,DialogTitle
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

import {
Select,SelectContent,SelectItem,SelectTrigger,SelectValue
} from "@/components/ui/select"

export default function OutputModal({open,setOpen}:any){

const [output,setOutput] = useState(0)
const [good,setGood] = useState(0)
const [reject,setReject] = useState(0)
const [quality,setQuality] = useState(0)

useEffect(()=>{

if(output>0){

const rejectValue = output-good
setReject(rejectValue)

const qr = (good/output)*100
setQuality(Number(qr.toFixed(2)))

}

},[output,good])

return(

<Dialog open={open} onOpenChange={setOpen}>

<DialogContent className="max-w-3xl">

<DialogHeader>
<DialogTitle>Add Production Output</DialogTitle>
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
<SelectItem value="1">Shift 1</SelectItem>
<SelectItem value="2">Shift 2</SelectItem>
<SelectItem value="3">Shift 3</SelectItem>
</SelectContent>
</Select>
</div>

<div>
<Label>Kode Pakan</Label>
<Input/>
</div>

<div>
<Label>Production Plan</Label>
<Input type="number"/>
</div>

<div>
<Label>Total Output</Label>
<Input type="number"
onChange={(e)=>setOutput(Number(e.target.value))}
/>
</div>

<div>
<Label>Good Product</Label>
<Input type="number"
onChange={(e)=>setGood(Number(e.target.value))}
/>
</div>

<div>
<Label>Reject Product</Label>
<Input value={reject} readOnly/>
</div>

<div>
<Label>Quality Rate (%)</Label>
<Input value={quality} readOnly/>
</div>

<div className="col-span-3">
<Label>Remarks</Label>
<Textarea/>
</div>

</div>

<Button className="w-full mt-6">
Save Output
</Button>

</DialogContent>

</Dialog>

)
}