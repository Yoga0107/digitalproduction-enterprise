'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const notifications = [
    { id: 1, title: 'New user registered', time: '5 minutes ago', read: false, type: 'info' },
    { id: 2, title: 'Project milestone completed', time: '1 hour ago', read: false, type: 'success' },
    { id: 3, title: 'System maintenance scheduled', time: '3 hours ago', read: true, type: 'warning' },
    { id: 4, title: 'New message received', time: '1 day ago', read: true, type: 'info' },
  ];

  return (
    <ProtectedRoute>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-slate-600">
              Stay updated with system notifications
            </p>
          </div>
          <Button variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              {notifications.filter(n => !n.read).length} unread notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <Bell className={`h-5 w-5 mt-0.5 ${!notification.read ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="flex-1 space-y-1">
                    <p className={`font-medium ${!notification.read ? 'text-blue-900' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-slate-600">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <Badge variant="default" className="bg-blue-600">New</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
