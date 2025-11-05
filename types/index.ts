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

export interface FilterStateDashboard {
  diseases: string[];
  locations: {
    provinces: string[];
    cities: string[];
  };
  level_of_alertness: number;
  portals: string[];
  start_date: null | Date;
  end_date: null | Date;
  batch?: string | null;
}

export interface FilterState {
  diseases: string[];
  locations: string[];
  level_of_alertness: number;
  portals: string[];
  start_date: null | Date;
  end_date: null | Date;
  batch?: string | null;
}

export interface DistributionData {
    portal: string;
    news_count: number;
    disease_count: number;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  detail: string;
  access_token: string;
}

export interface TokenPayload {
  email: string;
  exp: number;
  iat: number;
  jti: string;
  name: string;
  role: string;
  token_type: string;
  user_id: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
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
  status: string | null;
}

export interface ExpertBatch {
  id: string;
  filename: string;
  uploaded_at: string;
  total_cases: number;
}

export const TEMPERATURE_COLORS: Record<number, string> = {
  [-10]: "#0000FF", // 0, 0, 255
  [-9]: "#0019FF", // 0, 25, 255
  [-8]: "#0033FF", // 0, 51, 255
  [-7]: "#004CFF", // 0, 76, 255
  [-6]: "#0066FF", // 0, 102, 255
  [-5]: "#007FFF", // 0, 127, 255
  [-4]: "#0099FF", // 0, 153, 255
  [-3]: "#00B2FF", // 0, 178, 255
  [-2]: "#00CCFF", // 0, 204, 255
  [-1]: "#00E5FF", // 0, 229, 255
  [0]: "#00FFFF", // 0, 255, 255
  [1]: "#00FFE5", // 0, 255, 229
  [2]: "#00FFCC", // 0, 255, 204
  [3]: "#00FFB2", // 0, 255, 178
  [4]: "#00FF99", // 0, 255, 153
  [5]: "#00FF7F", // 0, 255, 127
  [6]: "#00FF66", // 0, 255, 102
  [7]: "#00FF4C", // 0, 255, 76
  [8]: "#00FF33", // 0, 255, 51
  [9]: "#00FF19", // 0, 255, 25
  [10]: "#00FF00", // 0, 255, 0
  [11]: "#19FF00", // 25, 255, 0
  [12]: "#33FF00", // 51, 255, 0
  [13]: "#4CFF00", // 76, 255, 0
  [14]: "#66FF00", // 102, 255, 0
  [15]: "#7FFF00", // 127, 255, 0
  [16]: "#99FF00", // 153, 255, 0
  [17]: "#B2FF00", // 178, 255, 0
  [18]: "#CCFF00", // 204, 255, 0
  [19]: "#E5FF00", // 229, 255, 0
  [20]: "#FFFF00", // 255, 255, 0
  [21]: "#FFFF00", // 255, 255, 0
  [22]: "#FFF700", // 255, 247, 0
  [23]: "#FFEE00", // 255, 238, 0
  [24]: "#FFE500", // 255, 229, 0
  [25]: "#FFD200", // 255, 210, 0
  [26]: "#FFC900", // 255, 201, 0
  [27]: "#FFC000", // 255, 192, 0
  [28]: "#FFB700", // 255, 183, 0
  [29]: "#FFAE00", // 255, 174, 0
  [30]: "#FFA500", // 255, 165, 0
  [31]: "#FF9400", // 255, 148, 0
  [32]: "#FF8400", // 255, 132, 0
  [33]: "#FF7300", // 255, 115, 0
  [34]: "#FF6300", // 255, 99, 0
  [35]: "#FF5200", // 255, 82, 0
  [36]: "#FF4200", // 255, 66, 0
  [37]: "#FF3100", // 255, 49, 0
  [38]: "#FF2100", // 255, 33, 0
  [39]: "#FF1000", // 255, 16, 0
  [40]: "#FF0000"  // 255, 0, 0
};
