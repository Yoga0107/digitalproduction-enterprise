import { UserRole } from './role-map';
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
  Shield,
  Database,
  Bell,
  Calendar,
  FolderOpen,
} from 'lucide-react';

export interface MenuItem {
  title: string;
  href: string;
  icon: any;
  roles: UserRole[];
  description?: string;
}

export const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'user', 'viewer'],
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
    roles: ['viewer'],
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['viewer'],
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderOpen,
    roles: ['user'],
  },
  {
    title: 'OEE',
    href: '/oee',
    icon: Calendar,
    roles: ['user', 'viewer'],
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    roles: ['user', 'viewer'],
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['user', 'viewer'],
  },
  {
    title: 'Database',
    href: '/database',
    icon: Database,
    roles: ['admin'],
  },
  {
    title: 'Security',
    href: '/security',
    icon: Shield,
    roles: ['admin'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'manager', 'user'],
  },
];

export function getMenuItemsForRole(role: UserRole): MenuItem[] {
  return menuItems.filter((item) => item.roles.includes(role));
}
