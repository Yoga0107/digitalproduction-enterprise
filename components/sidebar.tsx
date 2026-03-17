'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getMenuItemsForRole } from '@/lib/route-config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, ChevronLeft, Factory, ChevronDown, Check, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { ROLE_LABELS } from '@/lib/role-map';

export function Sidebar() {
  const { user, logout, activePlant, accessiblePlants, selectPlant } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const menuItems = getMenuItemsForRole(user.role);
  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'destructive';
    if (role === 'manager') return 'default';
    if (role === 'user') return 'secondary';
    return 'outline';
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleSwitchPlant = () => {
    router.push('/select-plant');
  };

  return (
    <div className={cn(
      'flex h-screen flex-col border-r bg-slate-50 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>

      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Image src="/logo-master.png" alt="Logo" width={28} height={28} />
            <div>
              <h1 className="text-sm font-semibold leading-tight">Digital Production</h1>
              <p className="text-xs text-slate-500">Enterprise Portal</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* ── Plant Aktif ───────────────────────────────────────── */}
      {activePlant && (
        <div className={cn('border-b px-3 py-2', collapsed && 'px-2')}>
          {collapsed ? (
            <button
              onClick={handleSwitchPlant}
              title={activePlant.name}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 mx-auto"
            >
              <Factory className="h-4 w-4" />
            </button>
          ) : accessiblePlants.length > 1 ? (
            /* Dropdown switch plant jika punya akses > 1 plant */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-100 transition-colors">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-blue-600 text-white">
                    <Factory className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{activePlant.name}</p>
                    <p className="text-xs text-muted-foreground">{activePlant.code}</p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Ganti Plant</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {accessiblePlants.map((plant) => (
                  <DropdownMenuItem
                    key={plant.id}
                    onClick={() => { selectPlant(plant); router.refresh(); }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{plant.name}</p>
                        <p className="text-xs text-muted-foreground">{plant.code}</p>
                      </div>
                    </div>
                    {activePlant.id === plant.id && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSwitchPlant} className="cursor-pointer text-xs text-muted-foreground">
                  <ArrowLeftRight className="mr-2 h-3 w-3" />
                  Lihat semua plant
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Hanya 1 plant → tampilkan saja */
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-blue-600 text-white">
                <Factory className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{activePlant.name}</p>
                <p className="text-xs text-muted-foreground">{activePlant.code}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Menu Items ────────────────────────────────────────── */}
      <ScrollArea className="flex-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm mb-1',
                isActive
                  ? 'bg-white text-blue-600 shadow font-medium'
                  : 'text-slate-700 hover:bg-white'
              )}>
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </div>
            </Link>
          );
        })}
      </ScrollArea>

      {/* ── User Info ─────────────────────────────────────────── */}
      <div className="border-t p-3 flex items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-blue-600 text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.full_name}</p>
            <Badge variant={roleBadgeVariant(user.role)} className="text-xs mt-0.5">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
