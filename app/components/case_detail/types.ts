export interface News {
  img_url: string;
  url: string;
  date: string;
  title: string;
  domain: string;
  content: string;
}

export interface HealthProtocol {
  title: string;
  url: string;
}

export interface CaseDetailData {
  id: string;
  location: string;
  gender: string;
  age: number;
  level_of_alertness: number;
  related_search: string;
  news: News[];
  health_protocols: HealthProtocol[];
}

export interface CaseDetailProps {
  data: CaseDetailData;
  onClose?: () => void;
} 