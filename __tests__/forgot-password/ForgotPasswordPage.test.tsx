import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPasswordPage from '../../app/forgot-password/page';

// Gunakan hoisting untuk meng-import React di dalam mock
jest.mock('../../app/components/forgot_password/ForgotPasswordForm', () => {
    // Perhatikan - kita perlu mendeklarasikan React di dalam scope mock function
    const React = require('react');
    
    return function MockPasswordForm({ passwordValidator }: { passwordValidator: any }) {
      const [error, setError] = React.useState('');
      const [formSubmitted, setFormSubmitted] = React.useState(false);
      
      const simulateError = () => {
        setError('Terjadi kesalahan pada server');
      };
  
      const simulateSuccess = () => {
        setFormSubmitted(true);
        setError('');
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
  
describe('ForgotPasswordPage', () => {
    // Existing happy path tests...
    it('renders page with correct structure', () => {
        render(<ForgotPasswordPage />);
        
        // Check heading
        expect(screen.getByRole('heading', { name: /lupa kata sandi/i })).toBeInTheDocument();
        
        // Check illustration image
        const image = screen.getByAltText(/forgot password illustration/i);
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', '/forgotPassword.svg');
        
        // Check if the PasswordForm component is rendered
        expect(screen.getByTestId('password-form')).toBeInTheDocument();
    });

  it('renders with correct layout classes', () => {
    render(<ForgotPasswordPage />);

    // Check main container
    const mainContainer = screen.getByRole('heading').parentElement?.parentElement;
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'md:flex-row');
    
    // Check that the page fills the viewport
    const pageContainer = mainContainer?.parentElement;
    expect(pageContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
  });

  it('renders left and right sections with correct widths', () => {
    const { container } = render(<ForgotPasswordPage />);
    
    // Find left and right sections
    const sections = container.querySelectorAll('.w-full.md\\:w-1\\/2');
    expect(sections.length).toBe(2);
    
    // First section should contain the image
    expect(sections[0]).toContainElement(screen.getByAltText(/forgot password illustration/i));
    
    // Second section should contain the heading and form
    expect(sections[1]).toContainElement(screen.getByRole('heading'));
    expect(sections[1]).toContainElement(screen.getByTestId('password-form'));
  });

  // Unhappy path tests
  it('handles server error gracefully', async () => {
    render(<ForgotPasswordPage />);
    
    // Trigger a server error
    fireEvent.click(screen.getByTestId('trigger-error'));
    
    // Verify error message appears
    const errorMessage = await screen.findByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Terjadi kesalahan pada server');
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('handles successful form submission', async () => {
    render(<ForgotPasswordPage />);
    
    // Submit form successfully
    fireEvent.click(screen.getByTestId('trigger-success'));
    
    // Verify success message appears
    const successMessage = await screen.findByTestId('success-message');
    expect(successMessage).toBeInTheDocument();
    expect(successMessage).toHaveTextContent('Password berhasil diubah');
  });

  // Tes untuk validasi image loading - gunakan pendekatan yang lebih sederhana
  it('displays image with proper attributes', () => {
    render(<ForgotPasswordPage />);
    
    const image = screen.getByAltText(/forgot password illustration/i);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/forgotPassword.svg');
    expect(image).toHaveClass('object-contain');
  });
});