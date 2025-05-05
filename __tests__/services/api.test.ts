import { mapApi, resetPasswordApi } from "../../services/api";

// Mock global fetch and console.error
global.fetch = jest.fn();

// Mock console.error
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should handle network errors', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

            await expect(mapApi.getLocations()).rejects.toThrow('Network error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching locations:', networkError);
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
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should handle network errors for filtered locations', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

            await expect(mapApi.getFilteredLocations(mockFilters)).rejects.toThrow('Network error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching filtered locations:', networkError);
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
                status: 404
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
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should handle network errors for case detail', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

            await expect(mapApi.getCaseDetail(mockCaseId)).rejects.toThrow('Network error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching case detail:', networkError);
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

    describe('resetPasswordApi', () => {
        const mockUid = 'user123';
        const mockToken = 'validtoken456';
        const mockPassword = 'NewPassword123!';
        const mockConfirmPassword = 'NewPassword123!';
        
        beforeEach(() => {
            jest.clearAllMocks();
        });
        
        it('should reset password successfully', async () => {
            const successResponse = { detail: "Password berhasil diganti" };
            
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(successResponse)
            });
            
            const result = await resetPasswordApi.resetPassword(
                mockUid,
                mockToken,
                mockPassword,
                mockConfirmPassword
            );
            
            expect(result).toEqual(successResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_API_URL}/authentication/password-reset-confirm/${mockUid}/${mockToken}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': String(process.env.NEXT_PUBLIC_API_KEY),
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        password: mockPassword,
                        "password-confirm": mockConfirmPassword
                    }),
                }
            );
        });
        
        it('should handle password mismatch error', async () => {
            const errorResponse = { detail: "Password dan konfirmasi password tidak sama" };
            
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve(errorResponse)
            });
            
            await expect(resetPasswordApi.resetPassword(
                mockUid,
                mockToken,
                mockPassword,
                'DifferentPassword123!'
            )).rejects.toThrow("Password dan konfirmasi password tidak sama");
            
            expect(console.error).toHaveBeenCalled();
        });
        
        it('should handle weak password error', async () => {
            const errorResponse = { detail: "Password harus memiliki minimal 8 karakter, 1 huruf kapital, 1 huruf kecil, 1 angka, dan 1 simbol khusus" };
            
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve(errorResponse)
            });
            
            await expect(resetPasswordApi.resetPassword(
                mockUid,
                mockToken,
                'simple',
                'simple'
            )).rejects.toThrow("Password harus memiliki minimal 8 karakter, 1 huruf kapital, 1 huruf kecil, 1 angka, dan 1 simbol khusus");
            
            expect(console.error).toHaveBeenCalled();
        });
        
        it('should handle invalid or expired token', async () => {
            const errorResponse = { detail: "Invalid or expired token" };
            
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve(errorResponse)
            });
            
            await expect(resetPasswordApi.resetPassword(
                mockUid,
                'expiredtoken123',
                mockPassword,
                mockConfirmPassword
            )).rejects.toThrow("Invalid or expired token");
            
            expect(console.error).toHaveBeenCalled();
        });
        
        it('should handle invalid reset link', async () => {
            const errorResponse = { detail: "Invalid link" };
            
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve(errorResponse)
            });
            
            await expect(resetPasswordApi.resetPassword(
                'invaliduid',
                mockToken,
                mockPassword,
                mockConfirmPassword
            )).rejects.toThrow("Invalid link");
            
            expect(console.error).toHaveBeenCalled();
        });
        
        it('should handle server response with no detail field', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: "Internal server error" })
            });
            
            await expect(resetPasswordApi.resetPassword(
                mockUid,
                mockToken,
                mockPassword,
                mockConfirmPassword
            )).rejects.toThrow("Error: 500");
            
            expect(console.error).toHaveBeenCalled();
        });
        
        it('should handle network errors', async () => {
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);
            
            await expect(resetPasswordApi.resetPassword(
                mockUid,
                mockToken,
                mockPassword,
                mockConfirmPassword
            )).rejects.toThrow('Network error');
            
            expect(console.error).toHaveBeenCalledWith('Error resetting password:', networkError);
        });
        
        it('should handle JSON parse error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.reject(new Error('Invalid JSON'))
            });
            
            await expect(resetPasswordApi.resetPassword(
                mockUid,
                mockToken,
                mockPassword,
                mockConfirmPassword
            )).rejects.toThrow('Invalid JSON');
            
            expect(console.error).toHaveBeenCalled();
        });
        
        it('should handle empty parameters', async () => {
            await expect(resetPasswordApi.resetPassword(
                '',
                mockToken,
                mockPassword,
                mockConfirmPassword
            )).rejects.toThrow(); // akan gagal karena URL tidak valid
            
            expect(console.error).toHaveBeenCalled();
        });
    });
}); 