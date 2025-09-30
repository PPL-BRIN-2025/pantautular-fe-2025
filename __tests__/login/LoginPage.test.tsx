import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../../app/login/page';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../app/auth/hooks/useAuth';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => {
    return <img alt={props.alt ?? ""} {...props} />;
  },
}));

// Mock useAuth hook
jest.mock('../../app/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();
  const testEmail = 'user@example.com';
  const testPassword = 'password123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });
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
    mockLogin.mockResolvedValueOnce({});
    
    setupComponent();
    fillLoginForm();
    submitForm();
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: testEmail,
        password: testPassword
      });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
  
  // Error scenarios
  const errorScenarios = [
    { 
      name: 'network error',
      error: new Error('Network error'),
      expectedMessage: 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.'
    },
    {
      name: 'server error',
      error: new Error('Internal Server Error'),
      expectedMessage: 'Terjadi gangguan pada server. Silakan coba lagi nanti.'
    },
    {
      name: 'unknown error',
      error: 'Unknown error',
      expectedMessage: 'Terjadi kesalahan saat login'
    },
    {
      name: 'invalid credentials',
      error: new Error('Email atau kata sandi salah.'),
      expectedMessage: 'Email atau kata sandi salah.'
    }
  ];
  
  // Test all error scenarios using parameterized tests
  errorScenarios.forEach(scenario => {
    test(`handles ${scenario.name} during login`, async () => {
      mockLogin.mockRejectedValueOnce(scenario.error);
      
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
    
    expect(mockLogin).not.toHaveBeenCalled();
  });
  
  // Edge Case: Test loading state
  test('shows loading state while submitting', async () => {
    // Setup login to delay resolution
    let resolvePromise: (value: any) => void;
    const loginPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockLogin.mockImplementationOnce(() => loginPromise);
    
    setupComponent();
    fillLoginForm();
    submitForm();
    
    // Button should show loading state
    expect(screen.getByRole('button', { name: /memproses/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /memproses/i })).toBeDisabled();
    
    // Resolve the login promise
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