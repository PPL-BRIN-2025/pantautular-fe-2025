import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../../app/login/page';
import { useRouter } from 'next/navigation';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const testEmail = 'user@example.com';
  const testPassword = 'password123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    process.env.NEXT_PUBLIC_API_KEY = 'testApiKey';
  });
  
  // Helper function to setup component rendering
  const setupComponent = () => {
    return render(<LoginPage />);
  };

  // Helper function to fill login form
  const fillLoginForm = (email = testEmail, password = testPassword) => {
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: email } 
    });
    fireEvent.change(screen.getByLabelText(/kata sandi/i), { 
      target: { value: password } 
    });
  };

  // Helper function to submit form
  const submitForm = () => {
    fireEvent.submit(screen.getByRole('button', { name: /masuk/i }));
  };
  
  // Happy Path: Successful login
  test('handles successful login', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    
    setupComponent();
    fillLoginForm();
    submitForm();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/authentication/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': expect.any(String),
          }),
          credentials: 'include',
          body: expect.stringMatching(/user@example\.com.*password123/),
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
  
  // Error scenarios
  const errorScenarios = [
    { 
      name: 'network error',
      error: new Error('Network error'),
      expectedMessage: 'Network error'
    },
    {
      name: 'server error',
      error: new Error('Internal Server Error'),
      expectedMessage: 'Internal Server Error'
    },
    {
      name: 'unknown error',
      error: 'Unknown error',
      expectedMessage: 'Terjadi kesalahan saat login'
    }
  ];
  
  // Test all error scenarios using parameterized tests
  errorScenarios.forEach(scenario => {
    test(`handles ${scenario.name} during login`, async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(scenario.error);
      
      setupComponent();
      fillLoginForm();
      submitForm();
      
      await waitFor(() => {
        expect(screen.getByText(scenario.expectedMessage)).toBeInTheDocument();
      });
    });
  });
  
  // Edge Case: Empty form submission
  test('validates required fields', async () => {
    const formElement = document.createElement('form');
    formElement.submit = jest.fn();
    
    setupComponent();
    
    // Try to submit without filling required fields (this will trigger HTML5 validation)
    const submitButton = screen.getByRole('button', { name: /masuk/i });
    fireEvent.click(submitButton);
    
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  // Edge Case: Test loading state
  test('shows loading state while submitting', async () => {
    // Setup fetch to delay resolution
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    (global.fetch as jest.Mock).mockImplementationOnce(() => fetchPromise);
    
    setupComponent();
    fillLoginForm();
    submitForm();
    
    // Button should show loading state
    expect(screen.getByRole('button', { name: /memproses/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /memproses/i })).toBeDisabled();
    
    // Resolve the fetch promise
    resolvePromise!({});
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
  
  // UI Elements Test
  test('renders all UI elements correctly', () => {
    setupComponent();
    
    // Check for image
    expect(screen.getByAltText('Login')).toBeInTheDocument();
    
    // Check for heading
    expect(screen.getByRole('heading', { 
      name: /sudah siap menjelajahi pantautular/i 
    })).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kata sandi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument();
    
    // Check for links
    expect(screen.getByText(/belum memiliki akun/i)).toBeInTheDocument();
    expect(screen.getByText(/daftar/i)).toBeInTheDocument();
    expect(screen.getByText(/lupa kata sandi/i)).toBeInTheDocument();
  });
  
  // Input Change Handling Test
  test('updates state when input values change', () => {
    setupComponent();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/kata sandi/i);
    
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
    
    expect(emailInput).toHaveValue('newuser@example.com');
    expect(passwordInput).toHaveValue('newpassword');
  });
});