"use client"

import { CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  currentAccuracy: number;
  previousAccuracy: number;
  currentMonth: number
}

export default function AccuracyGrowthCard({ currentAccuracy, previousAccuracy, currentMonth}: Props) {

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]; 

  const currentMonthName = monthNames[currentMonth - 1];

  // Ambil nama bulan sebelumnya untuk keterangan pembanding
  const prevMonthIndex = currentMonth === 1 ? 11 : currentMonth - 2;
  const prevMonthName = monthNames[prevMonthIndex];

  const delta = currentAccuracy - previousAccuracy;
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isNeutral = delta === 0;

  // Warna dinamis: Hijau untuk naik, Merah untuk turun
  const statusColor = isPositive ? "#02d1a7" : isNegative ? "#f04487" : "#94a3b8";

  return (
    <div className="bg-white rounded-xl shadow-sm w-full h-full overflow-hidden">
      <CardContent className="h-full pt-4 pb-4 px-5 flex items-center justify-between bg-transparent">
        
        {/* Sisi Kiri: Icon, Title, dan Angka */}
        <div className="flex flex-col space-y-1"> 
          
          {/* Icon Dinamis sejajar dengan Title */}
          <div className="bg-transparent mb-3">
            {isPositive ? (
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            ) : isNegative ? (
              <TrendingDown className="w-8 h-8 text-rose-500" />
            ) : (
              <Minus className="w-8 h-8 text-slate-400" />
            )}
          </div>

          <div>
            <h3 className="text-[12px] font-bold text-black tracking-widest leading-none mb-5">
              Accuracy Growth
              <span className="text-[#4174ff]"> — {currentMonthName}</span>
            </h3>
            
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-black text-slate-800 tracking-tighter leading-none">
                {Math.round(currentAccuracy)}
              </span>
              <span className="text-3xl font-black text-slate-800">%</span>
              
              {/* Delta Badge dengan warna dinamis */}
              <span className={`text-sm font-bold ml-2 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                ({isPositive ? '+' : ''}{delta.toFixed(2)}%)
              </span>
            </div>
            
            <p className="text-[10px] font-light text-slate-400 uppercase tracking-wider mt-0.5">
              vs {prevMonthName}
            </p>
          </div>
        </div>

        {/* Sisi Kanan: Segitiga Indikator */}
        <div className="w-20 h-20 flex flex-col items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-sm transition-all duration-500">
            {isPositive && (
              <polygon points="50,15 90,85 10,85" fill={statusColor} />
            )}
            {isNegative && (
              <polygon points="10,15 90,15 50,85" fill={statusColor} />
            )}
            {isNeutral && (
              <rect x="10" y="40" width="80" height="20" rx="4" fill={statusColor} />
            )}
          </svg>
          <span className="text-[9px] font-black mt-2 uppercase tracking-tighter" style={{ color: statusColor }}>
            {isPositive ? "Performance Up" : isNegative ? "Performance Down" : "Stable"}
          </span>
        </div>

      </CardContent>
    </div>
  );
}