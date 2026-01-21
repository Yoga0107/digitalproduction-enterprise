"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line, Legend } from 'recharts';
import { MonthlyTrendData } from "@/services/forecastAccuracy"; // Sesuaikan path import
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Props {
  data: MonthlyTrendData[];
  year: number;
}

export default function TrendAccuracyChartMonthly({ data, year }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Mapping dari singkatan chart ke angka Database (1-12)
  const monthMap: Record<string, string> = {
    "Jan": "1", "Feb": "2", "Mar": "3", "Apr": "4",
    "May": "5", "Jun": "6", "Jul": "7", "Aug": "8",
    "Sep": "9", "Oct": "10", "Nov": "11", "Dec": "12"
  };

  const handleChartClick = useCallback((state: any) => {
    // Recharts menyediakan activeLabel (isi dari XAxis yang diklik)
    if (state && state.activeLabel) {
      const monthLabel = state.activeLabel;
      const monthValue = monthMap[monthLabel] || monthLabel; // Ambil angka dari map
      
      const params = new URLSearchParams(searchParams.toString());
      
      if (params.get("month") === String(monthValue)) {
        params.delete("month");
      } else {
        params.set("month", String(monthValue));
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [router, searchParams, pathname]);

  const chartData = data.map(item => ({
    ...item,
    Target: year<2026?75: 80 // Sesuai target overall yang Anda inginkan
  }));

  return (
    <Card className="shadow-sm rounded-xl overflow-visible border-none">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-black">Monthly Overall Accuracy Trend</CardTitle>
      </CardHeader>
      {/* Tinggi disesuaikan ke 350px agar ada ruang untuk legend di bawah */}
      <CardContent className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: -15, bottom: 20 }}
            onClick={handleChartClick} // Trigger Cross-Filtering
            style={{ cursor: 'pointer' }}
          >

            <defs>
              <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4174ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4174ff" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              axisLine={false} 
              fontSize={10}
              dy={10} 
              className="text-slate-500 font-medium"
            />
            
            <YAxis 
              tickFormatter={(value) => `${value}%`} 
              tickLine={false} 
              axisLine={false} 
              domain={[0, 100]} 
              fontSize={10}
              className="text-slate-500 font-medium"
            />
            
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: number | string | undefined, labelName: any) => {
                if (value === undefined) return ["0.00%", labelName ?? "Accuracy"];

                const formattedValue = Number(value).toFixed(2);

                // labelName ?? "Accuracy" memastikan jika name undefined, tooltip tidak pecah
                return [`${formattedValue}%`, labelName];
              }}  
              cursor={{ stroke: '#cccccc', strokeWidth: 1 }}
            />

            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="line"
              iconSize={10}
              wrapperStyle={{ 
                fontSize: '12px', 
                paddingTop: '30px',
                position: 'relative'
              }} 
            />

            {/* Area untuk Accuracy */}
            <Area 
              type="linear" 
              dataKey="overallAccuracy" 
              stroke="#4174ff" 
              dot={{ 
                  r: 4,               // Ukuran radius titik
                  fill: "#4174ff",    // Warna isi titik (samakan dengan stroke)
                  strokeWidth: 0,     // Menghilangkan border agar terlihat full solid
                  fillOpacity: 1      // Memastikan warna titik tidak transparan
                }}
              fillOpacity={1} 
              fill="url(#colorAccuracy)" 
              strokeWidth={2} 
              name="Overall Accuracy"
              activeDot={{ r: 6 }} // Feedback saat hover
            />
            
            {/* Line untuk Target - Menggunakan dataKey yang sama di dalam AreaChart */}
            <Line 
              type="linear" 
              dataKey="Target" 
              stroke="#f04487" 
              strokeDasharray="5 5" 
              strokeWidth={1.5} 
              dot={false} 
              name="Target Accuracy"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}