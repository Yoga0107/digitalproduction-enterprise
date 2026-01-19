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
import { useState } from 'react';
import Image from 'next/image';

export function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    if (!user) return null;

    const menuItems = getMenuItemsForRole(user.role);

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
            <div className="flex h-16 items-center justify-between border-b px-4">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                            <Image
                                src="/logo-master.png"
                                alt="Logo Master"
                                width={20}
                                height={20}
                                className="object-contain"
                            />
                        </div>

                        <div className="leading-tight">
                            <h1 className="text-sm font-semibold">
                                Digital Production Enterprise
                            </h1>
                            <p className="text-xs text-slate-500">
                                Enterprise Portal
                            </p>
                        </div>
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(collapsed && "mx-auto")}
                >
                    <ChevronLeft
                        className={cn(
                            "h-4 w-4 transition-transform",
                            collapsed && "rotate-180"
                        )}
                    />
                </Button>
            </div>

            <ScrollArea className="flex-1 px-3 py-4">
                <div className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-white hover:shadow-sm',
                                        isActive
                                            ? 'bg-white text-blue-600 shadow-sm font-medium'
                                            : 'text-slate-700 hover:text-slate-900'
                                    )}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && (
                                        <div className="flex-1 truncate">
                                            <div>{item.title}</div>
                                            {item.description && (
                                                <div className="text-xs text-slate-500 truncate">
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="border-t p-4">
                <div
                    className={cn(
                        'flex items-center gap-3',
                        collapsed && 'flex-col gap-2'
                    )}
                >
                    {!collapsed ? (
                        <>
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-600 text-white">
                                    {user.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={getRoleBadgeVariant(user.role)}
                                        className="text-xs"
                                    >
                                        {user.role}
                                    </Badge>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={logout}
                                className="flex-shrink-0"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-600 text-white text-xs">
                                    {user.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={logout}
                                className="h-8 w-8"
                            >
                                <LogOut className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
