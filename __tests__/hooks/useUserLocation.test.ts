import { renderHook } from '@testing-library/react';
import { useUserLocation } from '../../hooks/useUserLocation';
import { LocationService, LocationError } from '../../services/LocationService';

// Mock the LocationService
jest.mock('../../services/LocationService', () => ({
  LocationService: {
    requestLocation: jest.fn(),
    checkPermission: jest.fn(),
  },
}));

describe('useUserLocation', () => {
  // Mock functions for the hook parameters
  const mockSetShowPopup = jest.fn();
  const mockSetLocationError = jest.fn();
  const mockOnAllowCallback = jest.fn();
  const mockOnDenyCallback = jest.fn();
  
  // Mock console methods
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Restore console mocks after all tests
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  
  test('handleAllow should request location and call callback on success', () => {
    // Setup LocationService mock to simulate successful location retrieval
    (LocationService.requestLocation as jest.Mock).mockImplementation((successCallback) => {
      successCallback(10.123, 20.456);
    });
    
    // Render the hook
    const { result } = renderHook(() => useUserLocation(
      mockSetShowPopup,
      mockSetLocationError,
      mockOnAllowCallback,
      mockOnDenyCallback
    ));
    
    // Call the handleAllow function
    result.current.handleAllow();
    
    // Verify console.log was called
    expect(consoleLogSpy).toHaveBeenCalledWith('Pengguna memilih lanjut.');
    
    // Verify LocationService.requestLocation was called
    expect(LocationService.requestLocation).toHaveBeenCalled();
    
    // Verify success message was logged
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '(HOOK LOKASI) Lokasi berhasil didapatkan: (10.123, 20.456)'
    );
    
    // Verify onAllowCallback was called with coordinates
    expect(mockOnAllowCallback).toHaveBeenCalledWith(10.123, 20.456);
    
    // Verify error handler was not called
    expect(mockSetLocationError).not.toHaveBeenCalled();
  });
  
  test('handleAllow should handle location error', () => {
    // Setup LocationService mock to simulate error
    const mockError: LocationError = {
      type: 'POSITION_UNAVAILABLE',
      message: 'Position unavailable'
    };
    
    (LocationService.requestLocation as jest.Mock).mockImplementation((_, errorCallback) => {
      errorCallback(mockError);
    });
    
    // Render the hook
    const { result } = renderHook(() => useUserLocation(
      mockSetShowPopup,
      mockSetLocationError,
      mockOnAllowCallback,
      mockOnDenyCallback
    ));
    
    // Call the handleAllow function
    result.current.handleAllow();
    
    // Verify console.log was called
    expect(consoleLogSpy).toHaveBeenCalledWith('Pengguna memilih lanjut.');
    
    // Verify LocationService.requestLocation was called
    expect(LocationService.requestLocation).toHaveBeenCalled();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '(HOOK LOKASI) Gagal mendapatkan lokasi:',
      mockError
    );
    
    // Verify setLocationError was called with the error
    expect(mockSetLocationError).toHaveBeenCalledWith(mockError);
    
    // Verify onAllowCallback was not called
    expect(mockOnAllowCallback).not.toHaveBeenCalled();
  });
  
  test('handleDeny should hide popup and call onDenyCallback', () => {
    // Render the hook
    const { result } = renderHook(() => useUserLocation(
      mockSetShowPopup,
      mockSetLocationError,
      mockOnAllowCallback,
      mockOnDenyCallback
    ));
    
    // Call the handleDeny function
    result.current.handleDeny();
    
    // Verify popup is hidden
    expect(mockSetShowPopup).toHaveBeenCalledWith(false);
    
    // Verify console.log was called
    expect(consoleLogSpy).toHaveBeenCalledWith('Izin lokasi ditolak.');
    
    // Verify setLocationError was called with PERMISSION_DENIED error
    expect(mockSetLocationError).toHaveBeenCalledWith({
      type: 'PERMISSION_DENIED',
      message: 'Izin akses lokasi ditolak. Izinkan akses lokasi di pengaturan browser Anda.'
    });
    
    // Verify onDenyCallback was called
    expect(mockOnDenyCallback).toHaveBeenCalled();
  });
  
  test('should return handleAllow and handleDeny functions', () => {
    // Render the hook
    const { result } = renderHook(() => useUserLocation(
      mockSetShowPopup,
      mockSetLocationError,
      mockOnAllowCallback,
      mockOnDenyCallback
    ));
    
    // Verify the hook returns the expected functions
    expect(result.current).toHaveProperty('handleAllow');
    expect(result.current).toHaveProperty('handleDeny');
    expect(typeof result.current.handleAllow).toBe('function');
    expect(typeof result.current.handleDeny).toBe('function');
  });
});
