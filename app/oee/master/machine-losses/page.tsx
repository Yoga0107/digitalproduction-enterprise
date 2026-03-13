"use client"

import { useState } from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MachineLossTree } from "@/components/oee/machine-loss-tree"



export type MachineLoss = {
  id: string
  name: string
  parentId: string | null
  level: 1 | 2 | 3
  order: number
}

export default function MachineLossPage() {

const [data, setData] = useState<MachineLoss[]>([
  { id: "1", name: "Scheduled Downtime", parentId: null, level: 1, order: 1 },

  { id: "2", name: "Holiday", parentId: "1", level: 2, order: 1 },
  { id: "3", name: "Trial", parentId: "1", level: 2, order: 2 },

  { id: "4", name: "National Holiday", parentId: "2", level: 3, order: 1 },

  { id: "5", name: "Breakdown", parentId: null, level: 1, order: 2 },
])

  return (

    <ProtectedRoute>

      <div className="p-8 space-y-8">

        <h1 className="text-3xl font-bold">
          Master Machine Losses
        </h1>

        <Card>

          <CardHeader>
            <CardTitle>Machine Loss Hierarchy</CardTitle>
          </CardHeader>

          <CardContent>

            <MachineLossTree
              data={data}
              setData={setData}
            />

          </CardContent>

        </Card>

      </div>

    </ProtectedRoute>
  )
}