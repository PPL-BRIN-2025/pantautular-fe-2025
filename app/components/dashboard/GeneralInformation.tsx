import React from "react";
import PrevalenceCard from "./PrevalenceCard";
import GenderDonutChart from "./gender_distribution/GenderDonutChart";
import CaseNumberCard from "./cases_number/CaseNumberCard";
import AmChartTingkatanKasus from "./CasesLevel";
import AgeStatisticCard from "./age_statistic/AgeStatisticCard";

const GeneralInformation = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className="bg-transparent text-black p-4 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-blue-900 mb-6">
        Informasi Kasus Penyakit Menular
      </h2>

      <div className="flex flex-col gap-6">
        {/* Top row with two cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Case numbers card */}
            <CaseNumberCard
            jumlah_kasus={data.severity_statistics.total_cases}
            jumlah_kasus_kematian={data.severity_statistics.severity_counts.Mortalitas ?? 0}
            jumlah_kasus_terjangkit={data.severity_statistics.severity_counts.Insiden ?? 0}
            jumlah_kasus_sembuh={data.severity_statistics.severity_counts.Hospitalisasi ?? 0}
            />
            {/* Prevalence card */}
            <PrevalenceCard
            prevalenceRate={data.prevalence_statistics.prevalence}
            populationYear={data.prevalence_statistics.year}
            populationCount={data.prevalence_statistics.population}
            />
            {/* Age distribution card */}
            <AgeStatisticCard 
            data={data.age_statistics}
            />
            {/* Gender card */}
            <GenderDonutChart
            total={data.gender_statistics.male + data.gender_statistics.female}
            priaValue={data.gender_statistics.male}
            wanitaValue={data.gender_statistics.female}
            />
        </div>
        {/* Bottom row with cases level chart */}
        <AmChartTingkatanKasus jsonData={{ data: data.severity_dates_count_statistics }} />
      </div>
    </div>
  );
};
export default GeneralInformation;