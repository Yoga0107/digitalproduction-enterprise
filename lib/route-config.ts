import { UserRole } from './role-map';
import {
  LayoutDashboard, Users, Settings, FileText, BarChart3,
  Shield, Database, Bell, FolderOpen, GaugeCircle,
  Timer, Factory, Package, Activity, Workflow,
  LineChart, BarChart2, TrendingUp, Clock, Gauge,
} from 'lucide-react';
import {
  OEE_MASTER_ROLES, OEE_INPUT_ROLES, OEE_VIEW_ROLES,
} from './oee-access';

export interface SubMenuItem {
  title: string;
  href: string;
  roles: UserRole[];
  group?: string; // label group di sidebar
}

export interface MenuItem {
  title: string;
  href: string;
  icon: any;
  roles: UserRole[];
  description?: string;
  children?: SubMenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'user', 'viewer'],
  },

  // ── OEE ──────────────────────────────────────────────────────────────────
  {
    title: 'OEE',
    href: '/oee',
    icon: GaugeCircle,
    roles: OEE_VIEW_ROLES, // tampil untuk semua yang punya akses view
    children: [
      // Overview
      { title: 'Overview',               href: '/oee',                             roles: OEE_VIEW_ROLES,   group: '' },

      // Master Data — hanya admin & manager
      { title: 'Master Shift',           href: '/oee/master/shift',                roles: OEE_MASTER_ROLES, group: 'Master Data' },
      { title: 'Master Line',            href: '/oee/master/line',                 roles: OEE_MASTER_ROLES, group: 'Master Data' },
      { title: 'Kode Pakan',             href: '/oee/master/kode-pakan',           roles: OEE_MASTER_ROLES, group: 'Master Data' },
      { title: 'Standard Throughput',    href: '/oee/master/standard-throughput',  roles: OEE_MASTER_ROLES, group: 'Master Data' },
      { title: 'Machine Losses',         href: '/oee/master/machine-losses',       roles: OEE_MASTER_ROLES, group: 'Master Data' },
      { title: 'Line Groups',            href: '/oee/master/line-groups',          roles: OEE_MASTER_ROLES, group: 'Master Data' },

      // Input Data — admin, manager, operator
      { title: 'Input Output',           href: '/oee/input/output',                roles: OEE_INPUT_ROLES,  group: 'Input Data' },
      { title: 'Input Machine Loss',     href: '/oee/input/machine-losses',        roles: OEE_INPUT_ROLES,  group: 'Input Data' },

      // View Data — semua role
      { title: 'Loading Time',           href: '/oee/view/loading-time',           roles: OEE_VIEW_ROLES,   group: 'Data View' },
      { title: 'Operating Time',         href: '/oee/view/operating-time',         roles: OEE_VIEW_ROLES,   group: 'Data View' },
      { title: 'Availability Rate',      href: '/oee/view/availability-rate',      roles: OEE_VIEW_ROLES,   group: 'Data View' },
      { title: 'Performance Rate',       href: '/oee/view/performance-rate',       roles: OEE_VIEW_ROLES,   group: 'Data View' },
      { title: 'Quality Rate',           href: '/oee/view/quality-rate',           roles: OEE_VIEW_ROLES,   group: 'Data View' },
      { title: 'Summary OEE',            href: '/oee/view/summary',                roles: OEE_VIEW_ROLES,   group: 'Data View' },
    ],
  },

  // ── Apps ──────────────────────────────────────────────────────────────────
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderOpen,
    roles: ['admin', 'manager', 'user'],
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['admin', 'manager', 'user', 'viewer'],
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
  return menuItems
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children?.filter((c) => c.roles.includes(role)),
    }));
}
