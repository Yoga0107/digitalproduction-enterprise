'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SecurityPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="p-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Security</h1>
          <p className="text-slate-600">
            Security settings and monitoring
          </p>
          <Badge variant="destructive">Admin Only</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SSO Configuration
              </CardTitle>
              <CardDescription>
                Single Sign-On settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">SSO Status</span>
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Provider</span>
                <span className="text-sm font-medium">Mock SSO</span>
              </div>
              <Button className="w-full">Configure SSO</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Access Control
              </CardTitle>
              <CardDescription>
                Role-based access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Roles</span>
                <span className="text-sm font-medium">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Protected Routes</span>
                <span className="text-sm font-medium">10</span>
              </div>
              <Button className="w-full">Manage Roles</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
            <CardDescription>
              Recent security events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">Multiple failed login attempts</p>
                  <p className="text-sm text-yellow-700">Detected from IP: 192.168.1.100</p>
                  <p className="text-xs text-yellow-600 mt-1">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">SSL certificate renewed</p>
                  <p className="text-sm text-slate-600">Certificate valid until 2025-01-19</p>
                  <p className="text-xs text-slate-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
