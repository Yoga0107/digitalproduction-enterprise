"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

type Props={
  value:string
  onSave:(value:string)=>void
}

export function MachineLossInlineInput({
  value,
  onSave
}:Props){

  const [text,setText] = useState(value)

  return (

    <Input
      autoFocus
      value={text}
      onChange={e=>setText(e.target.value)}
      onBlur={()=>onSave(text)}
      onKeyDown={(e)=>{

        if(e.key==="Enter"){
          onSave(text)
        }

      }}
      className="h-7 w-56"
    />

  )
}