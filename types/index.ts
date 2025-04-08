export interface MapLocation {
  id: string;
  location__longitude: number;
  location__latitude: number;
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

