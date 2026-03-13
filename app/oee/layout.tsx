'use client'

import { useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { Sidebar } from "@/components/oee/sidebar"

export default function OeeLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [collapsed, setCollapsed] = useState(false)

  return (

    <div className="flex h-screen overflow-hidden">

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="flex-1 overflow-y-auto bg-muted/30 transition-all duration-300">

        <div className="p-6 min-h-full">
          {children}
        </div>

      </main>

      <Toaster />

    </div>

  )
}