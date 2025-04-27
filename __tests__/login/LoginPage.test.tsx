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
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    process.env.NEXT_PUBLIC_API_KEY = 'testApiKey';
  });
  
  // Happy Path: Successful login
  test('handles successful login', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    
    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'user@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/kata sandi/i), { 
      target: { value: 'password123' } 
    });
    
    fireEvent.submit(screen.getByRole('button', { name: /masuk/i }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/authentication/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': 'testApiKey',
          },
          credentials: 'include',
          body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
  
  // Unhappy Path: Failed login (network error)
  test('handles network error during login', async () => {
    const errorMessage = 'Network error';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'user@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/kata sandi/i), { 
      target: { value: 'password123' } 
    });
    
    fireEvent.submit(screen.getByRole('button', { name: /masuk/i }));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
  
  // Unhappy Path: Failed login (server error)
  test('handles server error during login', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Internal Server Error'));
    
    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'user@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/kata sandi/i), { 
      target: { value: 'password123' } 
    });
    
    fireEvent.submit(screen.getByRole('button', { name: /masuk/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    });
  });
  
  // Unhappy Path: Generic error (non-Error object thrown)
  test('handles unknown error during login', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('Unknown error');
    
    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'user@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/kata sandi/i), { 
      target: { value: 'password123' } 
    });
    
    fireEvent.submit(screen.getByRole('button', { name: /masuk/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Terjadi kesalahan saat login')).toBeInTheDocument();
    });
  });
  
  // Edge Case: Empty form submission
  test('validates required fields', async () => {
    const formElement = document.createElement('form');
    formElement.submit = jest.fn();
    
    render(<LoginPage />);
    
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
    
    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/kata sandi/i), { target: { value: 'password123' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /masuk/i }));
    
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
    render(<LoginPage />);
    
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
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/kata sandi/i);
    
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
    
    expect(emailInput).toHaveValue('newuser@example.com');
    expect(passwordInput).toHaveValue('newpassword');
  });
});