'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, FileText, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Users',
      value: '2,543',
      change: '+12.5%',
      icon: Users,
      visible: ['admin', 'manager'],
    },
    {
      title: 'Active Projects',
      value: '48',
      change: '+4.3%',
      icon: FileText,
      visible: ['admin', 'manager', 'user'],
    },
    {
      title: 'Revenue',
      value: '$24,563',
      change: '+18.2%',
      icon: TrendingUp,
      visible: ['admin', 'manager'],
    },
    {
      title: 'Reports',
      value: '127',
      change: '+7.1%',
      icon: BarChart3,
      visible: ['admin', 'manager', 'user'],
    },
  ];

  const visibleStats = stats.filter((stat) =>
    stat.visible.includes(user?.role || 'viewer')
  );

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-600">
          Selamat datang kembali, {user?.name}!
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm py-1 px-3">
          Role: {user?.role}
        </Badge>
        <Badge variant="secondary" className="text-sm py-1 px-3">
          {user?.email}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 mt-1">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Akses Menu Berdasarkan Role</CardTitle>
            <CardDescription>
              Sidebar akan menampilkan menu sesuai dengan role Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Role Anda:</span>
                <Badge>{user?.role}</Badge>
              </div>
              <div className="text-sm text-slate-600">
                Menu yang terlihat di sidebar sudah difilter berdasarkan
                permission role Anda. Setiap role memiliki akses yang berbeda.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Info</CardTitle>
            <CardDescription>
              Informasi sistem dan akses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">User ID:</span>
              <span className="font-medium">{user?.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Access Level:</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Perbedaan akses untuk setiap role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="destructive">Admin</Badge>
              <p className="text-sm text-slate-600 flex-1">
                Akses penuh ke semua menu termasuk Database dan Security
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default">Manager</Badge>
              <p className="text-sm text-slate-600 flex-1">
                Akses ke Users, Reports, Analytics, dan Projects
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary">User</Badge>
              <p className="text-sm text-slate-600 flex-1">
                Akses ke Dashboard, Reports, Projects, dan Settings
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">Viewer</Badge>
              <p className="text-sm text-slate-600 flex-1">
                Akses read-only ke Dashboard, Calendar, dan Notifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
