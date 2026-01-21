"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line, Legend } from 'recharts';
import { WeeklyTrendData } from "@/services/forecastAccuracy";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Props {
  data: WeeklyTrendData[];
  currentMonth: number;
  year: number;
}

export default function TrendAccuracyChartWeekly({ data, currentMonth, year }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const target = year<2026?75: 80;

  const chartData = data.map(item => ({ ...item, target: target }));

  const handleChartClick = useCallback((state: any) => {
    if (state && state.activeLabel) {
      // Mengambil angka dari label "W1", "W2", dst.
      const weekNumber = state.activeLabel.replace("W", "");
      const params = new URLSearchParams(searchParams.toString());
      
      // Jika minggu yang sama diklik lagi, hapus filter (toggle off)
      if (params.get("week") === weekNumber) {
        params.delete("week");
      } else {
        params.set("week", weekNumber);
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [router, searchParams, pathname]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const currentMonthName = monthNames[currentMonth - 1];

  return (
    <Card className="shadow-sm rounded-xl overflow-visible border-none h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-black">
          Weekly Overall Accuracy Trend<span className="text-[#4174ff]"> — {currentMonthName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 w-full min-h-[350px] ">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
            style={{ cursor: 'pointer' }}
            onClick={handleChartClick}
          >
            <defs>
              <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4174ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4174ff" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

            <XAxis 
              dataKey="week" 
              tickLine={false} 
              axisLine={false} 
              fontSize={10} 
              className="text-slate-500 font-medium" 
              dy={10} 
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

            <Area 
              type="linear" 
              dataKey="overallAccuracy" 
              stroke="#4174ff" 
              fill="url(#colorWeekly)" 
              strokeWidth={2} 
              name="Overall Accuracy" 
              dot={{ 
                r: 4, 
                fill: "#4174ff",
                strokeWidth: 0,
                fillOpacity: 1 
              }}
              fillOpacity={1} 
              activeDot={{ r: 6 }}
            />

            <Line 
              type="linear" 
              dataKey="target" 
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