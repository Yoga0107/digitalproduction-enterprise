'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Factory, Check } from 'lucide-react'
import { ApiUser, ApiPlant } from '@/types/api'
import { cn } from '@/lib/utils'

type Props = {
  open:     boolean
  user:     ApiUser
  plants:   ApiPlant[]
  isSaving: boolean
  onSave:  (plantIds: number[]) => void
  onClose: () => void
}

export function UserPlantDialog({ open, user, plants, isSaving, onSave, onClose }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set(user.plant_ids))

  // Sync when user changes
  useEffect(() => {
    setSelected(new Set(user.plant_ids))
  }, [user])

  function toggle(plantId: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(plantId)) next.delete(plantId)
      else next.add(plantId)
      return next
    })
  }

  function handleSelectAll() {
    setSelected(new Set(plants.map(p => p.id)))
  }

  function handleClearAll() {
    setSelected(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-emerald-600" />
            Plant Access — {user.full_name ?? user.username}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Current role reminder */}
          <p className="text-xs text-muted-foreground">
            Role: <span className="font-medium text-foreground">{user.role.name}</span>
            {' · '}Select which plants this user can access.
          </p>

          {/* Select / clear all */}
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" className="text-xs h-7"
              onClick={handleSelectAll}
              disabled={selected.size === plants.length}
            >
              Select All
            </Button>
            <Button
              variant="outline" size="sm" className="text-xs h-7"
              onClick={handleClearAll}
              disabled={selected.size === 0}
            >
              Clear All
            </Button>
            <span className="ml-auto text-xs text-muted-foreground self-center">
              {selected.size} / {plants.length} selected
            </span>
          </div>

          {/* Plant list */}
          {plants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No active plants registered.
            </p>
          ) : (
            <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
              {plants.map(p => {
                const isSelected = selected.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all',
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    )}>
                      <Factory className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.code}</p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(Array.from(selected))}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
