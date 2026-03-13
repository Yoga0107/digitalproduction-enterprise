"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

import { MachineLoss } from "@/app/oee/master/machine-losses/page"
import { MachineLossInlineInput } from "./machine-loss-inline-input"

type Props = {
  node: MachineLoss
  data: MachineLoss[]
  setData: React.Dispatch<React.SetStateAction<MachineLoss[]>>
}

export function MachineLossNode({
  node,
  data,
  setData
}: Props) {

  const { toast } = useToast()

  const [expanded,setExpanded] = useState(true)
  const [editing,setEditing] = useState(false)

  const children = data
    .filter(i=>i.parentId===node.id)
    .sort((a,b)=>a.order-b.order)

  function deleteNode(){

    const hasChild = data.some(i=>i.parentId===node.id)

    if(hasChild){

      toast({
        title: "Cannot delete",
        description: "Node still has child items",
        variant: "destructive"
      })

      return
    }

    setData(prev=>prev.filter(i=>i.id!==node.id))

  }

  function addChild(){

    if(node.level === 3){

      toast({
        title: "Maximum Level",
        description: "Level 3 is the deepest level",
        variant: "destructive"
      })

      return
    }

    const newNode:MachineLoss = {

      id:crypto.randomUUID(),
      name:"New Loss",
      parentId:node.id,
      level:(node.level+1) as 2|3,
      order:children.length+1
    }

    setData(prev=>[...prev,newNode])

  }

  return (

    <>

    <tr className="border-b">

      <td
        className="p-2 flex items-center gap-2"
        style={{paddingLeft:node.level*20}}
      >

        {children.length>0 && (

          <button
            onClick={()=>setExpanded(!expanded)}
            className="text-xs"
          >
            {expanded ? "▼" : "▶"}
          </button>

        )}

        {editing ? (

          <MachineLossInlineInput
            value={node.name}
            onSave={(value)=>{

              setData(prev =>
                prev.map(i =>
                  i.id === node.id
                  ? {...i,name:value}
                  : i
                )
              )

              setEditing(false)

            }}
          />

        ) : (

          <span
            onDoubleClick={()=>setEditing(true)}
            className="cursor-pointer"
          >
            {node.name}
          </span>

        )}

      </td>

      <td className="p-2">

        <div className="flex gap-2 justify-center">

          <Button
            size="sm"
            variant="outline"
            onClick={addChild}
            disabled={node.level===3}
          >
            Add
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={()=>setEditing(true)}
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={deleteNode}
          >
            Delete
          </Button>

        </div>

      </td>

    </tr>

    {expanded && children.map(child => (

      <MachineLossNode
        key={child.id}
        node={child}
        data={data}
        setData={setData}
      />

    ))}

    </>

  )
}