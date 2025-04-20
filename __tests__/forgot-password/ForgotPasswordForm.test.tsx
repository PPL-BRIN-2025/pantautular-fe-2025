import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PasswordForm from '../../app/components/forgot_password/ForgotPasswordForm';
import { IPasswordValidator } from '../../utils/PasswordValidator';

// Mock PasswordValidator
class MockPasswordValidator implements IPasswordValidator {
  validate(password: string): string {
    if (password.length < 8) {
      return "Password harus minimal 8 karakter";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password harus memiliki minimal 1 huruf kapital";
    }
    return "";
  }
}

describe('PasswordForm Component', () => {
  const mockValidator = new MockPasswordValidator();
  
  it('renders the form correctly', () => {
    render(<PasswordForm passwordValidator={mockValidator} />);
    
    // Gunakan testid untuk memastikan elemen ada
    expect(screen.getByLabelText(/^kata sandi$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^konfirmasi kata sandi$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /simpan kata sandi/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows error when password is invalid', async () => {
    render(<PasswordForm passwordValidator={mockValidator} />);
    
    // Gunakan testid yang lebih spesifik
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    await userEvent.type(passwordInput, 'short');
    
    expect(await screen.findByText("Password harus minimal 8 karakter")).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<PasswordForm passwordValidator={mockValidator} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'DifferentPass123');
    
    expect(await screen.findByText("Konfirmasi password tidak sesuai")).toBeInTheDocument();
  });

  it('enables submit button when form is valid', async () => {
    render(<PasswordForm passwordValidator={mockValidator} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'ValidPass123');
    
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  it('clears error when password becomes valid', async () => {
    render(<PasswordForm passwordValidator={mockValidator} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    
    // Type invalid password first
    await userEvent.type(passwordInput, 'short');
    expect(await screen.findByText("Password harus minimal 8 karakter")).toBeInTheDocument();
    
    // Clear and type valid password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'ValidPass123');
    
    // Error should be gone
    await waitFor(() => {
      expect(screen.queryByText("Password harus minimal 8 karakter")).not.toBeInTheDocument();
    });
  });
  
  it('clears confirmation error when passwords match', async () => {
    render(<PasswordForm passwordValidator={mockValidator} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    // Set password
    await userEvent.type(passwordInput, 'ValidPass123');
    
    // Type non-matching confirm password
    await userEvent.type(confirmInput, 'DifferentPass');
    expect(await screen.findByText("Konfirmasi password tidak sesuai")).toBeInTheDocument();
    
    // Fix the confirm password
    await userEvent.clear(confirmInput);
    await userEvent.type(confirmInput, 'ValidPass123');
    
    // Error should be gone
    await waitFor(() => {
      expect(screen.queryByText("Konfirmasi password tidak sesuai")).not.toBeInTheDocument();
    });
  });
});