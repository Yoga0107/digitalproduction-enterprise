import Navigation from "@/components/dashboard/Navigation";
import FilterGroup from "@/components/dashboard/filterGroup";
import UploadButton from "@/components/dashboard/UploadButton";
import DownloadButton from "@/components/dashboard/downloadButton";
import { ForecastAccuracyService } from "@/services/forecastAccuracy";

export default async function PerformanceDetailPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const params = await searchParams;
  const options = await ForecastAccuracyService.getFilterOptions();

  const selectedYear = params.year
    ? Number(params.year.split(",")[0])
    : options.year[0];

  const filters = { year: selectedYear };

  const performanceData =
    await ForecastAccuracyService.getMonthlyPerformance(filters);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#FF8C00] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid gap-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-center">
            <div className="grid gap-1 text-center lg:text-left">
              <h1 className="text-2xl font-black tracking-tighter uppercase">
                Monitoring Forecast Accuracy
              </h1>
              <p className="text-xs md:text-sm italic opacity-80 text-orange-100">
                Striving to achieve the best planning process
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Navigation />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-end border-t border-white/20 pt-4">
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              <FilterGroup
                options={options}
                showMonth={false}
                showPlant={false}
              />
            </div>

            <div className="flex justify-center lg:justify-end gap-3">
                <DownloadButton />
                <UploadButton />
            </div>
          </div>
        </div>
      </header>

      <section className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] table-fixed border-collapse">
              <thead>
                <tr className="bg-[#00C9A7] text-white uppercase tracking-wider font-bold">
                  <th className="w-[80px] px-4 py-3 sticky left-0 z-20 bg-[#00C9A7]">
                    Plant
                  </th>
                  <th className="w-[100px] px-4 py-3 sticky left-[80px] z-20 bg-[#00C9A7]">
                    Segment
                  </th>
                  <th className="w-[60px] px-4 py-3 text-center sticky left-[180px] z-20 bg-[#00C9A7]">
                    Year
                  </th>

                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((m) => (
                    <th
                      key={m}
                      className="w-[65px] px-2 py-3 text-center border-r border-white/10"
                    >
                      {m}
                    </th>
                  ))}

                  <th className="w-[80px] px-4 py-3 text-center border-r border-white/10">
                    YTD Avg
                  </th>
                  <th className="w-[80px] px-4 py-3 text-center border-r border-white/10">
                    VS Target
                  </th>
                  <th className="w-[80px] px-4 py-3 text-center border-r border-white/10">
                    Status
                  </th>
                  <th className="w-[150px] px-4 py-3">Action Needed</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {performanceData.length > 0 ? (
                  performanceData.map((row, idx) => {
                    const businessUnit =
                      row.businessUnit?.toLowerCase();
                    const target =
                      row.year >= 2026
                        ? 80
                        : businessUnit === "fish"
                        ? 78
                        : 70;

                    const vsT = row.ytdAvg - target;

                    let statusEmoji = "🔴";
                    let actionText = "Immediate Action";
                    let colorClass = "text-red-500";

                    if (vsT >= 0) {
                      statusEmoji = "🟢";
                      actionText = "-";
                      colorClass = "text-green-600";
                    } else if (vsT >= -20) {
                      statusEmoji = "🟡";
                      actionText = "Review Forecast Model";
                      colorClass = "text-yellow-600";
                    }

                    return (
                      <tr
                        key={idx}
                        className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 transition-colors group"
                      >
                        <td className="px-4 py-3 font-bold sticky left-0 bg-inherit truncate">
                          {row.plant}
                        </td>

                        <td className="px-4 py-3 uppercase sticky left-[80px] bg-inherit truncate">
                          {row.businessUnit}
                        </td>

                        <td className="px-4 py-3 text-center sticky left-[180px] bg-inherit border-r border-slate-200/50">
                          {row.year}
                        </td>

                        {row.monthlyData.map((m, i) => (
                          <td
                            key={i}
                            className={`px-2 py-3 text-center border-r border-slate-100 ${
                              m.value === 0
                                ? "text-slate-300"
                                : "font-medium text-slate-700"
                            }`}
                          >
                            {m.value > 0
                              ? `${m.value.toFixed(2)}%`
                              : "-"}
                          </td>
                        ))}

                        <td className="px-4 py-3 text-center font-bold border-r border-slate-100">
                          {row.ytdAvg.toFixed(2)}%
                        </td>

                        <td
                          className={`px-4 py-3 text-center font-bold border-r border-slate-100 ${colorClass}`}
                        >
                          {vsT > 0 ? "+" : ""}
                          {vsT.toFixed(2)}%
                        </td>

                        <td className="px-4 py-3 text-center text-lg border-r border-slate-100">
                          {statusEmoji}
                        </td>

                        <td
                          className={`px-4 py-3 italic ${
                            vsT >= 0
                              ? "text-slate-300"
                              : `font-medium ${colorClass}`
                          }`}
                        >
                          {actionText}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={20}
                      className="py-20 text-center text-slate-400 italic"
                    >
                      No data found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
