/**
 * @jest-environment node
 */

describe('Admin Dashboard Page API_BASE check - Direct module test', () => {
  beforeEach(() => {
    // Reset modules before each test
    jest.resetModules();
    
    // Mock console.warn
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Clean up
    jest.restoreAllMocks();
  });
  
  test('API_BASE warning is triggered when NEXT_PUBLIC_API_URL is not set', () => {
    // Mock process.env before importing the module
    jest.mock('process.env', () => ({}), { virtual: true });
    
    // Mock useEffect to actually run the callback immediately
    jest.mock('react', () => {
      const originalReact = jest.requireActual('react');
      return {
        ...originalReact,
        useEffect: (callback: () => void) => {
          callback();
        },
        useState: jest.fn().mockImplementation((initialState) => [initialState, jest.fn()])
      };
    });
    
    // Now require the module - this should trigger the useEffect and API_BASE check
    require('../../app/admin-dashboard/page');
    
    // Check if console.warn was called with the expected message
    expect(console.warn).toHaveBeenCalledWith("NEXT_PUBLIC_API_URL is not set. Using demo defaults for stats.");
  });
});