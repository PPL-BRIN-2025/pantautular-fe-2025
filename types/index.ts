export interface MapLocation {
  id: string;
  location__longitude: number;
  location__latitude: number;
  location__province: string,
  city: string;
}

export interface MapConfig {
  zoomLevel: number;
  centerPoint: { longitude: number; latitude: number };
}

export interface FilterState {
  diseases: string[];
  locations: string[];
  level_of_alertness: number;
  portals: string[];
  start_date: null | Date;
  end_date: null | Date;
}

export interface DistributionData {
    portal: string;
    news_count: number;
    disease_count: number;
}

// Added StatisticsData interface to resolve duplication
export interface StatisticsData {
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
  age_statistics: {
    under_12: number;
    "12_25": number;
    "26_45": number;
    above_45: number;
  };
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

export interface ProvinceData {
  id: string;
  value: string | number;
}
