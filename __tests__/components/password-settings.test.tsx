import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordSettings from '../../app/components/password-settings';
import fetchMock from 'jest-fetch-mock';

// Mock the environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://test-api';
process.env.NEXT_PUBLIC_API_KEY = 'test-api-key';

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

// Setup fetch mock
fetchMock.enableMocks();

describe('PasswordSettings Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    fetchMock.resetMocks();
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
    fireEvent.change(newPasswordInput, { target: { value: 'Password123!' } });
    
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
    fireEvent.change(newPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
    
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
    fireEvent.change(currentPasswordInput, { target: { value: 'currentPass' } });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is valid', () => {
    const currentPasswordInput = screen.getByTestId('input-current-password');
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    const submitButton = screen.getByTestId('button');
    
    // Fill in all fields with valid data
    fireEvent.change(currentPasswordInput, { target: { value: 'currentPass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    
    // Button should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  it('calls API and shows success message on successful form submission', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Kata sandi berhasil diubah' }), { status: 200 });
    
    const currentPasswordInput = screen.getByTestId('input-current-password');
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    const submitButton = screen.getByTestId('button');
    
    // Fill in all fields with valid data
    fireEvent.change(currentPasswordInput, { target: { value: 'currentPass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check that the API was called with correct data
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/api/change-password',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-KEY': 'test-api-key'
          }),
          body: JSON.stringify({
            current_password: 'currentPass',
            new_password: 'Password123!',
            confirm_password: 'Password123!'
          })
        })
      );
    });
    
    // Success message should be displayed
    await waitFor(() => {
      const successMessage = screen.getByText('Kata sandi berhasil diubah');
      expect(successMessage).toBeInTheDocument();
    });
  });

  it('displays error message when API returns error', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'Current password is incorrect' }), { status: 400 });
    
    const currentPasswordInput = screen.getByTestId('input-current-password');
    const newPasswordInput = screen.getByTestId('input-new-password');
    const confirmPasswordInput = screen.getByTestId('input-confirm-password');
    const submitButton = screen.getByTestId('button');
    
    // Fill in all fields with valid data
    fireEvent.change(currentPasswordInput, { target: { value: 'wrongPass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Error message should be displayed
    await waitFor(() => {
      const errorMessage = screen.getByText('Current password is incorrect');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('closes the modal when close button is clicked', () => {
    const closeButton = screen.getByRole('button', { name: '' }); // The X button has no text
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});