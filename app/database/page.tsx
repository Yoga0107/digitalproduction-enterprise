'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Server, HardDrive } from 'lucide-react';

export default function DatabasePage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="p-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Database</h1>
          <p className="text-slate-600">
            Database management and monitoring
          </p>
          <Badge variant="destructive">Admin Only</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
              <Database className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45,231</div>
              <p className="text-xs text-slate-600 mt-1">
                Across all tables
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Storage Used
              </CardTitle>
              <HardDrive className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.5 GB</div>
              <p className="text-xs text-slate-600 mt-1">
                78% of total capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Connections
              </CardTitle>
              <Server className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-green-600 mt-1">
                All connections healthy
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>
              Overview of all database tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['users', 'projects', 'reports', 'analytics', 'settings'].map((table) => (
                <div key={table} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-slate-600" />
                    <span className="font-medium capitalize">{table}</span>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
