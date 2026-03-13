'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getMenuItemsForRole } from '@/lib/route-config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, ChevronLeft } from 'lucide-react';
import Image from 'next/image';

type Props = {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}

export function Sidebar({ collapsed, setCollapsed }: Props) {

  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const menuItems = getMenuItemsForRole(user.role);

  const initials = user.full_name
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-slate-50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >

      {/* HEADER */}

      <div className="flex h-16 items-center justify-between border-b px-4">

        {!collapsed && (
          <div className="flex items-center gap-3">
            <Image src="/logo-master.png" alt="Logo" width={28} height={28} />
            <div>
              <h1 className="text-sm font-semibold">Digital Production</h1>
              <p className="text-xs text-slate-500">Enterprise Portal</p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </Button>

      </div>


      {/* MENU */}

      <ScrollArea className="flex-1 px-3 py-4">

        {menuItems.map((item) => {

          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (

            <Link key={item.href} href={item.href}>

              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-white text-blue-600 shadow font-medium'
                    : 'text-slate-700 hover:bg-white'
                )}
              >

                <Icon className="h-5 w-5 shrink-0" />

                {!collapsed && (
                  <span className="truncate">{item.title}</span>
                )}

              </div>

            </Link>

          );
        })}

      </ScrollArea>


      {/* USER */}

      <div className="border-t p-4 flex items-center gap-3">

        <Avatar>
          <AvatarFallback className="bg-blue-600 text-white">
            {initials}
          </AvatarFallback>
        </Avatar>

        {!collapsed && (
          <div className="flex-1">
            <p className="text-sm font-medium truncate">
              {user.full_name}
            </p>
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {user.role}
            </Badge>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
        </Button>

      </div>

    </div>
  );
}