"use client";
import React, { useEffect, useState } from "react";
import PrevalenceCard from "./PrevalenceCard";
import GenderDonutChart from "./gender_distribution/GenderDonutChart";
import CaseNumberCard from "./cases_number/CaseNumberCard";
import AmChartTingkatanKasus from "./CasesLevel";
import AgeStatisticCard from "./age_statistic/AgeStatisticCard";
import PortalBarChart from "./sumberBerita/PortalBarChart";
import DetailDistribution from "./DetailDistribution";
import { DistributionData } from "@/types";

// Comprehensive interface for all statistics data
interface StatisticsData {
  // Disease case statistics
  prevalence_statistics: {
    prevalence: number;
    year: number;
    population: number;
  };
  severity_statistics: {
    total_cases: number;
    severity_counts: {
      Mortalitas?: number;
      Insiden?: number;
      Hospitalisasi?: number;
      [key: string]: number | undefined;
    };
  };
  age_statistics: any;
  gender_statistics: {
    male: number;
    female: number;
  };
  severity_dates_count_statistics: any;
  
  // News source statistics
  national_news_statistics: {
    top_national: Array<{ portal: string; count: number }>;
    all_national: Array<{ portal: string; news_count: number; disease_count: number }>;
  };
  local_portal_statistics: {
    top_local: Array<{ portal: string; count: number }>;
    all_local: Array<{ portal: string; news_count: number; disease_count: number }>;
  };
  healthcare_news_statistics: {
    top_healthcare: Array<{ portal: string; count: number }>;
    all_healthcare: Array<{ portal: string; news_count: number; disease_count: number }>;
  };
}

// Initial empty state with proper structure
const initialData: StatisticsData = {
  // Disease case statistics
  prevalence_statistics: {
    prevalence: 0,
    year: 0,
    population: 0
  },
  severity_statistics: {
    total_cases: 0,
    severity_counts: {}
  },
  age_statistics: {},
  gender_statistics: {
    male: 0,
    female: 0
  },
  severity_dates_count_statistics: {},
  
  // News source statistics
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

const GeneralInformation = () => {
  const [data, setData] = useState<StatisticsData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for detail modal
  const [modalData, setModalData] = useState<{
    isShowModal: boolean;
    title: string;
    data: DistributionData[];
  }>({
    isShowModal: false,
    title: "",
    data: []
  });

  // Handle view details button click
  const handleViewDetails = (title: string, detailData: Array<{ portal: string; news_count: number; disease_count: number }>) => {
    setModalData({
      isShowModal: true,
      title,
      data: detailData
    });
  };

  // Function to close the modal
  const closeModal = () => {
    setModalData(prev => ({
      ...prev,
      isShowModal: false
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/statistics/`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': String(process.env.NEXT_PUBLIC_API_KEY || ""),
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Fetched data:', responseData);
        
        // Validate the structure of the fetched data
        if (responseData) {
          // Set the data
          setData(responseData);
        } else {
          console.error('Invalid data structure received from API');
          setError('Data yang diterima tidak sesuai format');
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Terjadi kesalahan saat mengambil data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Show loading state if data is being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 h-64">
        <p className="text-gray-500">Memuat data...</p>
      </div>
    );
  }

  // Show error state if there was an error
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-transparent text-black p-4 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-blue-900 mb-6">
        Informasi Kasus Penyakit Menular
      </h2>

      <div className="flex flex-col gap-6">
        {/* Disease statistics section */}
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

        {/* Cases level chart */}
        <AmChartTingkatanKasus jsonData={{ data: data.severity_dates_count_statistics }} />
        
        {/* News source distribution section */}
        <div className="flex flex-col gap-4 mt-4">
          {data.national_news_statistics.top_national.length > 0 && (
            <PortalBarChart 
              title="Distribusi Sumber Berita (Nasional)"
              data={data.national_news_statistics.top_national}
              detailData={data.national_news_statistics.all_national}
              onViewDetails={handleViewDetails}
              index={0}
            />
          )}
          
          {data.local_portal_statistics.top_local && data.local_portal_statistics.top_local.length > 0 && (
            <PortalBarChart 
              title="Distribusi Sumber Berita (Lokal)"
              data={data.local_portal_statistics.top_local}
              detailData={data.local_portal_statistics.all_local}
              onViewDetails={handleViewDetails}
              index={1}
            />
          )}
          
          {data.healthcare_news_statistics.top_healthcare.length > 0 && (
            <PortalBarChart 
              title="Distribusi Sumber Berita (Bidang Kesehatan)"
              data={data.healthcare_news_statistics.top_healthcare}
              detailData={data.healthcare_news_statistics.all_healthcare}
              onViewDetails={handleViewDetails}
              index={2}
            />
          )}
        </div>
      </div>

      {/* Detail modal */}
      <DetailDistribution
        data={modalData.data}
        title={modalData.title}
        isShowModal={modalData.isShowModal}
        setIsShowModal={closeModal}
      />
    </div>
  );
};

export default GeneralInformation;