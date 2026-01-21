"use client";

import { useState, useRef, useEffect, useTransition, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterGroupProps {
  options: {
    year: number[];
    plants: string[];
    months: { id: number; name: string }[];
  };
  showPlant?: boolean;
  showYear?: boolean;
  showMonth?: boolean;
}

export default function FilterGroup({ 
  options, 
  showPlant = true, 
  showYear = true, 
  showMonth = true 
}: FilterGroupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const yearsData = useMemo(() => options?.year || [], [options]);
  const plantsData = useMemo(() => options?.plants || [], [options]);
  const monthsData = useMemo(() => options?.months || [], [options]);

  // --- 1. LOGIKA UPDATE FILTER ---
  // Menggunakan useCallback agar fungsi tidak dibuat ulang setiap render
  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "year") {
      params.set(key, value);
      setOpenDropdown(null); // Tutup khusus untuk year (single select)
    } else {
      const currentParam = params.get(key);
      let currentValues = currentParam ? currentParam.split(",").filter(v => v !== "") : [];
      
      if (value === "all") {
        params.delete(key);
      } else {
        const valStr = String(value);
        if (currentValues.includes(valStr)) {
          currentValues = currentValues.filter((v) => v !== valStr);
        } else {
          currentValues.push(valStr);
        }

        if (currentValues.length === 0) {
          params.delete(key);
        } else {
          params.set(key, currentValues.join(","));
        }
      }
      // PENTING: Jangan setOpenDropdown(null) di sini agar multi-select tetap terbuka
    }

    startTransition(() => {
      // scroll: false mencegah halaman melompat ke atas
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  // --- 2. HELPER UI ---
  const isSelected = (key: string, value: string) => {
    const currentParam = searchParams.get(key);
    if (!currentParam) return value === "all";
    return currentParam.split(",").includes(String(value));
  };

  const getLabel = (key: string, label: string) => {
    const currentParam = searchParams.get(key);
    
    if (!currentParam) {
      if (key === "year") return `${label}: ${yearsData[0] || "Select"}`;
      return `${label}: All`;
    }

    const values = currentParam.split(",").filter(v => v !== "");

    if (values.length === 1) {
      if (key === 'month') {
        const m = monthsData.find((item) => String(item.id) === String(values[0]));
        return `${label}: ${m ? m.name : values[0]}`;
      }
      return `${label}: ${values[0]}`;
    }
    
    return `${label}: ${values.length} Selected`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 3. SUB-COMPONENT DROPDOWN ---
  // Memisahkan DropdownItem agar render lebih efisien
  const DropdownItem = ({ id, label, items, valueKey, displayKey }: any) => {
    const isOpen = openDropdown === id;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpenDropdown(isOpen ? null : id);
          }}
          className={cn(
            "w-36 md:w-44 bg-white text-slate-700 px-3 py-2 rounded-md text-[11px] md:text-xs font-bold shadow-sm flex items-center justify-between hover:bg-slate-50 transition-all border border-slate-100 cursor-pointer",
            isOpen && "ring-2 ring-orange-500/20 border-orange-200",
            isPending && "opacity-70" 
          )}
        >
          <span className="truncate mr-1 text-left">{getLabel(id, label)}</span>
          <div className="flex items-center gap-1">
            {isPending && openDropdown === id && <Loader2 className="h-2.5 w-2.5 animate-spin text-orange-500" />}
            <ChevronDown className={cn("h-3.5 w-3.5 opacity-40 transition-transform duration-200", isOpen && "rotate-180")} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-[110] mt-2 w-52 bg-white rounded-lg shadow-2xl border border-slate-200 py-1 max-h-[300px] overflow-y-auto overflow-x-hidden">
            {id !== "year" && (
              <>
                <button
                  type="button"
                  onClick={() => updateFilter(id, "all")}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] hover:bg-orange-50 text-slate-700 font-bold border-b border-slate-50 cursor-pointer"
                >
                  All {label}s
                  {!searchParams.get(id) && <Check className="h-3.5 w-3.5 text-orange-600 stroke-[3px]" />}
                </button>
              </>
            )}

            {items.map((item: any) => {
              const val = valueKey ? String(item[valueKey]) : String(item);
              const display = displayKey ? String(item[displayKey]) : String(item);
              const active = isSelected(id, val);

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateFilter(id, val)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2 text-[11px] transition-colors cursor-pointer",
                    active ? "bg-orange-50 text-orange-700 font-bold" : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <span className="truncate pr-2">{display}</span>
                  {active && <Check className="h-3.5 w-3.5 text-orange-600 stroke-[3px]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full lg:w-auto">
      {showPlant && <DropdownItem id="plant" label="Plant" items={plantsData} />}
      {showYear && <DropdownItem id="year" label="Year" items={yearsData} />}
      {showMonth && <DropdownItem id="month" label="Month" items={monthsData} valueKey="id" displayKey="name" />}
    </div>
  );
}