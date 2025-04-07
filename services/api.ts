import { MapLocation, FilterState} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export const mapApi = {
  async getLocations(): Promise<MapLocation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/locations/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': String(API_KEY),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },

  async getFilteredLocations(filters: FilterState): Promise<MapLocation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/locations/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': String(API_KEY),
        },
        credentials: 'include',
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching filtered locations:', error);
      throw error;
    }
  },

  async getCaseDetail(caseId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": String(API_KEY),
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching case detail:", error);
      throw error;
    }
  }
};

const fetchSeverityStats = async (endpoint: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": String(API_KEY),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => ({
      name: item.name,
      hospitalisasi: item.severity_counts.hospitalisasi,
      insiden: item.severity_counts.insiden,
      mortalitas: item.severity_counts.mortalitas,
      total_cases: item.total_cases
    }));
  } catch (error) {
    console.error(`Error fetching severity stats from ${endpoint}:`, error);
    throw error;
  }
};

export const severityApi = {
  async getDiseaseSeverityStats() {
    return fetchSeverityStats('/api/diseases/severity-stats/');
  },
  async getProvinceSeverityStats() {
    return fetchSeverityStats('/api/locations/province/severity-stats/');
  },
  async getCitySeverityStats() {
    return fetchSeverityStats('/api/locations/city/severity-stats/');
  }
};
