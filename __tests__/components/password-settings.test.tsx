import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordSettings from '../../app/components/password-settings';
import fetchMock from 'jest-fetch-mock';
import userEvent from '@testing-library/user-event';

// Enable fetch mocks
fetchMock.enableMocks();

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://test-api.com';
process.env.NEXT_PUBLIC_API_KEY = 'test-api-key';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test constants for passwords - clearly marked as test data
const TEST_PASSWORDS = {
  // Test data only - not real passwords
  current: 'test123',
  wrong: 'wrong123',
  new: 'Test123!',
  different: 'Test456!'
} as const;

beforeEach(() => {
  fetchMock.resetMocks();
  jest.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue('test-token');
});

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

  it('renders password settings modal with title and data-testid', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    const modal = screen.getByTestId('password-settings');
    expect(modal).toBeInTheDocument();

    const heading = screen.getByRole('heading', { name: 'Ubah Kata Sandi' });
    expect(heading).toBeInTheDocument();
  });

  it('displays all password requirements with correct check icons', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 8 karakter')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 huruf kapital')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 huruf kecil')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 angka')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 simbol khusus')).toBeInTheDocument();
    
    const checkIcons = screen.getAllByTestId('check-icon');
    checkIcons.forEach(icon => {
      expect(icon.getAttribute('data-checked')).toBe('false');
    });
  });

  it('renders password form fields with correct attributes', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
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
    render(<PasswordSettings onClose={mockOnClose} />);
    const newPasswordInput = screen.getByTestId('input-new-password');
    fireEvent.change(newPasswordInput, { target: { value: TEST_PASSWORDS.new } });
    
    const checkIcons = screen.getAllByTestId('check-icon');
    for (let i = 0; i < 5; i++) {
      expect(checkIcons[i].getAttribute('data-checked')).toBe('true');
    }
  });

  it('shows error when passwords do not match', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    
    fireEvent.change(newPasswordInput, { target: { value: TEST_PASSWORDS.new } });
    fireEvent.change(confirmPasswordInput, { target: { value: TEST_PASSWORDS.different } });
    
    const errorMessage = screen.getByText('Konfirmasi kata sandi tidak sesuai');
    expect(errorMessage).toBeInTheDocument();
  });
  
  it('disables submit button when form is invalid', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    const currentPasswordInput = screen.getByTestId('input-current-password');
    const submitButton = screen.getByTestId('button');
    
    expect(submitButton).toBeDisabled();
    
    fireEvent.change(currentPasswordInput, { target: { value: TEST_PASSWORDS.current } });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is valid', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    const currentPasswordInput = screen.getByTestId('input-current-password');
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    const submitButton = screen.getByTestId('button');
    
    fireEvent.change(currentPasswordInput, { target: { value: TEST_PASSWORDS.current } });
    fireEvent.change(newPasswordInput, { target: { value: TEST_PASSWORDS.new } });
    fireEvent.change(confirmPasswordInput, { target: { value: TEST_PASSWORDS.new } });
    
    expect(submitButton).not.toBeDisabled();
  });

  it('calls API and shows success message on successful form submission', async () => {
    render(<PasswordSettings onClose={mockOnClose} />);

    const currentPasswordInput = screen.getByTestId('input-current-password');
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');

    fireEvent.change(currentPasswordInput, {
      target: { value: TEST_PASSWORDS.current },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: TEST_PASSWORDS.new },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: TEST_PASSWORDS.new },
    });

    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Kata sandi berhasil diubah' }));

    const submitButton = screen.getByTestId('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/authentication/api/auth/change-password/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }),
          body: JSON.stringify({
            current_password: TEST_PASSWORDS.current,
            new_password: TEST_PASSWORDS.new,
            confirm_password: TEST_PASSWORDS.new,
          }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Kata sandi berhasil diubah')).toBeInTheDocument();
    });
  });

  it('displays error message when API returns error', async () => {
    fetchMock.mockRejectOnce(new Error('Kata sandi saat ini tidak valid'));

    render(<PasswordSettings onClose={mockOnClose} />);

    const currentPasswordInput = screen.getByTestId('input-current-password');
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    const submitButton = screen.getByTestId('button');

    await userEvent.type(currentPasswordInput, TEST_PASSWORDS.wrong);
    await userEvent.type(newPasswordInput, TEST_PASSWORDS.new);
    await userEvent.type(confirmPasswordInput, TEST_PASSWORDS.new);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Kata sandi saat ini tidak valid')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/authentication/api/auth/change-password/'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify({
          current_password: TEST_PASSWORDS.wrong,
          new_password: TEST_PASSWORDS.new,
          confirm_password: TEST_PASSWORDS.new
        })
      })
    );
  });

  it('closes the modal when close button is clicked', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    const closeButton = screen.getByRole('button', { name: '' }); // The X button has no text
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});