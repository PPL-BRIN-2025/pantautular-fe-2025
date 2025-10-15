export interface ChartFilters {
  diseases?: string[];
  provinces?: string[];
  cities?: string[];
  severityLevels?: string[];
  portals?: string[];
  alertLevels?: number | number[];
  startDate?: string;
  endDate?: string;
}

export interface SectionMeta {
  lastUpdated?: string;
  error?: string | null;
}

export interface SeverityPoint {
  severity: string;
  count: number;
}

export interface SeverityDistribution {
  data: SeverityPoint[];
  meta?: SectionMeta;
}

export interface AgePoint {
  group: string;
  count: number;
}

export interface AgeDistribution {
  data: AgePoint[];
  meta?: SectionMeta;
}

export interface GenderBreakdown {
  male: number;
  female: number;
}

export interface GenderDistribution {
  data: GenderBreakdown;
  meta?: SectionMeta;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TrendSeries {
  severity: string;
  points: TrendPoint[];
}

export interface TrendDistribution {
  data: TrendSeries[];
  meta?: SectionMeta;
}

export interface PrevalenceData {
  prevalence: number;
  year: number;
  totalCases: number;
  population?: number;
}

export interface PrevalenceStat {
  data: PrevalenceData;
  meta?: SectionMeta;
}

export interface NewsTopItem {
  portal: string;
  count: number;
}

export interface NewsDetailItem {
  portal: string;
  news_count: number;
  disease_count: number;
}

export interface NewsSection {
  data: {
    top: NewsTopItem[];
    all: NewsDetailItem[];
  };
  meta?: SectionMeta;
}

export interface ChartsPayload {
  data: {
    severity: SeverityDistribution;
    age: AgeDistribution;
    gender: GenderDistribution;
    trend: TrendDistribution;
    prevalence: PrevalenceStat;
    news: {
      national: NewsSection;
      local: NewsSection;
      healthcare: NewsSection;
    };
  };
  meta: {
    filtersApplied: boolean;
    generatedAt?: string;
  };
}
