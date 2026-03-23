'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getMenuItemsForRole, MenuItem } from '@/lib/route-config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  LogOut, ChevronLeft, Factory, ChevronDown, Check,
  ArrowLeftRight, Loader2, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { ROLE_LABELS } from '@/lib/role-map';
import { usePlantSwitch } from '@/hooks/use-plant-switch';

// ─── Expandable OEE-style menu item ──────────────────────────────────────────
function ExpandableMenuItem({
  item, collapsed, pathname,
}: { item: MenuItem; collapsed: boolean; pathname: string }) {
  const Icon = item.icon;
  const isParentActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const [open, setOpen] = useState(isParentActive);

  const children = item.children ?? [];

  // Build ordered groups
  const groupOrder: string[] = [];
  const groupMap: Record<string, typeof children> = {};
  for (const child of children) {
    const g = child.group ?? '';
    if (!groupMap[g]) { groupMap[g] = []; groupOrder.push(g); }
    groupMap[g].push(child);
  }

  if (collapsed) {
    return (
      <Link href={item.href} title={item.title}>
        <div className={cn(
          'flex items-center justify-center rounded-lg p-2 mb-0.5 transition-colors',
          isParentActive ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900',
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors mb-0.5',
          isParentActive
            ? 'bg-white text-blue-600 shadow-sm font-medium'
            : 'text-slate-600 hover:bg-white hover:text-slate-900',
        )}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        <span className="flex-1 text-left truncate">{item.title}</span>
        <ChevronDown className={cn(
          'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200',
          open && 'rotate-180',
        )} />
      </button>

      {open && (
        <div className="mb-1 ml-3 pl-3 border-l-2 border-slate-200">
          {groupOrder.map(label => (
            <div key={label}>
              {label && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-2 pt-2 pb-0.5 select-none">
                  {label}
                </p>
              )}
              {groupMap[label].map(child => {
                const isActive = pathname === child.href;
                return (
                  <Link key={child.href} href={child.href}>
                    <div className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}>
                      <ChevronRight className={cn(
                        'h-3 w-3 shrink-0 transition-colors',
                        isActive ? 'text-blue-200' : 'text-slate-300',
                      )} />
                      <span className="truncate">{child.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Simple menu item ─────────────────────────────────────────────────────────
function SimpleMenuItem({
  item, collapsed, pathname,
}: { item: MenuItem; collapsed: boolean; pathname: string }) {
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  return (
    <Link href={item.href} title={item.title}>
      <div className={cn(
        'flex items-center rounded-lg px-3 py-2 text-sm transition-colors mb-0.5',
        isActive ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-slate-600 hover:bg-white hover:text-slate-900',
        collapsed ? 'justify-center px-2' : 'gap-2.5',
      )}>
        <Icon className="h-4.5 w-4.5 shrink-0" />
        {!collapsed && <span className="truncate">{item.title}</span>}
      </div>
    </Link>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export function Sidebar() {
  const { user, logout, activePlant, accessiblePlants } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { switchPlant, isSwitching } = usePlantSwitch();

  if (!user) return null;

  const menuItems = getMenuItemsForRole(user.role);
  const initials = (user.full_name || user.username || 'U')
    .split(' ').map((n: string) => n[0] ?? '').join('').toUpperCase().slice(0, 2);

  const roleBadgeVariant = (role: string) => {
    if (role === 'admin')   return 'destructive' as const;
    if (role === 'manager') return 'default' as const;
    if (role === 'user')    return 'secondary' as const;
    return 'outline' as const;
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try { await logout(); router.replace('/login'); }
    finally { setIsLoggingOut(false); setShowLogoutDialog(false); }
  };

  return (
    <>
      {/*
        KEY LAYOUT:
        - sidebar is `flex flex-col` with explicit height controlled by parent (h-screen on wrapper)
        - logo + plant sections are fixed height (shrink-0)
        - menu area is `flex-1 min-h-0 overflow-y-auto` — this is the critical fix:
            flex-1 takes remaining space, min-h-0 allows shrinking below content size,
            overflow-y-auto enables the scroll ONLY in the menu area
        - user section is fixed at bottom (shrink-0)
      */}
      <div className={cn(
        'flex flex-col border-r border-slate-200 bg-slate-50 transition-[width] duration-200 ease-in-out',
        // Height is controlled by parent `h-screen overflow-hidden` in layout.tsx
        // We do NOT set h-screen here to avoid double height constraints
        collapsed ? 'w-16' : 'w-64',
      )}>

        {/* ── Logo / collapse toggle — fixed height ── */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <Image src="/logo-master.png" alt="Logo" width={26} height={26} className="shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xs font-bold leading-tight truncate">Digital Production</h1>
                <p className="text-[10px] text-slate-400 truncate">Enterprise Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* ── Active Plant Switcher — fixed height ── */}
        {activePlant && (
          <div className={cn('border-b border-slate-200 shrink-0', collapsed ? 'px-2 py-2' : 'px-3 py-2')}>
            {collapsed ? (
              <button onClick={() => router.push('/select-plant')} title={activePlant.name}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 mx-auto transition-colors">
                {isSwitching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Factory className="h-3.5 w-3.5" />}
              </button>
            ) : accessiblePlants.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button disabled={isSwitching}
                    className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors text-left">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                      {isSwitching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Factory className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{activePlant.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{activePlant.code}</p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Ganti Plant</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accessiblePlants.map(plant => (
                    <DropdownMenuItem key={plant.id} onClick={() => switchPlant(plant)} disabled={isSwitching}
                      className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Factory className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{plant.name}</p>
                          <p className="text-xs text-muted-foreground">{plant.code}</p>
                        </div>
                      </div>
                      {activePlant.id === plant.id && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/select-plant')} className="cursor-pointer text-xs text-muted-foreground">
                    <ArrowLeftRight className="mr-2 h-3 w-3" /> Lihat semua plant
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                  <Factory className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">{activePlant.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{activePlant.code}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Menu Area — SCROLLABLE, fills all remaining space ── */}
        {/*
          CRITICAL: flex-1 + min-h-0 + overflow-y-auto
          - flex-1: take all remaining vertical space
          - min-h-0: override default min-height:auto so flex children can shrink
          - overflow-y-auto: scroll ONLY this section, not the whole sidebar
        */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {menuItems.map(item =>
            item.children && item.children.length > 0 ? (
              <ExpandableMenuItem key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
            ) : (
              <SimpleMenuItem key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
            )
          )}
        </div>

        {/* ── User info — fixed at bottom ── */}
        <div className="border-t border-slate-200 shrink-0 p-3">
          <div className={cn('flex items-center gap-2', collapsed && 'flex-col gap-1.5')}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">{user.full_name}</p>
                <Badge variant={roleBadgeVariant(user.role)} className="text-[10px] mt-0.5 h-4 px-1.5">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            )}
            <button
              onClick={() => setShowLogoutDialog(true)}
              title="Logout"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin keluar dari akun <span className="font-semibold">{user.full_name}</span>?
              Sesi Anda akan diakhiri dan perlu login kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm} disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              {isLoggingOut
                ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Keluar…</span>
                : <span className="flex items-center gap-2"><LogOut className="h-4 w-4" /> Ya, Logout</span>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
