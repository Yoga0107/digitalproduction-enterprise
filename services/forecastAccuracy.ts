import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

interface MonthlyPerformanceRow {
  plant: string | null;
  business_unit: string | null;
  year: number | null;
  jan: string | number | null;
  feb: string | number | null;
  mar: string | number | null;
  apr: string | number | null;
  may: string | number | null;
  jun: string | number | null;
  jul: string | number | null;
  aug: string | number | null;
  sep: string | number | null;
  oct: string | number | null;
  nov: string | number | null;
  dec: string | number | null;
  ytd_avg: string | number | null;
  vs_target: string | number | null;
}

interface TrendAnalysisRow {
  year: number | null;
  month: number | null;
  overall_accuracy: string | number | null;
  fish_accuracy: string | number | null;
  shrimp_accuracy: string | number | null;
  best_performing: string | null;
  worst_performing: string | null;
}

interface RawDataRow {
  year: number;
  month: number;
  week: number;
  plant: string;
  business_unit: string;
  // category: string;
  code: string;
  forecast: number;
  // produksi: number;
  sales: number;
}

interface AccuracyFilters {
  year: number;   
  months?: number[]; // Array untuk multi-select
  plants?: string[]; // Array untuk multi-select
  week?: number
}

// --- INTERFACES FOR UI (Camel Case) ---
export interface MonthlyPerformanceData {
  plant: string;
  businessUnit: string;
  year: number;
  monthlyData: { month: string; value: number }[];
  ytdAvg: number;
  vsTarget: number;
}

export interface TrendAnalysisData {
  year: number;
  month: string;
  overallAccuracy: number; 
  fishAccuracy: number;   
  shrimpAccuracy: number;  
  bestPerforming: string;
  worstPerforming: string;
}

export interface MonthlyTrendData {
  month: string;
  overallAccuracy: number;
}

export interface WeeklyTrendData {
  week: string;
  overallAccuracy: number;
}

export interface PlantComparisonData {
  plant: string;
  overallAccuracy: number;
  fishAccuracy: number;
  shrimpAccuracy: number;
}

export interface PlantSubmissionStatus {
  plant: string;
  completedWeeks: number;
  percentage: number;
  details: { week: number; isFilled: boolean }[];
}

interface RawSubmissionRow {
  plant: string;
  week: number;
}

// Helper
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CodeSummary {
  sum_f: number;
  sum_s: number;
}

function calculateAccuracyByUnit(data: RawDataRow[], businessUnitFilter: string | null = null): number {
  if (!data || data.length === 0) return 0;

  let filteredData = data;
  if (businessUnitFilter && businessUnitFilter.trim().length > 0) {
    const filterKey = businessUnitFilter.toLowerCase();
    filteredData = data.filter(row => row.business_unit && row.business_unit.toLowerCase() === filterKey);
  }

  if (filteredData.length === 0) return 0.0;

  const summaryMap = new Map<string, CodeSummary>();

  for (const row of filteredData) {
    const key = row.code;
    const current = summaryMap.get(key) || { sum_f: 0, sum_s: 0 };
    current.sum_f += Number(row.forecast) || 0;
    current.sum_s += Number(row.sales) || 0;
    summaryMap.set(key, current);
  }

  const validErrors: number[] = [];
  for (const summary of summaryMap.values()) {
    const sum_f = summary.sum_f;
    const sum_s = summary.sum_s;
    let validErrorValue = 0;

    if (sum_f <= 0 || sum_s <= 0) {
      validErrorValue = 0.0;
    } else {
      const rawErrorRate = Math.abs(sum_f - sum_s) / sum_f;
      validErrorValue = rawErrorRate > 1.0 ? 0.0 : rawErrorRate;
    }

    if (validErrorValue > 0) {
      validErrors.push(validErrorValue);
    }
  }

  if (validErrors.length === 0) return 1.0;

  const totalValidError = validErrors.reduce((sum, error) => sum + error, 0);
  const avgValidError = totalValidError / validErrors.length;
  return 1.0 - avgValidError;
}

// --- SERVICE OBJECT ---
export const ForecastAccuracyService = {

  getSubmissionStatus: async (filters: AccuracyFilters): Promise<PlantSubmissionStatus[]> => {
    try {
      let targetMonth: number;
      const defaultPlants = ["CKP", "LPG", "MDN", "SBY", "SPJ"];

      const activePlants = filters.plants && filters.plants.length > 0 
        ? filters.plants 
        : defaultPlants;

      if (filters.months && filters.months.length > 0) {
        targetMonth = Math.max(...filters.months);
      } else {
        const maxMonthResult = await db.execute(sql`
          SELECT MAX(month) as max_month
          FROM data_collection_forecast_accuracy
          WHERE year = ${filters.year}
        `);
        targetMonth = (maxMonthResult as any)[0]?.max_month || (new Date().getMonth() + 1);
      }

      const plantClause = filters.plants && filters.plants.length > 0 
        ? sql`AND plant IN (${sql.join(filters.plants, sql`, `)})` 
        : sql``;

      const result = await db.execute(sql`
        SELECT DISTINCT plant, week
        FROM data_collection_forecast_accuracy
        WHERE year = ${filters.year} 
          AND month = ${targetMonth}
          AND week BETWEEN 1 AND 4
          ${plantClause}
      `);

      const rows = result as unknown as RawSubmissionRow[];

      return activePlants.map(plantName => {
        const filledWeeks = rows
          .filter(r => r.plant?.toUpperCase() === plantName.toUpperCase())
          .map(r => Number(r.week));

        const details = [1, 2, 3, 4].map(w => ({
          week: w,
          isFilled: filledWeeks.includes(w)
        }));

        const completedCount = details.filter(d => d.isFilled).length;

        return {
          plant: plantName,
          completedWeeks: completedCount,
          percentage: (completedCount / 4) * 100,
          details: details
        };
      });

    } catch (error) {
      console.error("Error in getSubmissionStatus:", error);
      return [];
    }
  },

  getFilterOptions: async () => {
    const result = await db.execute(sql`
      SELECT DISTINCT year FROM data_collection_forecast_accuracy 
      ORDER BY year DESC
    `);
    return {
      year: (result as any).map((r: any) => Number(r.year)),
      plants: ["CKP", "LPG", "MDN", "SBY", "SPJ"],
      months: monthNames.map((name, i) => ({ id: i + 1, name }))
    };
  },

  getLatestMonthAvailable: async (year: number): Promise<number | null> => {
    try {
      const result = await db.execute(sql`
        SELECT MAX(month) as max_month 
        FROM data_collection_forecast_accuracy 
        WHERE year = ${year}
      `);
      
      const maxMonth = (result as any)[0]?.max_month;
      return maxMonth ? Number(maxMonth) : null;
    } catch (error) {
      console.error("Error fetching latest month:", error);
      return null;
    }
  },

  getMonthlyPerformance: async (filters: AccuracyFilters): Promise<MonthlyPerformanceData[]> => {
    const targetYear = filters.year;
    try {
      const result = await db.execute(sql`
        SELECT * FROM plant_performance_detail_monthly
        WHERE year = ${targetYear}
        ORDER BY plant ASC, business_unit ASC
      `);

      const rows = result as unknown as MonthlyPerformanceRow[];

      return rows.map((row) => ({
        plant: row.plant ?? "Unknown",
        businessUnit: row.business_unit ?? "N/A",
        year: Number(row.year) || targetYear,
        monthlyData: [
          { month: 'Jan', value: Number(row.jan) * 100 || 0 },
          { month: 'Feb', value: Number(row.feb) * 100 || 0 },
          { month: 'Mar', value: Number(row.mar) * 100 || 0 },
          { month: 'Apr', value: Number(row.apr) * 100 || 0 },
          { month: 'May', value: Number(row.may) * 100 || 0 },
          { month: 'Jun', value: Number(row.jun) * 100 || 0 },
          { month: 'Jul', value: Number(row.jul) * 100 || 0 },
          { month: 'Aug', value: Number(row.aug) * 100 || 0 },
          { month: 'Sep', value: Number(row.sep) * 100 || 0 },
          { month: 'Oct', value: Number(row.oct) * 100 || 0 },
          { month: 'Nov', value: Number(row.nov) * 100 || 0 },
          { month: 'Dec', value: Number(row.dec) * 100 || 0 },
        ],
        ytdAvg: Number(row.ytd_avg) * 100|| 0,
        vsTarget: Number(row.vs_target) * 100|| 0,
      }));
    } catch (error) {
      console.error("Error in getMonthlyPerformance:", error);
      return [];
    }
  },

  getTrendAnalysis: async (filters: AccuracyFilters): Promise<TrendAnalysisData[]> => {
    const targetYear = filters.year;
    const targetMonths = filters.months;
    try {
      // Pastikan query tetap menggunakan sintaks yang benar untuk parameter opsional
      const monthCondition = (targetMonths && targetMonths.length > 0)
        ? sql`AND month IN (${sql.join(targetMonths, sql`, `)})`
        : sql``;

      const result = await db.execute(sql`
        SELECT 
          year,
          month, 
          overall_accuracy,
          fish_accuracy,
          shrimp_accuracy,
          best_performing,
          worst_performing
        FROM trend_analysis_monthly 
        WHERE year = ${targetYear}
        ${monthCondition}
        ORDER BY month ASC
      `);

      const rows = result as unknown as TrendAnalysisRow[];

      return rows.map((row) => ({
        year: Number(row.year) || targetYear,
        month: row.month ? monthNames[Number(row.month) - 1] : "Unknown",
        // Gunakan Number() untuk memastikan tipe data sesuai interface (number)
        overallAccuracy: Number(row.overall_accuracy) * 100 || 0,
        fishAccuracy: Number(row.fish_accuracy) * 100 || 0,
        shrimpAccuracy: Number(row.shrimp_accuracy) * 100 || 0,
        bestPerforming: row.best_performing ?? "-",
        worstPerforming: row.worst_performing ?? "-",
      }));
    } catch (error) {
      console.error("Error in getTrendAnalysis:", error);
      return [];
    }
  },

  getForecastAccuracyData: async (filters: AccuracyFilters): Promise<RawDataRow[]> => {
    try {

      const yearClause = sql`AND year = ${filters.year}`;

      const monthClause = filters.months && filters.months.length > 0 
        ? sql`AND month IN (${sql.join(filters.months, sql`, `)})` 
        : sql``;
        
      const plantClause = filters.plants && filters.plants.length > 0 
        ? sql`AND plant IN (${sql.join(filters.plants, sql`, `)})` 
        : sql``;

      const weekClause = filters.week ? sql`AND week = ${filters.week}` : sql``;

      const result = await db.execute(sql`
        SELECT year, month, week, plant, business_unit, code, forecast, sales
        FROM data_collection_forecast_accuracy
        WHERE 1=1
        ${yearClause}
        ${monthClause}
        ${plantClause}
        ${weekClause}
      `);

      // console.log("anjay - adasdad    ".replace(/\s+/g, ' ').trim())

      return result as unknown as RawDataRow[];
      
    } catch (error) {
      console.error("Error in getForecastAccuracyData:", error);
      return [];
    }
  },

  getOverallAccuracy: async (filters: AccuracyFilters): Promise<number> => {
    const data = await ForecastAccuracyService.getForecastAccuracyData(filters);
    return calculateAccuracyByUnit(data, null) * 100;
  },

  getFishAccuracy: async (filters: AccuracyFilters): Promise<number> => {
    const data = await ForecastAccuracyService.getForecastAccuracyData(filters);
    return calculateAccuracyByUnit(data, 'fish') * 100;
  },

  getShrimpAccuracy: async (filters: AccuracyFilters): Promise<number> => {
    const data = await ForecastAccuracyService.getForecastAccuracyData(filters);
    return calculateAccuracyByUnit(data, 'shrimp') * 100;
  },  

  getMonthlyTrendData: async (filters: AccuracyFilters): Promise<MonthlyTrendData[]> => {
    try {
      const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const rawData = await ForecastAccuracyService.getForecastAccuracyData(filters);

      if (!rawData || rawData.length === 0) {
        return shortMonths.map(name => ({ month: name, overallAccuracy: 0 }));
      }

      // 2. Kita hitung manual per bulan agar return-nya berupa array fluktuatif
      return shortMonths.map((name, index) => {
        const monthNumber = index + 1;
        const monthData = rawData.filter(d => Number(d.month) === monthNumber);

        if (monthData.length === 0) {
          return { month: name, overallAccuracy: 0 };
        }

        // --- LOGIC AGREGASI RAW DATA PER BULAN ---
        // Kelompokkan per 'code' untuk bulan ini saja
        const summaryMap = new Map<string, { sum_f: number; sum_s: number }>();

        for (const row of monthData) {
          const key = row.code;
          const current = summaryMap.get(key) || { sum_f: 0, sum_s: 0 };
          current.sum_f += Number(row.forecast) || 0;
          current.sum_s += Number(row.sales) || 0;
          summaryMap.set(key, current);
        }

        const validErrors: number[] = [];
        for (const summary of summaryMap.values()) {
          const { sum_f, sum_s } = summary;
          let validErrorValue = 0.0;
        
          if (sum_f <= 0 || sum_s <= 0) {
            validErrorValue = 0.0;
          } else {
            const rawErrorRate = Math.abs(sum_f - sum_s) / sum_f;
            // Jika error > 100%, maka dianggap 0.0
            validErrorValue = rawErrorRate > 1.0 ? 0.0 : rawErrorRate;
          }
        
          if (validErrorValue > 0) {
            validErrors.push(validErrorValue);
          }
        }

        const accuracy = validErrors.length > 0 
          ? (1.0 - (validErrors.reduce((a, b) => a + b, 0) / validErrors.length)) * 100
          : 0;

        return {
          month: name,
          overallAccuracy: Number(accuracy.toFixed(2))
        };
      });
    } catch (error) {
      console.error("Error in getMonthlyTrendData:", error);
      return [];
    }
  },

  getWeeklyTrendData: async (filters: AccuracyFilters): Promise<WeeklyTrendData[]> => {
    try {
      let targetMonth: number;

      const targetPlant = filters.plants && filters.plants.length > 0 
      ? filters.plants[filters.plants.length - 1] 
      : null;

      const targetWeek = filters.week ? Number(filters.week) : null;

      const plantClause = targetPlant ? sql` AND plant = ${targetPlant}` : sql``

      const weekClause = targetWeek? sql` AND week = ${targetWeek}` : sql``

      if (filters.months && filters.months.length > 0) {
        targetMonth = Math.max(...filters.months);
      } else {
        const maxMonthResult = await db.execute(sql`
          SELECT MAX(month) as max_month 
          FROM data_collection_forecast_accuracy 
          WHERE year = ${filters.year}
        `);
        targetMonth = (maxMonthResult as any)[0]?.max_month || (new Date().getMonth() + 1);
      }

      const result = await db.execute(sql`
        SELECT year, month, week, code, forecast, sales
        FROM data_collection_forecast_accuracy
        WHERE year = ${filters.year} AND month = ${targetMonth}
        ${plantClause}
        ${weekClause}
      `);

      const rawData = result as unknown as RawDataRow[];
      const weeksInMonth = [1, 2, 3, 4];

      return weeksInMonth.map((weekNum) => {

        const weekData = rawData.filter(d => Number(d.week) === weekNum);

        if (weekData.length === 0){
          return { week: `W${weekNum}`, overallAccuracy: 0 };
        }

        const summaryMap = new Map<string, { sum_f: number; sum_s: number }>();

        for (const row of weekData) {
          const key = row.code;
          const current = summaryMap.get(key) || { sum_f: 0, sum_s: 0 };
          current.sum_f += Number(row.forecast) || 0;
          current.sum_s += Number(row.sales) || 0;
          summaryMap.set(key, current);
        }

        const validErrors: number[] = [];
        for (const summary of summaryMap.values()) {
          const { sum_f, sum_s } = summary;
          let validErrorValue = 0.0;
        
          if (sum_f <= 0 || sum_s <= 0) {
            validErrorValue = 0.0;
          } else {
            const rawErrorRate = Math.abs(sum_f - sum_s) / sum_f;
            // Jika error > 100%, maka dianggap 0.0
            validErrorValue = rawErrorRate > 1.0 ? 0.0 : rawErrorRate;
          }
        
          if (validErrorValue > 0) {
            validErrors.push(validErrorValue);
          }
        }

        const accuracy = validErrors.length > 0 
          ? (1.0 - (validErrors.reduce((a, b) => a + b, 0) / validErrors.length)) * 100
          : 0;

        return {
          week: `W${weekNum}`,
          overallAccuracy: Number(accuracy.toFixed(2))
        };
      });
    } catch (error) {
      console.error("Error in getWeeklyTrendData:", error);
      return []
    }
  },

  getPlantComparison: async (filters: AccuracyFilters): Promise<PlantComparisonData[]> => {
    try {
      // 1. Ambil data mentah sesuai filter (Year, Month, dll)
      const rawData = await ForecastAccuracyService.getForecastAccuracyData(filters);

      if (!rawData || rawData.length === 0) return [];

      // 2. Dapatkan list plant unik
      const plants = Array.from(new Set(rawData.map(d => d.plant))).filter(Boolean);

      // 3. Helper function internal untuk menghitung akurasi per segment (Overall/Fish/Shrimp)
      const calculateInternalAccuracy = (data: RawDataRow[], businessUnit: string | null) => {
        // Filter berdasarkan Business Unit jika diminta (fish/shrimp)
        const filtered = businessUnit 
          ? data.filter(d => d.business_unit?.toLowerCase() === businessUnit.toLowerCase())
          : data;

        if (filtered.length === 0) return 0;

        // Agregasi per CODE (SKU)
        const summaryMap = new Map<string, { sum_f: number; sum_s: number }>();
        for (const row of filtered) {
          const current = summaryMap.get(row.code) || { sum_f: 0, sum_s: 0 };
          current.sum_f += Number(row.forecast) || 0;
          current.sum_s += Number(row.sales) || 0;
          summaryMap.set(row.code, current);
        }

        // Logic validasi error sesuai instruksi Anda
        const validErrors: number[] = [];
        for (const summary of summaryMap.values()) {
          const { sum_f, sum_s } = summary;
          let validErrorValue = 0.0;

          if (sum_f <= 0 || sum_s <= 0) {
            validErrorValue = 0.0;
          } else {
            const rawErrorRate = Math.abs(sum_f - sum_s) / sum_f;
            validErrorValue = rawErrorRate > 1.0 ? 0.0 : rawErrorRate;
          }

          // Jika > 0 maka masuk hitungan rata-rata (length bertambah)
          if (validErrorValue > 0) {
            validErrors.push(validErrorValue);
          }
        }

        const acc = validErrors.length > 0 
          ? (1.0 - (validErrors.reduce((a, b) => a + b, 0) / validErrors.length)) * 100
          : 0;

        return Number(acc.toFixed(2));
      };

      // 4. Map hasil untuk setiap plant
      return plants.map(plantName => {
        const plantData = rawData.filter(d => d.plant === plantName);

        return {
          plant: plantName,
          overallAccuracy: calculateInternalAccuracy(plantData, null),
          fishAccuracy: calculateInternalAccuracy(plantData, 'fish'),
          shrimpAccuracy: calculateInternalAccuracy(plantData, 'shrimp'),
        };
      });
    } catch (error) {
      console.error("Error in getPlantComparison:", error);
      return [];
    }
  },  

};