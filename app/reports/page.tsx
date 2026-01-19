'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    { id: 1, name: 'Monthly Sales Report', date: '2024-01-15', type: 'Sales' },
    { id: 2, name: 'User Activity Report', date: '2024-01-14', type: 'Analytics' },
    { id: 3, name: 'Financial Summary', date: '2024-01-13', type: 'Finance' },
    { id: 4, name: 'Performance Metrics', date: '2024-01-12', type: 'Operations' },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin', 'manager', 'user']}>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-slate-600">
              View and download reports
            </p>
          </div>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>

        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {report.date}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Type:</span>
                  <span className="text-sm font-medium">{report.type}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
