import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordSettings from '../../app/components/password-settings';
import fetchMock from 'jest-fetch-mock';
import userEvent from '@testing-library/user-event';

// Enable fetch mocks
fetchMock.enableMocks();

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'https://test-api.com';
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

const TEST_PASSWORDS = {
  current: 'test123',
  wrong: 'wrong123',
  new: 'Test123!',
  different: 'Test456!'
};

beforeEach(() => {
  fetchMock.resetMocks();
  jest.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue('test-token');
});

// Mock the UI components
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

jest.mock('../../app/components/ui-profile/Checkicon', () => ({
  CheckIcon: ({ isChecked }: { isChecked: boolean }) => (
    <div data-testid="check-icon" data-checked={isChecked ? 'true' : 'false'}>
      {isChecked ? '✅' : '⭕'}
    </div>
  ),
}));

describe('PasswordSettings Component', () => {
  const mockOnClose = jest.fn();
  
  // Helper function to fill form and optionally submit
  const fillPasswordForm = (
    currentPassword = TEST_PASSWORDS.current,
    newPassword = TEST_PASSWORDS.new,
    confirmPassword = TEST_PASSWORDS.new,
    shouldSubmit = false
  ) => {
    const currentPasswordInput = screen.getByTestId('input-current-password');
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    
    fireEvent.change(currentPasswordInput, { target: { value: currentPassword } });
    fireEvent.change(newPasswordInput, { target: { value: newPassword } });
    fireEvent.change(confirmPasswordInput, { target: { value: confirmPassword } });
    
    if (shouldSubmit) {
      const submitButton = screen.getByTestId('button');
      fireEvent.click(submitButton);
    }
    
    return {
      currentPasswordInput,
      newPasswordInput,
      confirmPasswordInput,
      submitButton: screen.getByTestId('button')
    };
  };
  
  // Helper function to verify API call
  const verifyApiCall = (currentPassword: string, newPassword: string, confirmPassword: string) => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/authentication/api/auth/change-password/'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })
    );
  };

  it('renders password settings modal with title and data-testid', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    const modal = screen.getByTestId('password-settings');
    expect(modal).toBeInTheDocument();

    const heading = screen.getByRole('heading', { name: 'Ubah Kata Sandi' });
    expect(heading).toBeInTheDocument();
  });

  it('displays all password requirements with correct check icons', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    
    const requirements = [
      'Kata sandi harus terdiri dari setidaknya 8 karakter',
      'Kata sandi harus terdiri dari setidaknya 1 huruf kapital',
      'Kata sandi harus terdiri dari setidaknya 1 huruf kecil',
      'Kata sandi harus terdiri dari setidaknya 1 angka',
      'Kata sandi harus terdiri dari setidaknya 1 simbol khusus'
    ];
    
    requirements.forEach(req => expect(screen.getByText(req)).toBeInTheDocument());
    
    const checkIcons = screen.getAllByTestId('check-icon');
    checkIcons.forEach(icon => {
      expect(icon.getAttribute('data-checked')).toBe('false');
    });
  });

  it('renders password form fields with correct attributes', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    
    const fields = [
      { id: 'input-current-password', type: 'password', required: true },
      { id: 'input-new-password', type: 'password' },
      { id: 'input-confirm-password', type: 'password' }
    ];
    
    fields.forEach(field => {
      const input = screen.getByTestId(field.id);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', field.type);
      if (field.required) expect(input).toHaveAttribute('required');
    });
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
    
    fillPasswordForm(TEST_PASSWORDS.current, TEST_PASSWORDS.new, TEST_PASSWORDS.different);
    
    expect(screen.getByText('Konfirmasi kata sandi tidak sesuai')).toBeInTheDocument();
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
    
    fillPasswordForm();
    
    const submitButton = screen.getByTestId('button');
    expect(submitButton).not.toBeDisabled();
  });

  describe('API interactions', () => {
    it('calls API and shows success message on successful form submission', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ message: 'Kata sandi berhasil diubah' }));
      
      render(<PasswordSettings onClose={mockOnClose} />);
      fillPasswordForm(TEST_PASSWORDS.current, TEST_PASSWORDS.new, TEST_PASSWORDS.new, true);
      
      await waitFor(() => {
        verifyApiCall(TEST_PASSWORDS.current, TEST_PASSWORDS.new, TEST_PASSWORDS.new);
      });
  
      await waitFor(() => {
        expect(screen.getByText('Kata sandi berhasil diubah')).toBeInTheDocument();
      });
    });
  
    it('displays error message when API returns error', async () => {
      fetchMock.mockRejectOnce(new Error('Kata sandi saat ini tidak valid'));
  
      render(<PasswordSettings onClose={mockOnClose} />);
      fillPasswordForm(TEST_PASSWORDS.wrong, TEST_PASSWORDS.new, TEST_PASSWORDS.new, true);
  
      await waitFor(() => {
        expect(screen.getByText('Kata sandi saat ini tidak valid')).toBeInTheDocument();
      });
  
      verifyApiCall(TEST_PASSWORDS.wrong, TEST_PASSWORDS.new, TEST_PASSWORDS.new);
    });
    
    it('handles non-Error exceptions in API calls', async () => {
      fetchMock.mockRejectedValueOnce("Not an error object");
  
      render(<PasswordSettings onClose={mockOnClose} />);
      fillPasswordForm(TEST_PASSWORDS.current, TEST_PASSWORDS.new, TEST_PASSWORDS.new, true);
      
      await waitFor(() => {
        expect(screen.getByText('Terjadi kesalahan tak terduga')).toBeInTheDocument();
      });
    });
  
    it('displays custom success message from API response when available', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ 
        message: 'Password berhasil diperbarui pada 18 Mei 2025' 
      }));
  
      render(<PasswordSettings onClose={mockOnClose} />);
      fillPasswordForm(TEST_PASSWORDS.current, TEST_PASSWORDS.new, TEST_PASSWORDS.new, true);
      
      await waitFor(() => {
        expect(screen.getByText('Password berhasil diperbarui pada 18 Mei 2025')).toBeInTheDocument();
      });
    });
  
    it('displays default success message when API does not return a message', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
  
      render(<PasswordSettings onClose={mockOnClose} />);
      fillPasswordForm(TEST_PASSWORDS.current, TEST_PASSWORDS.new, TEST_PASSWORDS.new, true);
      
      await waitFor(() => {
        expect(screen.getByText('Kata sandi berhasil diubah')).toBeInTheDocument();
      });
    });
  });

  it('closes the modal when close button is clicked', () => {
    render(<PasswordSettings onClose={mockOnClose} />);
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});