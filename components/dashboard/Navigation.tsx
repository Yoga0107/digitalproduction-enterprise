"use client"

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Factory, LineChart } from "lucide-react";
import { cn } from "@/lib/utils"; 

export default function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const menuItems = [
    { name: "Executive Summary", href: "/", icon: LayoutDashboard },
    { name: "Plant Performance", href: "/plant_performance_detail", icon: Factory },
    { name: "Trend Analysis", href: "/trend_analysis", icon: LineChart },
  ];

  return (
    <nav className="flex flex-col lg:flex-row items-center gap-2 lg:gap-1 bg-black/20 p-2 lg:p-1 rounded-xl lg:rounded-lg backdrop-blur-sm border border-white/10 w-fit mx-auto lg:mx-0">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        
        // --- OPTIMASI DI SINI ---
        const currentParams = searchParams.toString();
        // Pastikan link terbentuk dengan benar, hanya tambah ? jika ada params
        const hrefWithFilters = currentParams ? `${item.href}?${currentParams}` : item.href;

        return (
          <Link
            key={item.href}
            href={hrefWithFilters}
            // Menggunakan prefetch={false} terkadang membantu jika data per page sangat berat
            prefetch={true} 
            className={cn(
              "group flex items-center justify-center gap-3 w-44 px-3 py-2.5 lg:py-1.5 rounded-lg lg:rounded-md transition-all duration-200",
              isActive 
                ? "bg-white text-orange-600 shadow-md" 
                : "text-white/90 hover:bg-white hover:text-orange-600"
            )}
          >
            <item.icon 
              className={cn(
                "h-4 w-4 lg:h-3.5 lg:w-3.5 flex-shrink-0 transition-colors duration-200", 
                isActive 
                  ? "text-orange-600" 
                  : "text-white/80 group-hover:text-orange-600"
              )} 
            />
            <span className="text-[10px] font-medium uppercase tracking-tight leading-none">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}