'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, LayoutDashboard, GaugeCircle, Users, Factory, Settings, Info, RefreshCw, Wrench, BarChart2 } from 'lucide-react'
import { ApiUser } from '@/types/api'
import { getUserModules, setUserModules } from '@/services/userService'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'

// ─── Module definitions ───────────────────────────────────────────────────────

interface ModuleDef {
  key: string
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const ALL_MODULES: ModuleDef[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Halaman ringkasan & overview',
    icon: LayoutDashboard,
    color: 'text-blue-600',
  },
  {
    key: 'oee',
    label: 'OEE',
    description: 'Master data, input, dan laporan OEE',
    icon: GaugeCircle,
    color: 'text-emerald-600',
  },
  {
    key: 'scm-turnover',
    label: 'Turnover Dashboard',
    description: 'Dashboard SCM Turnover',
    icon: BarChart2,
    color: 'text-cyan-600',
  },
  {
    key: 'equipment',
    label: 'Equipment',
    description: 'Manajemen data & pohon peralatan',
    icon: Wrench,
    color: 'text-orange-600',
  },
  {
    key: 'users',
    label: 'Users',
    description: 'Manajemen user & akses',
    icon: Users,
    color: 'text-violet-600',
  },
  {
    key: 'plants',
    label: 'Plants',
    description: 'Manajemen plant & schema',
    icon: Factory,
    color: 'text-amber-600',
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Pengaturan aplikasi',
    icon: Settings,
    color: 'text-slate-600',
  },
]

// ─── Role default modules (for display reference only) ────────────────────────

const ROLE_DEFAULT_MODULES: Record<string, string[]> = {
  administrator: ['dashboard', 'oee', 'scm-turnover', 'equipment', 'users', 'plants', 'settings'],
  plant_manager: ['dashboard', 'oee', 'scm-turnover', 'equipment', 'settings'],
  operator:      ['dashboard', 'oee', 'settings'],
  viewer:        ['dashboard', 'oee'],
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open:    boolean
  user:    ApiUser | null
  onSaved: (userId: number, modules: string[]) => void
  onClose: () => void
}

export function UserModuleDialog({ open, user, onSaved, onClose }: Props) {
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [useDefault, setUseDefault]   = useState(true)   // true = pakai role default
  const [isLoading, setIsLoading]     = useState(false)
  const [isSaving, setIsSaving]       = useState(false)

  // ── Load current permissions when dialog opens ────────────────────────────
  useEffect(() => {
    if (!open || !user) return
    setIsLoading(true)
    getUserModules(user.id)
      .then(data => {
        if (data.use_role_default) {
          setUseDefault(true)
          // Pre-select role defaults as visual reference
          const defaults = ROLE_DEFAULT_MODULES[user.role.name] ?? []
          setSelected(new Set(defaults))
        } else {
          setUseDefault(false)
          setSelected(new Set(data.modules))
        }
      })
      .catch(() => {
        toast.error('Gagal memuat module permissions')
        onClose()
      })
      .finally(() => setIsLoading(false))
  }, [open, user]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleModule(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function handleResetToDefault() {
    const defaults = ROLE_DEFAULT_MODULES[user?.role.name ?? ''] ?? []
    setSelected(new Set(defaults))
    setUseDefault(true)
  }

  async function handleSave() {
    if (!user) return
    setIsSaving(true)
    try {
      // useDefault = true → send empty array → backend sets use_role_default = true
      const modules = useDefault ? [] : Array.from(selected)
      const result = await setUserModules(user.id, modules)
      toast.success(
        useDefault
          ? `Module ${user.full_name} direset ke default role`
          : `Module ${user.full_name} berhasil diperbarui`
      )
      onSaved(user.id, result.modules)
      onClose()
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail)
      else toast.error('Gagal menyimpan module permissions')
    } finally {
      setIsSaving(false)
    }
  }

  const roleDefaults = ROLE_DEFAULT_MODULES[user?.role.name ?? ''] ?? []

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-blue-600" />
            Atur Akses Module
          </DialogTitle>
          {user && (
            <p className="text-sm text-muted-foreground">
              User: <strong>{user.full_name ?? user.username}</strong>
              {' · '}
              <Badge variant="outline" className="text-xs ml-0.5">{user.role.name}</Badge>
            </p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4 py-1">

            {/* Use role default toggle */}
            <div
              className={`flex items-start gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-colors ${
                useDefault
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
              onClick={() => {
                setUseDefault(true)
                setSelected(new Set(roleDefaults))
              }}
            >
              <Checkbox
                checked={useDefault}
                onCheckedChange={(v) => {
                  setUseDefault(!!v)
                  if (v) setSelected(new Set(roleDefaults))
                }}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">Gunakan default role</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Menu akan mengikuti hak akses role <strong>{user?.role.name}</strong> secara otomatis.
                  Berlaku juga untuk perubahan role di masa depan.
                </p>
              </div>
            </div>

            {/* Custom module selection */}
            <div
              className={`rounded-lg border-2 transition-colors ${
                !useDefault ? 'border-indigo-300' : 'border-slate-200'
              }`}
            >
              <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-t-lg ${
                  !useDefault ? 'bg-indigo-50' : 'bg-slate-50 hover:bg-slate-100'
                }`}
                onClick={() => setUseDefault(false)}
              >
                <Checkbox
                  checked={!useDefault}
                  onCheckedChange={(v) => setUseDefault(!v)}
                  className="mt-0"
                />
                <p className="text-sm font-semibold text-slate-800">Atur module secara manual</p>
              </div>

              {!useDefault && (
                <div className="px-4 pb-4 pt-2 space-y-2 border-t border-indigo-100">
                  <p className="text-xs text-muted-foreground mb-3">
                    Centang module yang boleh diakses user ini di sidebar:
                  </p>
                  {ALL_MODULES.map(mod => {
                    const Icon = mod.icon
                    const isChecked = selected.has(mod.key)
                    const isRoleDefault = roleDefaults.includes(mod.key)
                    return (
                      <Label
                        key={mod.key}
                        htmlFor={`mod-${mod.key}`}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Checkbox
                          id={`mod-${mod.key}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleModule(mod.key)}
                        />
                        <Icon className={`h-4 w-4 shrink-0 ${mod.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{mod.label}</p>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </div>
                        {isRoleDefault && (
                          <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200 shrink-0">
                            default role
                          </Badge>
                        )}
                      </Label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Perubahan berlaku saat user <strong>login ulang</strong> atau me-refresh halaman.
                Sub-menu OEE (Master Data, Input) tetap dikontrol oleh role.
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!useDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              disabled={isSaving}
              className="mr-auto text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Reset ke Default
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}