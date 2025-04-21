import { mapApi, severityApi } from "../../services/api";
import { FilterState } from "../../types";

// Mock global fetch and console.error
global.fetch = jest.fn();
console.error = jest.fn();
console.log = jest.fn(); // Also mock console.log to avoid noise in tests

describe('mapApi', () => {
    const mockResponse = [
        { id: 1, latitude: -6.200000, longitude: 106.816666 },
        { id: 2, latitude: -6.914744, longitude: 107.609810 }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
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

        const mockFilters = {
            diseases: ['Dengue'],
            locations: ['Jakarta'],
            level_of_alertness: 2,
            portals: ['news-portal-1'],
            start_date: new Date('2023-01-01'),
            end_date: new Date('2023-12-31')
        };

        it('should fetch dashboard data with GET when no filters are provided', async () => {
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

        it('should fetch dashboard data with POST when filters are provided', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(dashboardMockData)
            });

            const result = await mapApi.getDashboardData(mockFilters);
            
            expect(result).toEqual(dashboardMockData);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/statistics/`,
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

        it('should throw an error when API returns non-ok response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            
            await expect(mapApi.getDashboardData()).rejects.toThrow('HTTP error! status: 404');
        });

        it('should throw an error when fetch fails', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);
            
            await expect(mapApi.getDashboardData()).rejects.toThrow(networkError);
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

describe('severityApi', () => {
    const mockFilters = {
        diseases: ['Dengue'],
        locations: ['Jakarta'],
        level_of_alertness: 2,
        portals: ['news-portal-1'],
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-12-31')
    };

    // Partial filter with missing fields to test fallbacks
    const partialFilter: FilterState = {
        diseases: ['Dengue'],
        locations: [],
        portals: [],
        level_of_alertness: 0,
        start_date: null,
        end_date: null
    };

    const mockSeverityData = {
        data: [
            {
                name: 'Disease A',
                severity_counts: {
                    hospitalisasi: 100,
                    insiden: 200,
                    mortalitas: 50
                },
                total_cases: 350
            },
            {
                name: 'Disease B',
                severity_counts: {
                    hospitalisasi: 80,
                    insiden: 150,
                    mortalitas: 30
                },
                total_cases: 260
            }
        ]
    };

    const mockFilterResponse = {
        disease_stats: [
            {
                name: 'Disease A',
                severity_counts: {
                    hospitalisasi: 100,
                    insiden: 200,
                    mortalitas: 50
                },
                total_cases: 350
            }
        ],
        province_stats: [
            {
                name: 'Province A',
                severity_counts: {
                    hospitalisasi: 80,
                    insiden: 150,
                    mortalitas: 30
                },
                total_cases: 260
            }
        ],
        city_stats: [
            {
                name: 'City A',
                severity_counts: {
                    hospitalisasi: 60,
                    insiden: 100,
                    mortalitas: 20
                },
                total_cases: 180
            }
        ]
    };

    const expectedTransformedData = [
        {
            name: 'Disease A',
            hospitalisasi: 100,
            insiden: 200,
            mortalitas: 50,
            total_cases: 350
        },
        {
            name: 'Disease B',
            hospitalisasi: 80,
            insiden: 150,
            mortalitas: 30,
            total_cases: 260
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDiseaseSeverityStats', () => {
        it('should fetch disease severity stats without filter', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSeverityData)
            });

            const result = await severityApi.getDiseaseSeverityStats();
            
            expect(result).toEqual(expectedTransformedData);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/diseases/severity-stats/`,
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'x-api-key': String(process.env.NEXT_PUBLIC_API_KEY)
                    })
                })
            );
        });

        it('should fetch disease severity stats with filter', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockFilterResponse)
            });

            const result = await severityApi.getDiseaseSeverityStats(mockFilters);
            
            expect(result).toEqual(mockFilterResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/severity-stats/filter/`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        diseases: mockFilters.diseases,
                        locations: mockFilters.locations,
                        portals: mockFilters.portals,
                        level_of_alertness: mockFilters.level_of_alertness,
                        start_date: mockFilters.start_date,
                        end_date: mockFilters.end_date
                    })
                })
            );
        });

        it('should use default values for missing filter fields', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockFilterResponse)
            });

            const result = await severityApi.getDiseaseSeverityStats(partialFilter);
            
            expect(result).toEqual(mockFilterResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/severity-stats/filter/`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        diseases: partialFilter.diseases,
                        locations: [],
                        portals: [],
                        level_of_alertness: 0,
                        start_date: null,
                        end_date: null
                    })
                })
            );
        });

        it('should handle HTTP errors when fetching disease stats', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(severityApi.getDiseaseSeverityStats()).rejects.toThrow('HTTP error! status: 500');
            expect(console.error).toHaveBeenCalled();
        });

        it('should handle network errors when fetching disease stats', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

            await expect(severityApi.getDiseaseSeverityStats()).rejects.toThrow('Network error');
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('getProvinceSeverityStats', () => {
        it('should fetch province severity stats without filter', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSeverityData)
            });

            const result = await severityApi.getProvinceSeverityStats();
            
            expect(result).toEqual(expectedTransformedData);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/locations/province/severity-stats/`,
                expect.objectContaining({
                    method: 'GET'
                })
            );
        });

        it('should fetch province severity stats with filter', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockFilterResponse)
            });

            const result = await severityApi.getProvinceSeverityStats(mockFilters);
            
            expect(result).toEqual(mockFilterResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/severity-stats/filter/`,
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });

        it('should use default values for missing filter fields', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockFilterResponse)
            });

            const result = await severityApi.getProvinceSeverityStats(partialFilter);
            
            expect(result).toEqual(mockFilterResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/severity-stats/filter/`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        diseases: partialFilter.diseases,
                        locations: partialFilter.locations,
                        portals: partialFilter.portals,
                        level_of_alertness: partialFilter.level_of_alertness,
                        start_date: partialFilter.start_date,
                        end_date: partialFilter.end_date
                    })
                })
            );
        });
    });

    describe('getCitySeverityStats', () => {
        it('should fetch city severity stats without filter', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSeverityData)
            });

            const result = await severityApi.getCitySeverityStats();
            
            expect(result).toEqual(expectedTransformedData);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/locations/city/severity-stats/`,
                expect.objectContaining({
                    method: 'GET'
                })
            );
        });

        it('should fetch city severity stats with filter', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockFilterResponse)
            });

            const result = await severityApi.getCitySeverityStats(mockFilters);
            
            expect(result).toEqual(mockFilterResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/severity-stats/filter/`,
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });

        it('should use default values for missing filter fields', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockFilterResponse)
            });

            const result = await severityApi.getCitySeverityStats(partialFilter);
            
            expect(result).toEqual(mockFilterResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/severity-stats/filter/`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        diseases: partialFilter.diseases,
                        locations: partialFilter.locations,
                        portals: partialFilter.portals,
                        level_of_alertness: partialFilter.level_of_alertness,
                        start_date: partialFilter.start_date,
                        end_date: partialFilter.end_date
                    })
                })
            );
        });
    });

    describe('getFilteredSeverityStats', () => {
        it('should fetch filtered severity stats directly', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockFilterResponse)
            });

            const result = await severityApi.getFilteredSeverityStats(mockFilters);
            
            expect(result).toEqual(mockFilterResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/api/severity-stats/filter/`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        diseases: mockFilters.diseases,
                        locations: mockFilters.locations,
                        portals: mockFilters.portals,
                        level_of_alertness: mockFilters.level_of_alertness,
                        start_date: mockFilters.start_date,
                        end_date: mockFilters.end_date
                    })
                })
            );
        });
    });
}); 