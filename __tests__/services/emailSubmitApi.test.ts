import { emailSubmitAPI } from "../../services/api";

// Store the original fetch
const originalFetch = global.fetch;

describe('emailSubmitAPI', () => {
  // Setup for each test
  beforeEach(() => {
    // Mock console.error to keep test output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock global fetch
    global.fetch = jest.fn();
  });

  // Cleanup after each test
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('requestPasswordReset', () => {
    const testEmail = 'test@example.com';
    
    test('should return success true when API call succeeds', async () => {
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ message: 'Email sent successfully' }),
      });

      const result = await emailSubmitAPI.requestPasswordReset(testEmail);
      
      // Verify fetch was called with the right structure without checking exact URL
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      
      // Check that the URL path is correct (without checking the base URL)
      expect(fetchCall[0]).toContain('/authentication/password-reset-request');
      
      // Check the request options
      expect(fetchCall[1]).toMatchObject({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      });
      
      // Verify result
      expect(result).toEqual({ success: true });
    });

    test('should return success false and error message when API returns error', async () => {
      // Mock error response from server
      const errorMessage = 'User not found';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ 
          error: errorMessage 
        }),
      });

      const result = await emailSubmitAPI.requestPasswordReset(testEmail);
      
      // Verify result contains error message
      expect(result).toEqual({ 
        success: false, 
        error: errorMessage 
      });
    });

    test('should return default error message when API returns error without message', async () => {
      // Mock error response without specific error message
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({}), // No error property
      });

      const result = await emailSubmitAPI.requestPasswordReset(testEmail);
      
      // Verify result contains default error message
      expect(result).toEqual({ 
        success: false, 
        error: 'Terjadi kesalahan. Silakan coba lagi.' 
      });
    });

    test('should handle network errors correctly', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await emailSubmitAPI.requestPasswordReset(testEmail);
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
      
      // Verify result contains network error message
      expect(result).toEqual({ 
        success: false, 
        error: 'Terjadi kesalahan jaringan. Coba lagi nanti.' 
      });
    });
  });
});