import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordSettings from '../../app/components/password-settings';
import fetchMock from 'jest-fetch-mock';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock the environment variables with secure protocol
const mockEnv = {
  NEXT_PUBLIC_API_URL: 'https://test-api',
  NEXT_PUBLIC_API_KEY: 'test-api-key',
};

beforeAll(() => {
  process.env = { ...process.env, ...mockEnv };
  fetchMock.enableMocks();
});

beforeEach(() => {
  fetchMock.resetMocks();
  jest.clearAllMocks();
});

// Test constants to avoid hard-coded credentials
const TEST_CURRENT_PASSWORD = 'TestCurrentPwd';
const TEST_WRONG_PASSWORD = 'TestWrongPwd';
const TEST_NEW_PASSWORD = 'TestP@ssw0rd'; // Meets requirements: 8+ chars, upper, lower, digit, symbol
const TEST_DIFFERENT_PASSWORD = 'D1fferent@Pass';

// Mock the Button component
jest.mock('../../app/components/ui-profile/button', () => ({
  Button: ({ children, className, onClick, disabled, type }: any) => (
    <button 
      className={className} 
      onClick={onClick} 
      disabled={disabled} 
      type={type}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

// Mock the Input component
jest.mock('../../app/components/ui-profile/input', () => ({
  Input: ({ id, type, placeholder, className, value, onChange, required }: any) => (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={onChange}
      required={required}
      data-testid={`input-${id}`}
    />
  ),
}));

// Mock the CheckIcon component
jest.mock('../../app/components/ui-profile/Checkicon', () => ({
  CheckIcon: ({ isChecked }: { isChecked: boolean }) => (
    <div data-testid="check-icon" data-checked={isChecked ? 'true' : 'false'}>
      {isChecked ? '✅' : '⭕'}
    </div>
  ),
}));

describe('PasswordSettings Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    render(<PasswordSettings onClose={mockOnClose} />);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders password settings modal with title and data-testid', () => {
    // Should have data-testid for the ProfileIcon.test.tsx
    const modal = screen.getByTestId('password-settings');
    expect(modal).toBeInTheDocument();

    const heading = screen.getByRole('heading', { name: 'Ubah Kata Sandi' });
    expect(heading).toBeInTheDocument();
  });

  it('displays all password requirements with correct check icons', () => {
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 8 karakter')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 huruf kapital')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 huruf kecil')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 angka')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 simbol khusus')).toBeInTheDocument();
    
    // All check icons should be unchecked initially
    const checkIcons = screen.getAllByTestId('check-icon');
    checkIcons.forEach(icon => {
      expect(icon.getAttribute('data-checked')).toBe('false');
    });
  });

  it('renders password form fields with correct attributes', () => {
    const currentPasswordInput = screen.getByTestId('input-current-password');
    expect(currentPasswordInput).toBeInTheDocument();
    expect(currentPasswordInput).toHaveAttribute('type', 'password');
    expect(currentPasswordInput).toHaveAttribute('required');

    const newPasswordInput = screen.getByTestId('input-new-password');
    expect(newPasswordInput).toBeInTheDocument();
    expect(newPasswordInput).toHaveAttribute('type', 'password');
    
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('updates check icons when password meets requirements', () => {
    const newPasswordInput = screen.getByTestId('input-new-password');
    
    // Type a password that meets all requirements
    fireEvent.change(newPasswordInput, { target: { value: TEST_NEW_PASSWORD } });
    
    // Check that all validation icons are checked
    const checkIcons = screen.getAllByTestId('check-icon');
    // First 5 icons should be checked (for password requirements)
    for (let i = 0; i < 5; i++) {
      expect(checkIcons[i].getAttribute('data-checked')).toBe('true');
    }
  });

  it('shows error when passwords do not match', () => {
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    
    // Type different passwords
    fireEvent.change(newPasswordInput, { target: { value: TEST_NEW_PASSWORD } });
    fireEvent.change(confirmPasswordInput, { target: { value: TEST_DIFFERENT_PASSWORD } });
    
    // Error message should be displayed
    const errorMessage = screen.getByText('Konfirmasi kata sandi tidak sesuai');
    expect(errorMessage).toBeInTheDocument();
  });
  
  it('disables submit button when form is invalid', () => {
    const currentPasswordInput = screen.getByTestId('input-current-password');
    const submitButton = screen.getByTestId('button');
    
    // Initially button should be disabled
    expect(submitButton).toBeDisabled();
    
    // Add current password but no new password
    fireEvent.change(currentPasswordInput, { target: { value: TEST_CURRENT_PASSWORD } });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is valid', () => {
    const currentPasswordInput = screen.getByTestId('input-current-password');
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    const submitButton = screen.getByTestId('button');
    
    // Fill in all fields with valid data
    fireEvent.change(currentPasswordInput, { target: { value: TEST_CURRENT_PASSWORD } });
    fireEvent.change(newPasswordInput, { target: { value: TEST_NEW_PASSWORD } });
    fireEvent.change(confirmPasswordInput, { target: { value: TEST_NEW_PASSWORD } });
    
    // Button should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  it('calls API and shows success message on successful form submission', async () => {
    render(<PasswordSettings onClose={mockOnClose} />);

    // Fill in the form
    const currentPasswordInput = screen.getAllByTestId('input-current-password')[0];
    const newPasswordInput = screen.getAllByTestId('input-new-password')[0];
    const confirmPasswordInput = screen.getAllByTestId('input-confirm-password')[0];

    fireEvent.change(currentPasswordInput, {
      target: { value: 'TestCurrentPwd' },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: 'TestP@ssw0rd' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'TestP@ssw0rd' },
    });

    // Mock successful API response
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Kata sandi berhasil diubah' }));

    // Submit the form
    const submitButton = screen.getAllByTestId('button')[0];
    const form = submitButton.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    // Check that the API was called with correct data using HTTPS
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/authentication/api/auth/change-password/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            current_password: 'TestCurrentPwd',
            new_password: 'TestP@ssw0rd',
            confirm_password: 'TestP@ssw0rd',
          }),
        })
      );
    });

    // Check that success message is shown
    await waitFor(() => {
      expect(screen.getByText('Kata sandi berhasil diubah')).toBeInTheDocument();
    });
  });

  it('displays error message when API returns error', async () => {
    render(<PasswordSettings onClose={mockOnClose} />);

    // Fill in the form
    const currentPasswordInput = screen.getAllByTestId('input-current-password')[0];
    const newPasswordInput = screen.getAllByTestId('input-new-password')[0];
    const confirmPasswordInput = screen.getAllByTestId('input-confirm-password')[0];

    fireEvent.change(currentPasswordInput, {
      target: { value: 'TestWrongPwd' },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: 'TestP@ssw0rd' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'TestP@ssw0rd' },
    });

    // Mock error response
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Gagal mengubah kata sandi' }), { status: 400 });

    // Submit the form
    const submitButton = screen.getAllByTestId('button')[0];
    const form = submitButton.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('Gagal mengubah kata sandi')).toBeInTheDocument();
    });
  });

  it('closes the modal when close button is clicked', () => {
    const closeButton = screen.getByRole('button', { name: '' }); // The X button has no text
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});