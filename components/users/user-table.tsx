'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Pencil, Factory, Power, PowerOff, ShieldCheck, KeyRound, AlertTriangle } from 'lucide-react'
import { ApiUser, ApiPlant } from '@/types/api'
import { cn } from '@/lib/utils'

const ROLE_STYLE: Record<string, string> = {
  administrator: 'bg-red-100 text-red-700 border-red-200',
  plant_manager: 'bg-blue-100 text-blue-700 border-blue-200',
  operator:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  viewer:        'bg-slate-100 text-slate-600 border-slate-200',
}

const ROLE_LABEL: Record<string, string> = {
  administrator: 'Administrator',
  plant_manager: 'Plant Manager',
  operator:      'Operator',
  viewer:        'Viewer',
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

type Props = {
  users:          ApiUser[]
  plants:         ApiPlant[]
  isLoading:      boolean
  isSuperuser:    boolean        // current logged-in user — controls reset password visibility
  onEdit:         (user: ApiUser) => void
  onToggleActive: (user: ApiUser) => void
  onManagePlants: (user: ApiUser) => void
  onResetPassword:(user: ApiUser) => void
}

export function UserTable({ users, plants, isLoading, isSuperuser, onEdit, onToggleActive, onManagePlants, onResetPassword }: Props) {
  const plantById = Object.fromEntries(plants.map(p => [p.id, p]))

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Semua User
            {!isLoading && (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                {users.length} total
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Akses Plant</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center w-40">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Belum ada user. Klik <strong>Tambah User</strong> untuk membuat.
                      </TableCell>
                    </TableRow>
                  ) : users.map(u => (
                    <TableRow key={u.id} className={cn(!u.is_active && 'opacity-50')}>
                      {/* User info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={cn(
                              'text-xs font-bold',
                              u.is_active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                            )}>
                              {initials(u.full_name ?? u.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium truncate">{u.full_name ?? '—'}</p>
                              {u.is_superuser && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500 shrink-0 cursor-default" />
                                  </TooltipTrigger>
                                  <TooltipContent>Superuser</TooltipContent>
                                </Tooltip>
                              )}
                              {u.must_change_password && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5 text-[10px] font-semibold cursor-default">
                                      <AlertTriangle className="h-2.5 w-2.5" />
                                      Ganti Password
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>User belum mengganti password sementara</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Username */}
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                          {u.username}
                        </code>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Badge variant="outline"
                          className={cn('text-xs', ROLE_STYLE[u.role.name] ?? 'bg-slate-100 text-slate-600')}>
                          {ROLE_LABEL[u.role.name] ?? u.role.name}
                        </Badge>
                      </TableCell>

                      {/* Plant access */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {u.plant_ids.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">Tidak ada akses</span>
                          ) : u.plant_ids.map(pid => {
                            const p = plantById[pid]
                            return p ? (
                              <Badge key={pid} variant="outline"
                                className="text-[10px] bg-emerald-50 border-emerald-200 text-emerald-700">
                                {p.code}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {u.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-slate-500">Nonaktif</Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex justify-center items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => onEdit(u)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit User</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => onManagePlants(u)}>
                                <Factory className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Kelola Akses Plant</TooltipContent>
                          </Tooltip>

                          {/* Reset password — superuser only, not self */}
                          {isSuperuser && !u.is_superuser && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm" variant="ghost"
                                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={() => onResetPassword(u)}
                                >
                                  <KeyRound className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reset Password</TooltipContent>
                            </Tooltip>
                          )}

                          {/* Activate / Deactivate */}
                          {!u.is_superuser && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost"
                                  className={cn(
                                    u.is_active
                                      ? 'text-destructive hover:text-destructive'
                                      : 'text-emerald-600 hover:text-emerald-700'
                                  )}
                                  onClick={() => onToggleActive(u)}
                                >
                                  {u.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
