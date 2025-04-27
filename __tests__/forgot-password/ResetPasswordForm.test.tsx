import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PasswordForm from '../../app/components/forgot_password/ResetPasswordForm';
import { IPasswordValidator } from '../../utils/PasswordValidator';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

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
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockReset();
    mockOnSubmit.mockResolvedValue(undefined);
  });
  
  it('renders the form correctly', () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/^kata sandi$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^konfirmasi kata sandi$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /simpan kata sandi/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows error when password is invalid', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    await userEvent.type(passwordInput, 'short');
    
    expect(await screen.findByText("Password harus minimal 8 karakter")).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'DifferentPass123');
    
    expect(await screen.findByText("Konfirmasi password tidak sesuai")).toBeInTheDocument();
  });

  it('enables submit button when form is valid', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'ValidPass123');
    
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  it('clears error when password becomes valid', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    
    await userEvent.type(passwordInput, 'short');
    expect(await screen.findByText("Password harus minimal 8 karakter")).toBeInTheDocument();
    
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'ValidPass123');
    
    await waitFor(() => {
      expect(screen.queryByText("Password harus minimal 8 karakter")).not.toBeInTheDocument();
    });
  });
  
  it('clears confirmation error when passwords match', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'ValidPass123');
    
    await userEvent.type(confirmInput, 'DifferentPass');
    expect(await screen.findByText("Konfirmasi password tidak sesuai")).toBeInTheDocument();
    
    await userEvent.clear(confirmInput);
    await userEvent.type(confirmInput, 'ValidPass123');
    
    await waitFor(() => {
      expect(screen.queryByText("Konfirmasi password tidak sesuai")).not.toBeInTheDocument();
    });
  });

  it('submits form with correct values when valid', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    const submitButton = screen.getByRole('button', { name: /simpan kata sandi/i });
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'ValidPass123');
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
    
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('ValidPass123', 'ValidPass123');
    });
  });

  it('displays loading state during submission', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    const submitButton = screen.getByRole('button', { name: /simpan kata sandi/i });
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'ValidPass123');
    
    await userEvent.click(submitButton);
    
    expect(screen.getByRole('button')).toHaveTextContent('Menyimpan...');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('handles submission errors gracefully', async () => {
    const testError = new Error('Terjadi kesalahan pada server');
    mockOnSubmit.mockRejectedValue(testError);
    
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    const submitButton = screen.getByRole('button', { name: /simpan kata sandi/i });
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'ValidPass123');
    await userEvent.click(submitButton);
    
    expect(await screen.findByText('Terjadi kesalahan pada server')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent('Simpan Kata Sandi');
    });
  });

  it('handles different error types from API', async () => {
    mockOnSubmit.mockRejectedValue('Server error occurred');
    
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'ValidPass123');
    await userEvent.click(screen.getByRole('button'));
    
    expect(await screen.findByText('Terjadi kesalahan saat mengatur ulang kata sandi')).toBeInTheDocument();
  });

  it('handles specific API error messages', async () => {
    const expiredError = new Error('Invalid or expired token');
    mockOnSubmit.mockRejectedValue(expiredError);
    
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'ValidPass123');
    await userEvent.click(screen.getByRole('button'));
    
    expect(await screen.findByText('Invalid or expired token')).toBeInTheDocument();
  });

  it('clears the form on successful submission', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'ValidPass123');
    await userEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(passwordInput).toHaveValue('');
      expect(confirmInput).toHaveValue('');
    });
  });
  
  it('does not submit when password has error', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'short');
    await userEvent.type(confirmInput, 'short');
    
    const submitButton = screen.getByRole('button');
    await userEvent.click(submitButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  it('does not submit when confirm password has error', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    
    await userEvent.type(passwordInput, 'ValidPass123');
    await userEvent.type(confirmInput, 'Different123');
    
    const submitButton = screen.getByRole('button');
    await userEvent.click(submitButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  it('does not submit when password is empty', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const confirmInput = screen.getByLabelText(/^konfirmasi kata sandi$/i);
    await userEvent.type(confirmInput, 'ValidPass123');
    
    const submitButton = screen.getByRole('button');
    await userEvent.click(submitButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  it('does not submit when confirm password is empty', async () => {
    render(<PasswordForm passwordValidator={mockValidator} onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^kata sandi$/i);
    await userEvent.type(passwordInput, 'ValidPass123');
    
    const submitButton = screen.getByRole('button');
    await userEvent.click(submitButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});