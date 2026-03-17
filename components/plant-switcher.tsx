'use client';

/**
 * components/plant-switcher.tsx
 * Dropdown untuk switch antar plant tanpa logout.
 * Muncul di header/sidebar jika user punya akses ke > 1 plant.
 */

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Factory, ChevronDown, Check } from 'lucide-react';

export function PlantSwitcher() {
  const { activePlant, accessiblePlants, selectPlant, user } = useAuth();
  const router = useRouter();

  // Don't render if user has no plants or only one (nothing to switch)
  if (!user || accessiblePlants.length <= 1) return null;

  const handleSelect = (plant: typeof activePlant) => {
    if (!plant) return;
    selectPlant(plant);
    // Refresh current page data after plant switch
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[220px]">
          <Factory className="h-4 w-4 shrink-0 text-blue-500" />
          <span className="truncate text-sm">
            {activePlant ? activePlant.name : 'Pilih Plant'}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Plant yang dapat diakses
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accessiblePlants.map((plant) => (
          <DropdownMenuItem
            key={plant.id}
            onClick={() => handleSelect(plant)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Factory className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{plant.name}</p>
                <p className="text-xs text-muted-foreground">{plant.code}</p>
              </div>
            </div>
            {activePlant?.id === plant.id && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/select-plant')}
          className="text-xs text-muted-foreground cursor-pointer"
        >
          Lihat semua plant…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}