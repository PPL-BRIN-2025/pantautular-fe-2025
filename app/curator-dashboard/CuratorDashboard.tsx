"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import FilterSection from "../components/dashboard/FilterSection";
import PrevalenceCard from "../components/dashboard/PrevalenceCard";
import CaseNumberCard from "../components/dashboard/cases_number/CaseNumberCard";
import AgeStatisticCard from "../components/dashboard/age_statistic/AgeStatisticCard";
import GenderDonutChart from "../components/dashboard/gender_distribution/GenderDonutChart";
import AmChartTingkatanKasus from "../components/dashboard/CasesLevel";
import PortalBarChart from "../components/dashboard/sumberBerita/PortalBarChart";
import type { DistributionData, FilterStateDashboard } from "@/types";
import type {
  AgeDistribution,
  ChartFilters,
  ChartsPayload,
  GenderDistribution as GenderSection,
  NewsSection,
  SeverityDistribution,
  TrendDistribution,
} from "@/types/curatorCharts";
import { getCharts, getChartsFiltered } from "@/api/curatorCharts";
 
 const DEBOUNCE_MS = 300;
 
 const NoDataCard = ({ message }: { message?: string }) => (
   <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
     {message ?? "No data"}
   </div>
 );
 
 const normalizeFilters = (filterState: FilterStateDashboard): ChartFilters => {
   const { diseases, locations, portals, level_of_alertness, start_date, end_date } = filterState;
   const startDate = start_date ? start_date.toISOString().split("T")[0] : undefined;
   const endDate = end_date ? end_date.toISOString().split("T")[0] : undefined;
 
   return {
     diseases: diseases.length ? diseases : undefined,
     provinces: locations.provinces.length ? locations.provinces : undefined,
     cities: locations.cities.length ? locations.cities : undefined,
     portals: portals.length ? portals : undefined,
     alertLevels: level_of_alertness > 0 ? level_of_alertness : undefined,
     startDate,
     endDate,
   };
 };
 
 const collectSeverityCounts = (distribution?: SeverityDistribution) => {
   const points = distribution?.data ?? [];
   const counts = {
     total: 0,
     hospitalisasi: 0,
     insiden: 0,
     mortalitas: 0,
   };
 
   points.forEach(({ severity, count }) => {
     counts.total += count;
     const key = severity.trim().toLowerCase();
     if (key.includes("mortal") || key.includes("death") || key.includes("fatal")) {
       counts.mortalitas += count;
     } else if (key.includes("hospital") || key.includes("rawat")) {
       counts.hospitalisasi += count;
     } else if (key.includes("insiden") || key.includes("case") || key.includes("kasus") || key.includes("confirmed")) {
       counts.insiden += count;
     }
   });
 
   return { counts, points };
 };
 
 const mapAgeBuckets = (distribution?: AgeDistribution) => {
   const base = {
     under_12: 0,
     "12_25": 0,
     "26_45": 0,
     above_45: 0,
   };
 
   (distribution?.data ?? []).forEach(({ group, count }) => {
     const key = group.trim().toLowerCase();
     if (key.includes("under") || key.includes("<") || key.includes("below")) {
       base.under_12 = count;
     } else if (key.includes("12") && key.includes("25")) {
       base["12_25"] = count;
     } else if (key.includes("26") && key.includes("45")) {
       base["26_45"] = count;
     } else if (key.includes("45") || key.includes("+") || key.includes("above")) {
       base.above_45 = count;
     }
   });
 
   return base;
 };
 
 const toSeverityBarData = (points: SeverityDistribution["data"]) =>
   points.map(({ severity, count }) => ({
     portal: severity,
     count,
   }));
 
 const toTrendMap = (trend?: TrendDistribution) => {
   const map: Record<string, { date: string; count: number }[]> = {};
   (trend?.data ?? []).forEach(({ severity, points }) => {
     map[severity] = points.map(({ date, count }) => ({ date, count }));
   });
   return map;
 };
 
 const hasTrendData = (trendMap: Record<string, { date: string; count: number }[]>) =>
   Object.values(trendMap).some((series) => series.length > 0);
 
 const hasNewsItems = (section?: NewsSection) =>
   Boolean(section && section.data.top && section.data.top.length > 0);
 
 const hasGenderData = (gender?: GenderSection) => {
   const data = gender?.data;
   if (!data) return false;
   return (data.male ?? 0) > 0 || (data.female ?? 0) > 0;
 };
 
 const hasAgeData = (age?: AgeDistribution) => (age?.data ?? []).some((item) => item.count > 0);
 
 const CuratorDashboard: React.FC = () => {
   const [chartsPayload, setChartsPayload] = useState<ChartsPayload | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [isFiltering, setIsFiltering] = useState(false);
   const [filtersApplied, setFiltersApplied] = useState(false);
   const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
 
   const loadInitialCharts = useCallback(async () => {
     try {
       setLoading(true);
       setError(null);
       const payload = await getCharts();
       setChartsPayload(payload);
       setFiltersApplied(Boolean(payload.meta?.filtersApplied));
     } catch (err) {
       const message = err instanceof Error ? err.message : "Failed to load charts";
       setError(message);
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => {
     void loadInitialCharts();
     return () => {
       if (pendingTimer.current) {
         clearTimeout(pendingTimer.current);
       }
     };
   }, [loadInitialCharts]);
 
   const applyFilters = useCallback((filters: ChartFilters) => {
     if (pendingTimer.current) {
       clearTimeout(pendingTimer.current);
     }
 
     setError(null);
     setIsFiltering(true);
 
     pendingTimer.current = setTimeout(async () => {
       try {
         const payload = await getChartsFiltered(filters);
         setChartsPayload(payload);
         setFiltersApplied(Boolean(payload.meta?.filtersApplied));
       } catch (err) {
         const message = err instanceof Error ? err.message : "Failed to apply filters";
         setError(message);
       } finally {
         setIsFiltering(false);
       }
     }, DEBOUNCE_MS);
   }, []);
 
   const handleFilterSubmit = useCallback(
     (state: FilterStateDashboard) => {
       const normalized = normalizeFilters(state);
       applyFilters(normalized);
     },
     [applyFilters],
   );
 
   const handleFilterError = useCallback((message: string) => {
     setError(message);
   }, []);
 
   const severitySummary = useMemo(() => collectSeverityCounts(chartsPayload?.data?.severity), [chartsPayload]);
   const ageBuckets = useMemo(() => mapAgeBuckets(chartsPayload?.data?.age), [chartsPayload]);
   const severityBar = useMemo(() => toSeverityBarData(severitySummary.points), [severitySummary]);
   const trendMap = useMemo(() => toTrendMap(chartsPayload?.data?.trend), [chartsPayload]);
 
   const prevalenceData = chartsPayload?.data?.prevalence?.data;
   const genderData = chartsPayload?.data?.gender;
   const newsData = chartsPayload?.data?.news;
 
   const trendError = chartsPayload?.data?.trend?.meta?.error;
   const severityError = chartsPayload?.data?.severity?.meta?.error;
   const ageError = chartsPayload?.data?.age?.meta?.error;
   const genderError = chartsPayload?.data?.gender?.meta?.error;
   const prevalenceError = chartsPayload?.data?.prevalence?.meta?.error;
 
  const nationalNews = newsData?.national;
  const localNews = newsData?.local;
  const healthcareNews = newsData?.healthcare;

   const renderSeveritySection = () => {
     if (severityError) {
       return <NoDataCard message={severityError || "No data"} />;
     }
     if (!severityBar.length) {
       return <NoDataCard message="Tidak ada data tingkat keparahan." />;
     }
    return (
      <PortalBarChart
        title="Distribusi Tingkat Keparahan"
        data={severityBar}
        detailData={severityBar.map((item) => ({
          portal: item.portal,
          news_count: item.count,
          disease_count: item.count,
        })) as DistributionData[]}
      />
    );
  };
 
   const renderTrendSection = () => {
     if (trendError) {
       return <NoDataCard message={trendError || "Tidak ada data tren kasus."} />;
     }
     if (!hasTrendData(trendMap)) {
       return <NoDataCard message="Tidak ada data tren kasus." />;
     }
    return <AmChartTingkatanKasus jsonData={{ data: trendMap }} />;
   };
 
   const renderAgeSection = () => {
     if (ageError) {
       return <NoDataCard message={ageError || "Tidak ada data usia."} />;
     }
     if (!hasAgeData(chartsPayload?.data?.age)) {
       return <NoDataCard message="Tidak ada data usia." />;
     }
    return <AgeStatisticCard data={ageBuckets} />;
   };
 
   const renderGenderSection = () => {
     if (genderError) {
       return <NoDataCard message={genderError || "Tidak ada data gender."} />;
     }
     if (!hasGenderData(genderData)) {
       return <NoDataCard message="Tidak ada data gender." />;
     }
     return (
      <GenderDonutChart
        total={(genderData?.data?.male ?? 0) + (genderData?.data?.female ?? 0)}
        priaValue={genderData?.data?.male ?? 0}
        wanitaValue={genderData?.data?.female ?? 0}
      />
     );
   };
 
   const renderPrevalenceSection = () => {
     if (prevalenceError) {
       return <NoDataCard message={prevalenceError || "Tidak ada data prevalensi."} />;
     }
     if (!prevalenceData) {
       return <NoDataCard message="Tidak ada data prevalensi." />;
     }
     return (
       <PrevalenceCard
         prevalenceRate={prevalenceData.prevalence}
         populationYear={prevalenceData.year}
         populationCount={prevalenceData.population ?? prevalenceData.totalCases}
       />
     );
   };
 
   const renderNewsSection = (title: string, section?: NewsSection) => {
     if (!section) {
       return <NoDataCard message="Tidak ada data sumber berita." />;
     }
     if (section.meta?.error) {
       return <NoDataCard message={section.meta.error || "Tidak ada data sumber berita."} />;
     }
     if (!hasNewsItems(section)) {
       return <NoDataCard message="Tidak ada data sumber berita." />;
     }
     return (
      <PortalBarChart
        title={title}
        data={section.data.top}
        detailData={(section.data.all ?? []) as DistributionData[]}
      />
     );
   };
 
   const renderCaseNumbers = () => {
     if (!severitySummary.counts.total) {
       if (severityError) {
         return <NoDataCard message={severityError} />;
       }
       return <NoDataCard message="Tidak ada data kasus." />;
     }
     return (
       <CaseNumberCard
         jumlah_kasus={severitySummary.counts.total}
         jumlah_kasus_kematian={severitySummary.counts.mortalitas}
         jumlah_kasus_terjangkit={severitySummary.counts.insiden}
         jumlah_kasus_sembuh={severitySummary.counts.hospitalisasi}
       />
     );
   };
 
   return (
     <div className="min-h-screen bg-[#ebf3f5]">
       <Navbar />
       <div className="flex flex-col gap-6 px-4 py-6 lg:flex-row">
         <div className="lg:w-1/3 xl:w-1/4">
           <FilterSection onSubmitFilterState={handleFilterSubmit} onError={handleFilterError} />
         </div>
         <div className="flex-1 space-y-6">
           <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow">
             <div>
               <h1 className="text-lg font-semibold text-[#11234B]">Kurator Dashboard</h1>
               <p className="text-sm text-gray-500">
                 {filtersApplied ? "Filter aktif diterapkan pada data." : "Menampilkan semua data kurator."}
               </p>
             </div>
             {(loading || isFiltering) && (
               <div className="flex items-center gap-2 text-sm text-blue-600">
                 <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
                 {loading ? "Memuat data..." : "Menerapkan filter..."}
               </div>
             )}
           </div>
 
           {error && (
             <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
               {error}
             </div>
           )}
 
           {loading && !chartsPayload ? (
             <NoDataCard message="Memuat data kurator..." />
           ) : (
             <>
               <div className="grid gap-4 lg:grid-cols-2">
                 {renderCaseNumbers()}
                 {renderPrevalenceSection()}
               </div>
 
               <div className="grid gap-4 lg:grid-cols-2">
                 {renderAgeSection()}
                 {renderGenderSection()}
               </div>
 
               {renderSeveritySection()}
               {renderTrendSection()}
 
               <div>
                 <h2 className="mb-3 text-xl font-semibold text-[#11234B]">Distribusi Sumber Berita</h2>
                 <div className="grid gap-4 lg:grid-cols-3">
                   {renderNewsSection("Nasional", nationalNews)}
                   {renderNewsSection("Lokal", localNews)}
                   {renderNewsSection("Kesehatan", healthcareNews)}
                 </div>
               </div>
             </>
           )}
         </div>
       </div>
     </div>
   );
 };
 
 export default CuratorDashboard;
