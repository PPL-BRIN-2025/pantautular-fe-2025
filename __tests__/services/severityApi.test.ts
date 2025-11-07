import { severityApi } from "../../services/api";
import { FilterState } from '../../types';

// Mock global fetch and console.error
global.fetch = jest.fn();
console.error = jest.fn();

describe('severityApi', () => {
    const mockFilter: FilterState = {
        diseases: ['HIV'],
        locations: ['Jakarta'],
        portals: ['Portal1'],
        level_of_alertness: 1,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        batch: "batch-1"
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
    });

    const testFetchWithoutFilter = (apiFunction: (filter?: any) => Promise<any>, endpoint: string) => {
        it('should fetch stats without filter', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await apiFunction();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
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
    };

    const testFetchWithFilter = (apiFunction: (filter?: any) => Promise<any>) => {
        it('should fetch stats with filter', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockFilterResponse)
            });

            const result = await apiFunction(mockFilter);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/severity-stats/filter/'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.any(Object),
                    body: JSON.stringify(mockFilter)
                })
            );

            expect(result).toEqual(mockFilterResponse);
        });
    };

    const testApiErrors = (apiFunction: (filter?: any) => Promise<any>) => {
        it('should handle API errors', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(apiFunction()).rejects.toThrow('HTTP error! status: 500');
        });
    };


    const testSeverityStats = (apiFunction: (filter?: any) => Promise<any>, endpoint: string) => {
        describe(`${apiFunction.name}`, () => {
            testFetchWithoutFilter(apiFunction, endpoint);
            testFetchWithFilter(apiFunction);
            testApiErrors(apiFunction);
        });
    };

    testSeverityStats(severityApi.getDiseaseSeverityStats, '/api/diseases/severity-stats/');
    testSeverityStats(severityApi.getProvinceSeverityStats, '/api/locations/province/severity-stats/');
    testSeverityStats(severityApi.getCitySeverityStats, '/api/locations/city/severity-stats/');

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
                    body: JSON.stringify(mockFilter)
                })
            );

            expect(result).toEqual(mockFilterResponse);
        });

        testApiErrors(() => severityApi.getFilteredSeverityStats(mockFilter));
    });
}); 
