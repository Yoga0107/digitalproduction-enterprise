import { UserRole } from './auth-context';
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
    description: 'Overview and statistics',
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    roles: ['admin', 'manager'],
    description: 'Manage users',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
    roles: ['admin', 'manager', 'user'],
    description: 'View and generate reports',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['admin', 'manager'],
    description: 'Data analytics and insights',
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderOpen,
    roles: ['admin', 'manager', 'user'],
    description: 'Manage projects',
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    roles: ['admin', 'manager', 'user', 'viewer'],
    description: 'Schedule and events',
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['admin', 'manager', 'user', 'viewer'],
    description: 'System notifications',
  },
  {
    title: 'Database',
    href: '/database',
    icon: Database,
    roles: ['admin'],
    description: 'Database management',
  },
  {
    title: 'Security',
    href: '/security',
    icon: Shield,
    roles: ['admin'],
    description: 'Security settings',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'manager', 'user'],
    description: 'Application settings',
  },
    {
    title: 'Forecast Accuracy',
    href: '/forecast-accuracy/plant_performance_detail',
    icon: Settings,
    roles: ['admin', 'manager', 'user'],
    description: 'Application settings',
  }
];

export function getMenuItemsForRole(role: UserRole): MenuItem[] {
  return menuItems.filter((item) => item.roles.includes(role));
}
