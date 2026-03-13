'use client'

import { ProtectedRoute } from "@/components/protected-route"

import {
Card,
CardContent,
CardHeader,
CardTitle
} from "@/components/ui/card"

import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow
} from "@/components/ui/table"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SummaryPage(){

return(

<ProtectedRoute>

<div className="p-8 space-y-6">

{/* HEADER */}

<h1 className="text-3xl font-bold">
OEE Summary
</h1>

{/* DATE FILTER */}

<Card>

<CardHeader>
<CardTitle>Date Range</CardTitle>
</CardHeader>

<CardContent className="flex gap-4">

<Input type="date"/>

<Input type="date"/>

<Button>
Apply
</Button>

</CardContent>

</Card>

{/* LINE SUMMARY */}

<Card>

<CardHeader>
<CardTitle>Line Summary</CardTitle>
</CardHeader>

<CardContent>

<Table>

<TableHeader>

<TableRow>
<TableHead>Line</TableHead>
<TableHead>Shift 1</TableHead>
<TableHead>Shift 2</TableHead>
<TableHead>Shift 3</TableHead>
<TableHead>Total</TableHead>
</TableRow>

</TableHeader>

<TableBody>

<TableRow>
<TableCell>Line 1 (Extruder Wenger 1)</TableCell>
<TableCell>248</TableCell>
<TableCell>248</TableCell>
<TableCell>248</TableCell>
<TableCell>744</TableCell>
</TableRow>

<TableRow>
<TableCell>Line 2 (Extruder Wenger 2)</TableCell>
<TableCell>248</TableCell>
<TableCell>248</TableCell>
<TableCell>248</TableCell>
<TableCell>744</TableCell>
</TableRow>

<TableRow>
<TableCell>Line 3 (Extruder Matador 1)</TableCell>
<TableCell>248</TableCell>
<TableCell>248</TableCell>
<TableCell>248</TableCell>
<TableCell>744</TableCell>
</TableRow>

<TableRow>
<TableCell>All Line</TableCell>
<TableCell>2232</TableCell>
<TableCell>2232</TableCell>
<TableCell>2232</TableCell>
<TableCell>6696</TableCell>
</TableRow>

</TableBody>

</Table>

</CardContent>

</Card>

{/* KPI */}

<div className="grid grid-cols-4 gap-4">

<Card>

<CardHeader>
<CardTitle>Availability</CardTitle>
</CardHeader>

<CardContent className="text-2xl font-bold">
99.35%
</CardContent>

</Card>

<Card>

<CardHeader>
<CardTitle>Performance</CardTitle>
</CardHeader>

<CardContent className="text-2xl font-bold">
94.38%
</CardContent>

</Card>

<Card>

<CardHeader>
<CardTitle>Quality</CardTitle>
</CardHeader>

<CardContent className="text-2xl font-bold">
100%
</CardContent>

</Card>

<Card>

<CardHeader>
<CardTitle>OEE</CardTitle>
</CardHeader>

<CardContent className="text-2xl font-bold">
93.77%
</CardContent>

</Card>

</div>

{/* TOP LOSSES */}

<Card>

<CardHeader>
<CardTitle>Top Losses</CardTitle>
</CardHeader>

<CardContent>

<ol className="list-decimal ml-6 space-y-2">

<li>Performance Loss</li>
<li>Failure Loss - Breakdown</li>
<li>Scheduled Downtime</li>

</ol>

</CardContent>

</Card>

</div>

</ProtectedRoute>

)

}