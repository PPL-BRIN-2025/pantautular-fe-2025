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