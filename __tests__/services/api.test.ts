import { mapApi } from "../../services/api";

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
});