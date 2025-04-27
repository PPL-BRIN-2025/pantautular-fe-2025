import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetPasswordPage from '../../app/forgot-password/reset/[uid]/[token]/page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ uid: 'testuid123', token: 'testtoken456' })
}));

jest.mock('../../services/api', () => ({
  resetPasswordApi: {
    resetPassword: jest.fn()
  }
}));

jest.mock('../../app/components/forgot_password/ResetPasswordForm', () => {
  const React = require('react');
  
  return function MockPasswordForm({ onSubmit }: { 
    passwordValidator: any,
    onSubmit: (password: string, confirmPassword: string) => Promise<void>
  }) {
    const [error, setError] = React.useState('');
    const [formSubmitted, setFormSubmitted] = React.useState(false);
    
    const simulateError = () => {
      setError('Terjadi kesalahan pada server');
    };

    const simulateSuccess = async () => {
      try {
        await onSubmit('ValidPassword123!', 'ValidPassword123!');
        setFormSubmitted(true);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error submitting form');
      }
    };

    return (
      <div data-testid="password-form">
        <button data-testid="trigger-error" onClick={simulateError}>Simulate Error</button>
        <button data-testid="trigger-success" onClick={simulateSuccess}>Submit Valid Form</button>
        {error && <div data-testid="error-message" className="text-red-600">{error}</div>}
        {formSubmitted && <div data-testid="success-message">Password berhasil diubah</div>}
      </div>
    );
  };
});

jest.mock('../../utils/PasswordValidator', () => {
  return function MockPasswordValidator() {
    return {
      validate: jest.fn((password) => {
        if (password === 'invalid') {
          return 'Password tidak memenuhi syarat';
        }
        return '';
      }),
    };
  };
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { resetPasswordApi } = require('../../services/api');
    resetPasswordApi.resetPassword.mockResolvedValue({ detail: "Password berhasil diganti" });
  });

  it('renders page with correct structure', () => {
    render(<ResetPasswordPage />);
    
    expect(screen.getByRole('heading', { name: /lupa kata sandi/i })).toBeInTheDocument();
    
    const image = screen.getByAltText(/forgot password illustration/i);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/forgotPassword.svg');
    
    expect(screen.getByTestId('password-form')).toBeInTheDocument();
  });

  it('renders with correct layout classes', () => {
    render(<ResetPasswordPage />);

    const mainContainer = screen.getByRole('heading').parentElement?.parentElement;
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'md:flex-row');
    
    const pageContainer = mainContainer?.parentElement;
    expect(pageContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
  });

  it('renders left and right sections with correct widths', () => {
    const { container } = render(<ResetPasswordPage />);
    
    const sections = container.querySelectorAll('.w-full.md\\:w-1\\/2');
    expect(sections.length).toBe(2);
    
    expect(sections[0]).toContainElement(screen.getByAltText(/forgot password illustration/i));
    
    expect(sections[1]).toContainElement(screen.getByRole('heading'));
    expect(sections[1]).toContainElement(screen.getByTestId('password-form'));
  });

  it('handles server error gracefully', async () => {
    render(<ResetPasswordPage />);
    
    fireEvent.click(screen.getByTestId('trigger-error'));
    
    const errorMessage = await screen.findByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Terjadi kesalahan pada server');
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('handles successful form submission', async () => {
    const { resetPasswordApi } = require('../../services/api');
    
    render(<ResetPasswordPage />);
    
    fireEvent.click(screen.getByTestId('trigger-success'));
    
    expect(resetPasswordApi.resetPassword).toHaveBeenCalledWith(
      'testuid123',
      'testtoken456',
      'ValidPassword123!',
      'ValidPassword123!'
    );
    
    const successMessage = await screen.findByTestId('success-message');
    expect(successMessage).toBeInTheDocument();
    expect(successMessage).toHaveTextContent('Password berhasil diubah');
  });

  it('handles API error during form submission', async () => {
    const { resetPasswordApi } = require('../../services/api');
    resetPasswordApi.resetPassword.mockRejectedValue(new Error('Invalid or expired token'));
    
    render(<ResetPasswordPage />);
    
    fireEvent.click(screen.getByTestId('trigger-success'));
    
    const errorMessage = await screen.findByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Invalid or expired token');
  });

  it('passes correct URL parameters to API', async () => {
    const { resetPasswordApi } = require('../../services/api');
    
    render(<ResetPasswordPage />);
    
    fireEvent.click(screen.getByTestId('trigger-success'));
    
    expect(resetPasswordApi.resetPassword).toHaveBeenCalledWith(
      'testuid123', 'testtoken456', 
      expect.any(String), expect.any(String)
    );
  });

  it('displays image with proper attributes', () => {
    render(<ResetPasswordPage />);
    
    const image = screen.getByAltText(/forgot password illustration/i);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/forgotPassword.svg');
    expect(image).toHaveClass('object-contain');
  });
});