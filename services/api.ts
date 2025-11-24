import { MapLocation, FilterState, ProvinceData, ExpertBatch, SpatialComparisonResponse } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;


export const mapApi = {
  async getLocations(): Promise<MapLocation[]> {
    try {
      const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch(`${API_BASE_URL}/cases/locations/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': String(API_KEY),
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
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
      const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const payload =
        filters.batch === undefined
          ? filters
          : { ...filters, batch: filters.batch ?? null };

      const response = await fetch(`${API_BASE_URL}/cases/locations/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': String(API_KEY),
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
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

  async getSpatialComparisons(payload: {
    regions: Array<Record<string, unknown>>;
  }): Promise<SpatialComparisonResponse> {
    try {
      const accessToken = typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null;
      const response = await fetch(`${API_BASE_URL}/cases/spatial-comparisons/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": String(API_KEY),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching spatial comparisons:", error);
      throw error;
    }
  },

  async getDashboardData(filters?: FilterState): Promise<any> {
    // Use POST if filters are provided; otherwise, GET.
    const shouldPost = Boolean(filters);
    const payload =
      filters && filters.batch !== undefined
        ? { ...filters, batch: filters.batch ?? null }
        : filters;
    const method = shouldPost ? "POST" : "GET";
    const body = shouldPost && payload ? JSON.stringify(payload) : undefined;
  
    const response = await fetch(`${API_BASE_URL}/api/statistics/`, {
      method,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": String(API_KEY),
      },
      credentials: "include",
      ...(body ? { body } : {}),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  async getCaseDetail(caseId: string): Promise<any> {
    try {
      const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": String(API_KEY),
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
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
  },

  async getProvinceData(dataType: string): Promise<ProvinceData[]> {
    try {
      const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch(`${API_BASE_URL}/api/province-${dataType}/`, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': String(API_KEY),
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
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
  },

  async getExpertBatches(): Promise<ExpertBatch[]> {
    try {
      const accessToken = typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null;
      const response = await fetch(`${API_BASE_URL}/expert-feature/experts/batches/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": String(API_KEY),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payload = await response.json();
      if (Array.isArray(payload)) {
        return payload;
      }

      if (payload && Array.isArray(payload.results)) {
        return payload.results;
      }

      return [];
    } catch (error) {
      console.error("Error fetching expert batches:", error);
      throw error;
    }
  },
};

const fetchSeverityStats = async (endpoint: string, filter?: FilterState) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    /* istanbul ignore next */
    console.log('Fetching severity stats from:', url);
    /* istanbul ignore next */
    console.log('With filter:', filter);

    // If filter is provided, use the filter endpoint with POST method
    if (filter) {
      const filterUrl = `${API_BASE_URL}/api/severity-stats/filter/`;
      /* istanbul ignore next */
      console.log('Using filter endpoint:', filterUrl);
      
      const payload: Record<string, unknown> = {
        diseases: filter.diseases || [],
        locations: filter.locations || [],
        portals: filter.portals || [],
        level_of_alertness: filter.level_of_alertness || 0,
        start_date: filter.start_date || null,
        end_date: filter.end_date || null,
      };

      if (filter.batch !== undefined) {
        payload.batch = filter.batch ?? null;
      }

      /* istanbul ignore next */
      const response = await fetch(filterUrl, {
        method: 'POST',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": String(API_KEY),
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      /* istanbul ignore next */
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
    /* istanbul ignore next */
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

export const registryApi = {
  // Fetch list of known diseases from backend. Returns array of names (strings).
  async getDiseases(): Promise<string[]> {
    const endpoints = [
      `${API_BASE_URL}/api/diseases/`,
      `${API_BASE_URL}/diseases/`,
      `${API_BASE_URL}/cases/diseases/`,
    ];
    const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': String(API_KEY),
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
          credentials: 'include',
        });
        if (!response.ok) {
          // try next endpoint on 404 specifically
          if (response.status === 404) continue;
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          return data.map((item: any) => (typeof item === 'string' ? item : item.name || String(item)));
        }
        return [];
      } catch (error) {
        // log and continue to try next endpoint
        console.warn(`getDiseases: failed to fetch from ${url}:`, error);
        continue;
      }
    }
    const err = new Error('Unable to fetch diseases from known endpoints');
    // mark the error so callers can show a friendly message when the registry endpoints don't exist
    (err as any).endpointNotFound = true;
    console.error('Error fetching diseases:', err);
    throw err;
  },

  // Create a new disease entry in backend. Accepts the disease name string.
  async createDisease(name: string): Promise<any> {
    const endpoints = [
      `${API_BASE_URL}/api/diseases/`,
      `${API_BASE_URL}/diseases/`,
      `${API_BASE_URL}/cases/diseases/`,
    ];
    for (const url of endpoints) {
      try {
        const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': String(API_KEY),
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          // if 404 try next endpoint, otherwise parse error payload and throw
          if (response.status === 404) {
            console.warn(`createDisease: 404 at ${url}, trying alternate endpoint`);
            continue;
          }
          const payload = await response.json().catch(() => ({}));
          const errMsg = payload.detail || payload.error || `HTTP error! status: ${response.status}`;
          const err = new Error(errMsg as string);
          (err as any).status = response.status;
          throw err;
        }

        const data = await response.json().catch(() => null);
        // normalize return: if backend returns object with name, return that; if string, return it
        if (typeof data === 'string') return { name: data };
        if (data && typeof data === 'object') {
          // prefer name, title, label
          const nameVal = data.name || data.title || data.label || null;
          return { ...data, name: nameVal || name };
        }
        return { name };
      } catch (error) {
        console.warn('createDisease attempt failed:', error);
        // if this was the last endpoint, rethrow
        // otherwise, try next
        continue;
      }
    }
    const err = new Error('Unable to create disease; all endpoints failed');
    (err as any).endpointNotFound = true;
    console.error('Error creating disease:', err);
    throw err;
  },

  // Create a new location entry in backend. The backend endpoint used here mirrors getLocations().
  // We send { name } and rely on backend to accept it (assumption: API supports creating locations this way).
  // Create a new location entry in backend. Accepts the location name and optional latitude/longitude.
  async createLocation(name: string, latitude?: number | null, longitude?: number | null): Promise<any> {
    try {
      const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const body: any = { name };
      if (latitude !== undefined && latitude !== null && !Number.isNaN(Number(latitude))) body.latitude = Number(latitude);
      if (longitude !== undefined && longitude !== null && !Number.isNaN(Number(longitude))) body.longitude = Number(longitude);

      const response = await fetch(`${API_BASE_URL}/cases/locations/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': String(API_KEY),
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const err = new Error(payload.detail || payload.error || `HTTP error! status: ${response.status}`);
        (err as any).status = response.status;
        throw err;
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  },
};

export const logsApi = {
  async logDownload(params: { username?: string; chartType: string; timestamp: string }) {
    const { username, chartType, timestamp } = params;
    try {
      const response = await fetch(`${API_BASE_URL}/api/logs/download`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': String(API_KEY),
        },
        credentials: 'include',
        body: JSON.stringify({ username, chart_type: chartType, timestamp }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('Error logging download event:', error);
      // Do not rethrow; logging should not break UI flows
      return { ok: false } as const;
    }
  }
}

export const emailSubmitAPI = {
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/authentication/password-reset-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': String(API_KEY),
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error ?? 'Terjadi kesalahan. Silakan coba lagi.' };
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return { success: false, error: 'Terjadi kesalahan jaringan. Coba lagi nanti.' };
    }
  }
};

export const resetPasswordApi = {
  async resetPassword(uid: string, token: string, password: string, confirmPassword: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/authentication/password-reset-confirm/${uid}/${token}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': String(API_KEY),
        },
        credentials: 'include',
        body: JSON.stringify({
          password: password,
          "password-confirm": confirmPassword
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail ?? `Error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
};
