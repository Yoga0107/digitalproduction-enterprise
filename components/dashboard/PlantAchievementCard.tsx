"use client"

import { CardContent } from "@/components/ui/card";
import { Factory } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PlantComparisonData } from "@/services/forecastAccuracy";

interface Props {
  data: PlantComparisonData[];
  year: number;
}

export default function PlantAchievementCard({ data, year }: Props) {
  const target = year<2026? 75: 80;
  const achievedCount = data.filter(p => p.overallAccuracy >= target).length;
  const TOTAL_PLANTS = 5;
  
  const chartData = [
    { name: "Achieved", value: achievedCount },
    { name: "Remaining", value: TOTAL_PLANTS - achievedCount },
  ];

  // Menggunakan warna hex yang diminta untuk donut bagian achieved
  const COLORS = ["#ab47bc", "#f1f5f9"];

  return (

    // <div 
    //   className="rounded-xl shadow-sm w-full h-full overflow-hidden border border-slate-200" 
    //   style={{ background: 'linear-gradient(135deg, #0dec111a 0%, #ffffff 100%)' }} // Opacity ~10% (#1a)
    // >

    <div 
      className="bg-white rounded-xl shadow-sm w-full h-full overflow-hidden"
    >
      <CardContent className="h-full pt-4 pb-4 px-5 flex items-center justify-between bg-transparent">
        
        {/* Sisi Kiri: Icon, Title, dan Angka */}
        <div className="flex flex-col space-y-1"> 
          
          {/* Icon Factory: Tanpa BG, mepet kiri sejajar Title */}
          <div className="bg-transparent mb-3">
            <Factory className="w-8 h-8 text-[#ab47bc]" /> 
          </div>

          <div>
            <h3 className="text-[12px] font-bold text-black tracking-widest leading-none mb-5">
              Plant Achievement
            </h3>
            
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-black text-slate-800 tracking-tighter leading-none">
                {achievedCount}
              </span>
              <span className="text-3xl font-bold text-slate-200">/</span>
              <span className="text-3xl font-bold text-slate-400">
                {TOTAL_PLANTS}
              </span>
            </div>
            
            <p className="text-[10px] font-light text-slate-400 uppercase tracking-wider mt-0.5">
              Plants on Target
            </p>
          </div>
        </div>

        {/* Sisi Kanan: Donut Chart */}
        <div className="w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={28} // Diperbesar sedikit agar proporsional dengan angka 6xl
                outerRadius={40}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

      </CardContent>
    </div>
  );
}