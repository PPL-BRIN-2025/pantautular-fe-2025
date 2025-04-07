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

export const severityApi = {
  async getDiseaseSeverityStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/diseases/severity-stats/`, {
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
      console.log('Disease data:', data); // Debug log
      return data.data.map((item: any) => ({
        name: item.name,
        hospitalisasi: item.severity_counts.hospitalisasi,
        insiden: item.severity_counts.insiden,
        mortalitas: item.severity_counts.mortalitas,
        total_cases: item.total_cases
      }));
    } catch (error) {
      console.error("Error fetching severity stats:", error);
      throw error;
    }
  },
  async getProvinceSeverityStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/province/severity-stats/`, {
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
      console.log('Province data:', data); // Debug log
      return data.data.map((item: any) => ({
        name: item.name,
        hospitalisasi: item.severity_counts.hospitalisasi,
        insiden: item.severity_counts.insiden,
        mortalitas: item.severity_counts.mortalitas,
        total_cases: item.total_cases
      }));
    } catch (error) {
      console.error("Error fetching province severity stats:", error);
      throw error;
    }
  },
  async getCitySeverityStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/city/severity-stats/`, {
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
      console.log('City data:', data); // Debug log
      return data.data.map((item: any) => ({
        name: item.name,
        hospitalisasi: item.severity_counts.hospitalisasi,
        insiden: item.severity_counts.insiden,
        mortalitas: item.severity_counts.mortalitas,
        total_cases: item.total_cases
      }));
    } catch (error) {
      console.error("Error fetching city severity stats:", error);
      throw error;
    }
  }
};
