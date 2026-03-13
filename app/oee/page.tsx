'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
  Database,
  BarChart3,
  Factory,
  Activity,
  Settings,
  Layers,
  Timer,
  Package,
  Workflow
} from 'lucide-react';

export default function OEEPage() {
  return (
    <ProtectedRoute>
      <div className="p-8 space-y-8">

        {/* HEADER */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">OEE Module</h1>
          <p className="text-slate-600">
            Manage OEE inputs and view machine performance data
          </p>
        </div>

        {/* MASTER DATA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Master Data
            </CardTitle>
            <CardDescription>
              Configure master data used in the OEE system
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <Button asChild variant="outline" className="w-full h-20 justify-start">
              <Link href="/oee/master/shift">
                <Timer className="mr-3 h-5 w-5" />
                Master Shift
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full h-20 justify-start">
              <Link href="/oee/master/standard-throughput">
                <Activity className="mr-3 h-5 w-5" />
                Master Standard Throughput
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full h-20 justify-start">
              <Link href="/oee/master/kode-pakan">
                <Package className="mr-3 h-5 w-5" />
                Master Kode Pakan
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full h-20 justify-start">
              <Link href="/oee/master/line">
                <Factory className="mr-3 h-5 w-5" />
                Master Line
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full h-20 justify-start">
              <Link href="/oee/master/machine-losses">
                <Workflow className="mr-3 h-5 w-5" />
                Master Machine Losses
              </Link>
            </Button>

          </CardContent>
        </Card>

        {/* INPUT SECTION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Input Data
            </CardTitle>
            <CardDescription>
              Input machine operational data
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Button asChild variant="outline" className="w-full h-20 justify-start">
              <Link href="/oee/input/machine-losses">
                <Factory className="mr-3 h-5 w-5" />
                Machine Losses
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full h-20 justify-start">
              <Link href="/oee/input/output">
                <Activity className="mr-3 h-5 w-5" />
                Output
              </Link>
            </Button>

          </CardContent>
        </Card>

        {/* DATA VIEW */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Data View
            </CardTitle>
            <CardDescription>
              View calculated OEE metrics and reports
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Button asChild variant="outline">
              <Link href="/oee/view/oee">OEE</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/oee/view/availability-rate">AR</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/oee/view/performance-rate">PR</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/oee/view/quality-rate">QR</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/oee/view/summary">Summary</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/oee/view/operating-time">Operating Time</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/oee/view/loading-time">Loading Time</Link>
            </Button>

          </CardContent>
        </Card>

      </div>
    </ProtectedRoute>
  );
}