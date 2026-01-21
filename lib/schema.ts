import { pgTable, integer, varchar, numeric, serial, boolean, text, timestamp, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const dataCollectionForecastAccuracy = pgTable("data_collection_forecast_accuracy", {
    year: integer(),
    month: integer(),
    week: integer(),
    plant: varchar({ length: 50 }),
    businessUnit: varchar("business_unit", { length: 50 }),
    category: varchar({ length: 50 }),
    code: varchar({ length: 50 }),
    forecast: numeric(),
    produksi: numeric(),
    sales: numeric(),
    createdAt: timestamp("created_at", {
      mode: "date",
    }),
    upload_by: varchar({ length: 100 }),

});

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 20 }).default("officer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trendAnalysisMonthly = pgView("trend_analysis_monthly", {	year: integer(),
    month: integer(),
    overallAccuracy: numeric("overall_accuracy"),
    fishAccuracy: numeric("fish_accuracy"),
    shrimpAccuracy: numeric("shrimp_accuracy"),
    bestPerforming: varchar("best_performing"),
    worstPerforming: varchar("worst_performing"),
}).as(sql`WITH code_monthly_metrics AS ( SELECT t1.year, t1.month, t1.plant, t1.business_unit, t1.code, CASE WHEN sum(t1.forecast) <= 0::numeric OR sum(t1.sales) <= 0::numeric THEN 0.0 WHEN (abs(sum(t1.forecast) - sum(t1.sales)) / NULLIF(sum(t1.forecast), 0::numeric)) > 1::numeric THEN 0.0 ELSE abs(sum(t1.forecast) - sum(t1.sales)) / NULLIF(sum(t1.forecast), 0::numeric) END::numeric(18,10) AS valid_error_value FROM data_collection_forecast_accuracy t1 GROUP BY t1.year, t1.month, t1.plant, t1.business_unit, t1.code ), monthly_accuracy AS ( SELECT t2.year, t2.month, 1.0 - COALESCE(sum(t2.valid_error_value) FILTER (WHERE t2.valid_error_value > 0::numeric) / NULLIF(count(t2.valid_error_value) FILTER (WHERE t2.valid_error_value > 0::numeric), 0)::numeric, 0::numeric) AS overall_accuracy, 1.0 - COALESCE(sum(t2.valid_error_value) FILTER (WHERE t2.business_unit::text = 'fish'::text AND t2.valid_error_value > 0::numeric) / NULLIF(count(t2.valid_error_value) FILTER (WHERE t2.business_unit::text = 'fish'::text AND t2.valid_error_value > 0::numeric), 0)::numeric, 0::numeric) AS fish_accuracy, 1.0 - COALESCE(sum(t2.valid_error_value) FILTER (WHERE t2.business_unit::text = 'shrimp'::text AND t2.valid_error_value > 0::numeric) / NULLIF(count(t2.valid_error_value) FILTER (WHERE t2.business_unit::text = 'shrimp'::text AND t2.valid_error_value > 0::numeric), 0)::numeric, 0::numeric) AS shrimp_accuracy FROM code_monthly_metrics t2 GROUP BY t2.year, t2.month ), plant_monthly_accuracy AS ( SELECT t3.year, t3.month, t3.plant, 1.0 - COALESCE(sum(t3.valid_error_value) / NULLIF(count( CASE WHEN t3.valid_error_value > 0::numeric THEN 1 ELSE NULL::integer END), 0)::numeric, '-1.0'::numeric) AS plant_accuracy FROM code_monthly_metrics t3 GROUP BY t3.year, t3.month, t3.plant ), best_worst_plants AS ( SELECT DISTINCT t4.year, t4.month, first_value(t4.plant) OVER (PARTITION BY t4.year, t4.month ORDER BY t4.plant_accuracy DESC, t4.plant RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS best_performing, first_value(t4.plant) OVER (PARTITION BY t4.year, t4.month ORDER BY t4.plant_accuracy, t4.plant RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS worst_performing FROM plant_monthly_accuracy t4 WHERE t4.plant_accuracy >= 0::numeric ) SELECT m.year, m.month, CASE WHEN round(m.overall_accuracy, 4) = 0.0000 THEN NULL::numeric ELSE round(m.overall_accuracy, 4) END AS overall_accuracy, CASE WHEN round(m.fish_accuracy, 4) = 0.0000 THEN NULL::numeric ELSE round(m.fish_accuracy, 4) END AS fish_accuracy, CASE WHEN round(m.shrimp_accuracy, 4) = 0.0000 THEN NULL::numeric ELSE round(m.shrimp_accuracy, 4) END AS shrimp_accuracy, w.best_performing, w.worst_performing FROM monthly_accuracy m JOIN best_worst_plants w ON m.year = w.year AND m.month = w.month ORDER BY m.year, m.month`);

export const plantPerformanceDetailMonthly = pgView("plant_performance_detail_monthly", {	plant: varchar({ length: 50 }),
    businessUnit: varchar("business_unit", { length: 50 }),
    year: integer(),
    jan: numeric(),
    feb: numeric(),
    mar: numeric(),
    apr: numeric(),
    may: numeric(),
    jun: numeric(),
    jul: numeric(),
    aug: numeric(),
    sep: numeric(),
    oct: numeric(),
    nov: numeric(),
    dec: numeric(),
    ytdAvg: numeric("ytd_avg"),
    vsTarget: numeric("vs_target"),
}).as(sql`WITH code_summary AS ( SELECT t1.year, t1.month, t1.plant, t1.business_unit, t1.code, sum(t1.forecast) AS sum_f, sum(t1.sales) AS sum_s FROM data_collection_forecast_accuracy t1 GROUP BY t1.year, t1.month, t1.plant, t1.business_unit, t1.code ), code_error_monthly AS ( SELECT t2.year, t2.month, t2.plant, t2.business_unit, t2.code, t2.sum_f, t2.sum_s, CASE WHEN t2.sum_f <= 0::numeric OR t2.sum_s <= 0::numeric THEN 0.0 WHEN (abs(t2.sum_f - t2.sum_s) / NULLIF(t2.sum_f, 0::numeric)) > 1::numeric THEN 0.0 ELSE abs(t2.sum_f - t2.sum_s) / NULLIF(t2.sum_f, 0::numeric) END AS valid_error_value FROM code_summary t2 ), bu_monthly_avg_error AS ( SELECT t3.year, t3.month, t3.plant, t3.business_unit, COALESCE(sum(t3.valid_error_value) / NULLIF(count( CASE WHEN t3.valid_error_value > 0::numeric THEN 1 ELSE NULL::integer END), 0)::numeric, 0::numeric) AS average_error_rate_monthly, sum(t3.sum_f) AS total_monthly_f, sum(t3.sum_s) AS total_monthly_s FROM code_error_monthly t3 GROUP BY t3.year, t3.month, t3.plant, t3.business_unit ), max_month AS ( SELECT code_summary.year, code_summary.plant, code_summary.business_unit, max(code_summary.month) AS bulan_akhir FROM code_summary GROUP BY code_summary.year, code_summary.plant, code_summary.business_unit ), code_accuracy_ytd AS ( SELECT cs.year, cs.plant, cs.business_unit, cs.code, sum(cs.sum_f) AS sum_f_ytd, sum(cs.sum_s) AS sum_s_ytd FROM code_summary cs JOIN max_month mm ON cs.year = mm.year AND cs.plant::text = mm.plant::text AND cs.business_unit::text = mm.business_unit::text WHERE cs.month <= mm.bulan_akhir GROUP BY cs.year, cs.plant, cs.business_unit, cs.code ), bu_avg_error_ytd AS ( SELECT t6.year, t6.plant, t6.business_unit, CASE WHEN t6.sum_f_ytd <= 0::numeric OR t6.sum_s_ytd <= 0::numeric THEN 0.0 WHEN (abs(t6.sum_f_ytd - t6.sum_s_ytd) / NULLIF(t6.sum_f_ytd, 0::numeric)) > 1::numeric THEN 0.0 ELSE abs(t6.sum_f_ytd - t6.sum_s_ytd) / NULLIF(t6.sum_f_ytd, 0::numeric) END AS valid_error_value_ytd, 1 AS group_key FROM code_accuracy_ytd t6 ), final_ytd_error AS ( SELECT bu_avg_error_ytd.year, bu_avg_error_ytd.plant, bu_avg_error_ytd.business_unit, COALESCE(sum(bu_avg_error_ytd.valid_error_value_ytd) / NULLIF(count( CASE WHEN bu_avg_error_ytd.valid_error_value_ytd > 0::numeric THEN 1 ELSE NULL::integer END), 0)::numeric, 0::numeric) AS average_error_rate_ytd FROM bu_avg_error_ytd GROUP BY bu_avg_error_ytd.year, bu_avg_error_ytd.plant, bu_avg_error_ytd.business_unit ), final_report AS ( SELECT t7.plant, t7.business_unit, t7.year, sum( CASE WHEN t7.month = 1 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS jan, sum( CASE WHEN t7.month = 2 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS feb, sum( CASE WHEN t7.month = 3 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS mar, sum( CASE WHEN t7.month = 4 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS apr, sum( CASE WHEN t7.month = 5 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS may, sum( CASE WHEN t7.month = 6 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS jun, sum( CASE WHEN t7.month = 7 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS jul, sum( CASE WHEN t7.month = 8 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS aug, sum( CASE WHEN t7.month = 9 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS sep, sum( CASE WHEN t7.month = 10 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS oct, sum( CASE WHEN t7.month = 11 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS nov, sum( CASE WHEN t7.month = 12 THEN round(1.0 - t7.average_error_rate_monthly, 4) ELSE NULL::numeric END) AS "dec" FROM bu_monthly_avg_error t7 GROUP BY t7.plant, t7.business_unit, t7.year ) SELECT t8.plant, t8.business_unit, t8.year, t8.jan, t8.feb, t8.mar, t8.apr, t8.may, t8.jun, t8.jul, t8.aug, t8.sep, t8.oct, t8.nov, t8."dec", round(1.0 - t9.average_error_rate_ytd, 4) AS ytd_avg, CASE WHEN t9.average_error_rate_ytd = 0::numeric THEN NULL::numeric ELSE round(1.0 - t9.average_error_rate_ytd - CASE WHEN t9.business_unit::text = 'fish'::text THEN 0.78 ELSE 0.70 END, 4) END AS vs_target FROM final_report t8 JOIN final_ytd_error t9 ON t8.year = t9.year AND t8.plant::text = t9.plant::text AND t8.business_unit::text = t9.business_unit::text ORDER BY t8.year, t8.plant, t8.business_unit`);
