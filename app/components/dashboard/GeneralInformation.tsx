"use client";
import React, { useEffect, useState } from "react";
import PrevalenceCard from "./PrevalenceCard";
import GenderDonutChart from "./gender_distribution/GenderDonutChart";
import CaseNumberCard from "./cases_number/CaseNumberCard";
import AmChartTingkatanKasus from "./CasesLevel";
import AgeStatisticCard from "./age_statistic/AgeStatisticCard";
import PortalBarChart from "./sumberBerita/PortalBarChart";
import DetailDistribution from "./DetailDistribution";
import { DistributionData, StatisticsData } from "@/types";

// Optional: initial data structure to fallback to if no data is provided.
const initialData: StatisticsData = {
  prevalence_statistics: {
    prevalence: 0,
    year: 0,
    population: 0
  },
  severity_statistics: {
    total_cases: 0,
    severity_counts: {}
  },
  age_statistics: {
    under_12: 0,
    "12_25": 0,
    "26_45": 0,
    above_45: 0
  },
  gender_statistics: {
    male: 0,
    female: 0
  },
  severity_dates_count_statistics: {},
  national_news_statistics: {
    top_national: [],
    all_national: []
  },
  local_portal_statistics: {
    top_local: [],
    all_local: []
  },
  healthcare_news_statistics: {
    top_healthcare: [],
    all_healthcare: []
  }
};

interface GeneralInformationProps {
  data?: StatisticsData;
}

const GeneralInformation = ({ data }: GeneralInformationProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);

  // State for detail modal data
  const [modalData, setModalData] = useState<{
    isShowModal: boolean;
    title: string;
    data: DistributionData[];
  }>({
    isShowModal: false,
    title: "",
    data: []
  });

  // Assume that when data is provided, loading is complete.
  useEffect(() => {
    setIsLoading(false); // Always set loading to false regardless of data presence
  }, [data]);

  // Handler for the "view details" action in the news section
  const handleViewDetails = (
    title: string,
    detailData: Array<{ portal: string; news_count: number; disease_count: number }>
  ) => {
    setModalData({
      isShowModal: true,
      title,
      data: detailData,
    });
  };

  // Handler to close the detail modal
  const closeModal = () => {
    setModalData((prev) => ({
      ...prev,
      isShowModal: false,
    }));
  };

  // Use provided data or fallback to the initialData structure
  const statsData = data || initialData;

  // Optionally log for debugging purposes
  console.log(statsData); /* istanbul ignore line */

  // Extract conditional content
  let contentToRender;
  /* istanbul ignore else */
  if (isLoading) {
    contentToRender = (
      <div className="flex justify-center p-8">
        <p>Memuat data...</p>
      </div>
    );
        
  } else if (error) {   /* istanbul ignore line */ 
    contentToRender = ( /* istanbul ignore line */
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  } else {
    contentToRender = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-6">
          {/* Disease Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Case Numbers Card */}
            <CaseNumberCard
              jumlah_kasus={statsData.severity_statistics.total_cases}
              jumlah_kasus_kematian={statsData.severity_statistics.severity_counts.mortalitas ?? 0}
              jumlah_kasus_terjangkit={statsData.severity_statistics.severity_counts.insiden ?? 0}
              jumlah_kasus_sembuh={statsData.severity_statistics.severity_counts.hospitalisasi ?? 0}
            />
            {/* Prevalence Card */}
            <PrevalenceCard
              prevalenceRate={statsData.prevalence_statistics.prevalence}
              populationYear={statsData.prevalence_statistics.year}
              populationCount={statsData.prevalence_statistics.population}
            />
            {/* Age Distribution Card */}
            <AgeStatisticCard
              data={{
                  under_12: statsData.age_statistics.under_12,
                  "12_25": statsData.age_statistics["12_25"],
                  "26_45": statsData.age_statistics["26_45"],
                  above_45: statsData.age_statistics.above_45,
              }}
              />

            {/* Gender Donut Chart */}
            <GenderDonutChart
              total={statsData.gender_statistics.male + statsData.gender_statistics.female}
              priaValue={statsData.gender_statistics.male}
              wanitaValue={statsData.gender_statistics.female}
            />
          </div>
          {/* Cases Level Chart */}
          <AmChartTingkatanKasus jsonData={{ data: statsData.severity_dates_count_statistics }} />
          
          {/* Added section title for news source distribution */}
          <div className="bg-[#ebf3f5] px-4 py-3 rounded-md">
            <span className="text-[#11234B] text-2xl font-semibold">
              Distribusi Sumber Berita
            </span>
          </div>
          
          {/* News Source Distribution Section */}
          <div className="flex flex-col gap-4">
              <PortalBarChart
                title="Distribusi Sumber Berita (Nasional)"
                data={statsData.national_news_statistics.top_national}
                detailData={statsData.national_news_statistics.all_national}
                onViewDetails={handleViewDetails}
                index={0}
              />
            
              <PortalBarChart
                title="Distribusi Sumber Berita (Lokal)"
                data={statsData.local_portal_statistics.top_local}
                detailData={statsData.local_portal_statistics.all_local}
                onViewDetails={handleViewDetails}
                index={1}
              />
            
              <PortalBarChart
                title="Distribusi Sumber Berita (Bidang Kesehatan)"
                data={statsData.healthcare_news_statistics.top_healthcare}
                detailData={statsData.healthcare_news_statistics.all_healthcare}
                onViewDetails={handleViewDetails}
                index={2}
              />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bg-transparent text-black">
      {/* Updated header with styled appearance */}
      <div className="bg-[#ebf3f5] px-4 py-3 rounded-md">
        <span className="text-[#11234B] text-2xl font-semibold">
          Informasi Kasus Penyakit Menular
        </span>
      </div>
      
      {contentToRender}
      
      {/* Detail Distribution Modal with Wrapper */}
      {modalData.isShowModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" data-testid="modal-wrapper">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative bg-white rounded-lg w-full max-w-3xl shadow-lg z-10">
            <DetailDistribution
              data={modalData.data}
              title={modalData.title}
              isShowModal={modalData.isShowModal}
              setIsShowModal={closeModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralInformation;
