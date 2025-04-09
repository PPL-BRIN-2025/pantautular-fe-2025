import { mapApi, severityApi } from "../../services/api";
import { FilterState } from '../../types';

describe('mapApi', () => {
    const mockResponse = [
        { id: 1, latitude: -6.200000, longitude: 106.816666 },
        { id: 2, latitude: -6.914744, longitude: 107.609810 }
    ];

    beforeEach(() => {
        global.fetch = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('getLocations', () => {
        it('should fetch locations successfully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await mapApi.getLocations();
            
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/cases/locations/`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': String(process.env.NEXT_PUBLIC_API_KEY),
                    },
                    credentials: 'include',
                }
            );
        });

        it('should handle HTTP error responses', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await expect(mapApi.getLocations()).rejects.toThrow('HTTP error! status: 404');
            expect(console.error).toHaveBeenCalled();
        });

        it('should handle network errors', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

            await expect(mapApi.getLocations()).rejects.toThrow('Network error');
            expect(console.error).toHaveBeenCalledWith('Error fetching locations:', networkError);
        });

        it('should handle empty response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([])
            });

            const result = await mapApi.getLocations();
            expect(result).toEqual([]);
        });
    });

    describe('getFilteredLocations', () => {
        const mockFilters = {
            diseases: ['Dengue'],
            locations: ['Jakarta'],
            level_of_alertness: 2,
            portals: ['news-portal-1'],
            start_date: new Date('2023-01-01'),
            end_date: new Date('2023-12-31')
        };

        it('should fetch filtered locations successfully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await mapApi.getFilteredLocations(mockFilters);
            
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/cases/locations/`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': String(process.env.NEXT_PUBLIC_API_KEY),
                    },
                    credentials: 'include',
                    body: JSON.stringify(mockFilters),
                }
            );
        });

        it('should handle HTTP error responses for filtered locations', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400
            });

            await expect(mapApi.getFilteredLocations(mockFilters)).rejects.toThrow('HTTP error! status: 400');
            expect(console.error).toHaveBeenCalled();
        });

        it('should handle network errors for filtered locations', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

            await expect(mapApi.getFilteredLocations(mockFilters)).rejects.toThrow('Network error');
            expect(console.error).toHaveBeenCalledWith('Error fetching filtered locations:', networkError);
        });

        it('should handle empty response for filtered locations', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([])
            });

            const result = await mapApi.getFilteredLocations(mockFilters);
            expect(result).toEqual([]);
        });
    });

    describe('getDashboardData', () => {
        const dashboardMockData = {
            severity_statistics: {
                total_cases: 100,
                severity_counts: {
                    Mortalitas: 10,
                    Insiden: 80,
                    Hospitalisasi: 10,
                }
            },
            prevalence_statistics: {
                prevalence: 0.07315,
                year: 2024,
                population: 279390258,
            },
            gender_statistics: {
                male: 50,
                female: 50,
            },
            severity_dates_count_statistics: {
                "Tingkat 1": [
                    { date: "2024-01", count: 10 },
                    { date: "2024-02", count: 15 },
                ],
                "Tingkat 2": [
                    { date: "2024-01", count: 5 },
                    { date: "2024-02", count: 8 },
                ],
            }
        };

        it('should fetch dashboard data successfully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(dashboardMockData)
            });

            const result = await mapApi.getDashboardData();
            
            expect(result).toEqual(dashboardMockData);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/statistics/`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': String(process.env.NEXT_PUBLIC_API_KEY),
                    },
                    credentials: 'include',
                }
            );
        });

        it('should throw an error when API returns non-ok response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            
            await expect(mapApi.getDashboardData()).rejects.toThrow('HTTP error! status: 404');
            expect(console.error).toHaveBeenCalled();
        });

        it('should throw an error when fetch fails', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);
            
            await expect(mapApi.getDashboardData()).rejects.toThrow(networkError);
            expect(console.error).toHaveBeenCalledWith('Error fetching dashboard data:', networkError);
        });
    });
    
    describe('getCaseDetail', () => {
        const mockCaseId = '123';
        const mockCaseDetail = {
            id: '123',
            title: 'Test Case',
            description: 'Test Description',
            status: 'Active',
            location: { lat: -6.2, lng: 106.8 }
        };

        it('should fetch case detail successfully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockCaseDetail)
            });

            const result = await mapApi.getCaseDetail(mockCaseId);
            
            expect(result).toEqual(mockCaseDetail);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/cases/${mockCaseId}/`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': String(process.env.NEXT_PUBLIC_API_KEY),
                    },
                    credentials: 'include',
                }
            );
        });

        it('should handle HTTP error responses for case detail', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await expect(mapApi.getCaseDetail(mockCaseId)).rejects.toThrow('HTTP error! status: 404');
            expect(console.error).toHaveBeenCalled();
        });

        it('should handle network errors for case detail', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

            await expect(mapApi.getCaseDetail(mockCaseId)).rejects.toThrow('Network error');
            expect(console.error).toHaveBeenCalledWith('Error fetching case detail:', networkError);
        });

        it('should handle empty response for case detail', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });

            const result = await mapApi.getCaseDetail(mockCaseId);
            expect(result).toEqual({});
        });
    });
});

// Mock global fetch
global.fetch = jest.fn();

describe('severityApi', () => {
  const mockFilter: FilterState = {
    diseases: ['HIV'],
    locations: ['Jakarta'],
    portals: ['Portal1'],
    level_of_alertness: 1,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31')
  };

  const mockResponse = {
    data: [
      {
        name: 'Test Disease',
        severity_counts: {
          hospitalisasi: 10,
          insiden: 20,
          mortalitas: 5
        },
        total_cases: 35
      }
    ]
  };

  const mockFilterResponse = {
    disease_stats: [
      {
        name: 'Test Disease',
        severity_counts: {
          hospitalisasi: 10,
          insiden: 20,
          mortalitas: 5
        },
        total_cases: 35
      }
    ],
    province_stats: [],
    city_stats: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('getDiseaseSeverityStats', () => {
    it('should fetch disease severity stats without filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await severityApi.getDiseaseSeverityStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/diseases/severity-stats/'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object)
        })
      );

      expect(result).toEqual([
        {
          name: 'Test Disease',
          hospitalisasi: 10,
          insiden: 20,
          mortalitas: 5,
          total_cases: 35
        }
      ]);
    });

    it('should fetch disease severity stats with filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFilterResponse)
      });

      const result = await severityApi.getDiseaseSeverityStats(mockFilter);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/severity-stats/filter/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            diseases: mockFilter.diseases,
            locations: mockFilter.locations,
            portals: mockFilter.portals,
            level_of_alertness: mockFilter.level_of_alertness,
            start_date: mockFilter.start_date,
            end_date: mockFilter.end_date
          })
        })
      );

      expect(result).toEqual(mockFilterResponse);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(severityApi.getDiseaseSeverityStats()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('getProvinceSeverityStats', () => {
    it('should fetch province severity stats without filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await severityApi.getProvinceSeverityStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/locations/province/severity-stats/'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object)
        })
      );

      expect(result).toEqual([
        {
          name: 'Test Disease',
          hospitalisasi: 10,
          insiden: 20,
          mortalitas: 5,
          total_cases: 35
        }
      ]);
    });

    it('should fetch province severity stats with filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFilterResponse)
      });

      const result = await severityApi.getProvinceSeverityStats(mockFilter);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/severity-stats/filter/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            diseases: mockFilter.diseases,
            locations: mockFilter.locations,
            portals: mockFilter.portals,
            level_of_alertness: mockFilter.level_of_alertness,
            start_date: mockFilter.start_date,
            end_date: mockFilter.end_date
          })
        })
      );

      expect(result).toEqual(mockFilterResponse);
    });
  });

  describe('getCitySeverityStats', () => {
    it('should fetch city severity stats without filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await severityApi.getCitySeverityStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/locations/city/severity-stats/'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object)
        })
      );

      expect(result).toEqual([
        {
          name: 'Test Disease',
          hospitalisasi: 10,
          insiden: 20,
          mortalitas: 5,
          total_cases: 35
        }
      ]);
    });

    it('should fetch city severity stats with filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFilterResponse)
      });

      const result = await severityApi.getCitySeverityStats(mockFilter);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/severity-stats/filter/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            diseases: mockFilter.diseases,
            locations: mockFilter.locations,
            portals: mockFilter.portals,
            level_of_alertness: mockFilter.level_of_alertness,
            start_date: mockFilter.start_date,
            end_date: mockFilter.end_date
          })
        })
      );

      expect(result).toEqual(mockFilterResponse);
    });
  });

  describe('getFilteredSeverityStats', () => {
    it('should fetch filtered severity stats', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFilterResponse)
      });

      const result = await severityApi.getFilteredSeverityStats(mockFilter);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/severity-stats/filter/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            diseases: mockFilter.diseases,
            locations: mockFilter.locations,
            portals: mockFilter.portals,
            level_of_alertness: mockFilter.level_of_alertness,
            start_date: mockFilter.start_date,
            end_date: mockFilter.end_date
          })
        })
      );

      expect(result).toEqual(mockFilterResponse);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(severityApi.getFilteredSeverityStats(mockFilter)).rejects.toThrow('HTTP error! status: 500');
    });
  });
});