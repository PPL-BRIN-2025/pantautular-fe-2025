import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// We'll test the error condition by creating a component that uses the hook
// This way we can verify the error is thrown correctly
describe('useAuth hook', () => {
  // We need to silence React's error boundary for this test
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });
  
  it('throws appropriate error when used outside AuthProvider', () => {
    // Define a test component that directly uses the hook
    const TestComponent = () => {
      // We need to dynamically import the hook to avoid hoisting issues
      const useAuth = require('../../../app/auth/hooks/useAuth').useAuth;
      
      try {
        useAuth();
        return <div>This should not render</div>;
      } catch (error: any) {
        return <div data-testid="error-message">{error.message}</div>;
      }
    };
    
    // Render the test component which will trigger the error
    render(<TestComponent />);
    
    // Verify the error message is shown
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'useAuth must be used within AuthProvider'
    );
  });
  
  it('returns auth context when used within AuthProvider', () => {
    // Mock the auth context for this test
    const mockAuthContext = {
      user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'admin' },
      login: jest.fn(),
      logout: jest.fn(),
      strategy: { name: 'test-strategy' }
    };
    
    // Create a test component that uses the hook within the provider
    const TestComponent = () => {
      // Import the necessary modules
      const { AuthContext } = require('../../../app/auth/context');
      const { useAuth } = require('../../../app/auth/hooks/useAuth');
      
      // Create a wrapper component that provides the mock context
      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockAuthContext}>
          {children}
        </AuthContext.Provider>
      );
      
      // Create a component that uses the hook
      const Consumer = () => {
        const auth = useAuth();
        return (
          <div data-testid="auth-result">
            {auth === mockAuthContext ? 'Context returned successfully' : 'Wrong context'}
          </div>
        );
      };
      
      return (
        <Wrapper>
          <Consumer />
        </Wrapper>
      );
    };
    
    // Render the test component
    render(<TestComponent />);
    
    // Verify the context is returned correctly
    expect(screen.getByTestId('auth-result')).toHaveTextContent(
      'Context returned successfully'
    );
  });
});