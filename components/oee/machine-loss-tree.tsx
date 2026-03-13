"use client"

import { useState } from "react"
import {
    DndContext,
    DragEndEvent,
    closestCenter
} from "@dnd-kit/core"


import { MachineLoss } from "@/app/oee/master/machine-losses/page"
import { MachineLossNode } from "./machine-loss-node"

type Props = {
    data: MachineLoss[]
    setData: React.Dispatch<React.SetStateAction<MachineLoss[]>>
}

export function MachineLossTree({ data, setData }: Props) {

    const roots = data
        .filter(i => i.parentId === null)
        .sort((a, b) => a.order - b.order)

    function handleDragEnd(event: DragEndEvent) {

        const { active, over } = event
        if (!over) return

        const dragged = data.find(i => i.id === active.id)
        const target = data.find(i => i.id === over.id)

        if (!dragged || !target) return

        if (target.level === 3) return

        const newLevel = (target.level + 1) as 2 | 3

        if (newLevel > 3) return

        setData(prev =>
            prev.map(item =>
                item.id === dragged.id
                    ? {
                        ...item,
                        parentId: target.id,
                        level: newLevel
                    }
                    : item
            )
        )

    }

    return (

        <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >

            <table className="w-full">

                <thead>
                    <tr className="border-b">
                        <th className="text-left p-2 w-[70%]">
                            Loss Name
                        </th>
                        <th className="text-center p-2 w-[30%]">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody>

                    {roots.map(root => (

                        <MachineLossNode
                            key={root.id}
                            node={root}
                            data={data}
                            setData={setData}
                        />

                    ))}

                </tbody>

            </table>

        </DndContext>
    )
}