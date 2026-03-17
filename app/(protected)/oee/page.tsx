'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { canAccessMaster, canAccessInput } from '@/lib/oee-access';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings, Database, BarChart3, Timer, Factory,
  Package, Activity, Workflow, LineChart, BarChart2,
  TrendingUp, Clock, Lock,
} from 'lucide-react';

function SectionCard({
  title, description, icon: Icon, links, locked, lockedMsg,
}: {
  title: string;
  description: string;
  icon: any;
  links: { href: string; label: string; icon: any }[];
  locked?: boolean;
  lockedMsg?: string;
}) {
  return (
    <Card className={locked ? 'opacity-60' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5" />
          {title}
          {locked && (
            <Badge variant="outline" className="ml-auto text-xs gap-1">
              <Lock className="h-3 w-3" /> {lockedMsg}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {links.map(({ href, label, icon: LinkIcon }) =>
          locked ? (
            <div key={href} className="flex items-center gap-2 h-10 px-3 rounded-md border text-sm text-muted-foreground cursor-not-allowed select-none">
              <Lock className="h-4 w-4 shrink-0" />
              {label}
            </div>
          ) : (
            <Button key={href} asChild variant="outline" className="justify-start h-10">
              <Link href={href}>
                <LinkIcon className="mr-2 h-4 w-4" />
                {label}
              </Link>
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}

export default function OEEPage() {
  const { user } = useAuth();
  const hasMaster = canAccessMaster(user?.role);
  const hasInput  = canAccessInput(user?.role);

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">OEE Module</h1>
        <p className="text-slate-500 text-sm">
          Overall Equipment Effectiveness — Plant {user?.role && (
            <Badge variant="secondary" className="text-xs ml-1">{user.role}</Badge>
          )}
        </p>
      </div>

      {/* Master Data */}
      <SectionCard
        title="Master Data"
        description="Konfigurasi data master yang digunakan dalam kalkulasi OEE"
        icon={Settings}
        locked={!hasMaster}
        lockedMsg="Admin / Manager"
        links={[
          { href: '/oee/master/shift',               label: 'Master Shift',           icon: Timer },
          { href: '/oee/master/line',                 label: 'Master Line',            icon: Factory },
          { href: '/oee/master/kode-pakan',           label: 'Kode Pakan',             icon: Package },
          { href: '/oee/master/standard-throughput',  label: 'Standard Throughput',    icon: Activity },
          { href: '/oee/master/machine-losses',       label: 'Machine Losses',         icon: Workflow },
        ]}
      />

      {/* Input Data */}
      <SectionCard
        title="Input Data"
        description="Input data operasional mesin harian"
        icon={Database}
        locked={!hasInput}
        lockedMsg="Admin / Manager / Operator"
        links={[
          { href: '/oee/input/output',          label: 'Input Output',       icon: Activity },
          { href: '/oee/input/machine-losses',  label: 'Input Machine Loss', icon: Factory },
        ]}
      />

      {/* Data View — selalu accessible */}
      <SectionCard
        title="Data View"
        description="Lihat dan analisa metrik OEE yang sudah terhitung"
        icon={BarChart3}
        links={[
          { href: '/oee/view/loading-time',      label: 'Loading Time',      icon: Clock },
          { href: '/oee/view/operating-time',    label: 'Operating Time',    icon: Timer },
          { href: '/oee/view/availability-rate', label: 'Availability Rate', icon: BarChart2 },
          { href: '/oee/view/performance-rate',  label: 'Performance Rate',  icon: TrendingUp },
          { href: '/oee/view/quality-rate',      label: 'Quality Rate',      icon: LineChart },
          { href: '/oee/view/summary',           label: 'Summary OEE',       icon: BarChart3 },
        ]}
      />
    </div>
  );
}
