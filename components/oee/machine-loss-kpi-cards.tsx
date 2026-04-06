'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, Timer, AlertTriangle, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtMinutes } from '@/lib/machine-loss-utils'

type Props = {
  totalEvents:  number
  /** Total duration in MINUTES */
  totalMinutes: number
  /** Average duration in MINUTES */
  avgMinutes:   number
  topLossType:  string
}

export function MachineLossKpiCards({ totalEvents, totalMinutes, avgMinutes, topLossType }: Props) {
  const cards = [
    { label: 'Total Events',   value: String(totalEvents),      icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Downtime', value: fmtMinutes(totalMinutes), icon: Clock,         color: 'text-red-600',    bg: 'bg-red-50'    },
    { label: 'Avg Duration',   value: fmtMinutes(avgMinutes),   icon: Timer,         color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Top Loss Type',  value: topLossType || '—',       icon: Wrench,        color: 'text-teal-600',   bg: 'bg-teal-50'   },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(k => (
        <Card key={k.label} className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', k.bg)}>
              <k.icon className={cn('h-5 w-5', k.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={cn('text-base font-bold truncate', k.color)}>{k.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
