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

  async getDashboardData(filters?: FilterState): Promise<any> {
    // Use POST if filters are provided; otherwise, GET.
    const method = filters ? "POST" : "GET";
    const body = filters ? JSON.stringify(filters) : undefined;
  
    const response = await fetch(`${API_BASE_URL}/api/statistics/`, {
      method,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": String(API_KEY),
      },
      credentials: "include",
      ...(filters && { body }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
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

const fetchSeverityStats = async (endpoint: string, filter?: FilterState) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Fetching severity stats from:', url);
    console.log('With filter:', filter);

    // If filter is provided, use the filter endpoint with POST method
    if (filter) {
      const filterUrl = `${API_BASE_URL}/api/severity-stats/filter/`;
      console.log('Using filter endpoint:', filterUrl);
      
      const response = await fetch(filterUrl, {
        method: 'POST',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": String(API_KEY),
        },
        credentials: "include",
        body: JSON.stringify({
          diseases: filter.diseases || [],
          locations: filter.locations || [],
          portals: filter.portals || [],
          level_of_alertness: filter.level_of_alertness || 0,
          start_date: filter.start_date || null,
          end_date: filter.end_date || null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Filter API Response:', data);
      return data;
    }

    // If no filter, use the regular GET endpoint
    const response = await fetch(url, {
      method: 'GET',
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

    const data = await response.json();
    console.log('API Response:', data);
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
  // GET endpoints for individual stats (used when no filter is applied)
  getDiseaseSeverityStats: (filter?: FilterState) => 
    fetchSeverityStats('/api/diseases/severity-stats/', filter),
  
  getProvinceSeverityStats: (filter?: FilterState) => 
    fetchSeverityStats('/api/locations/province/severity-stats/', filter),
  
  getCitySeverityStats: (filter?: FilterState) => 
    fetchSeverityStats('/api/locations/city/severity-stats/', filter),
  
  // Filter endpoint (used when filter is applied)
  getFilteredSeverityStats: (filter: FilterState) => 
    fetchSeverityStats('/api/severity-stats/filter/', filter)
};


