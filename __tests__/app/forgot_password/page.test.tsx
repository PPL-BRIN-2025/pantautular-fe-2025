import React from 'react';
import { render, screen, fireEvent, waitFor, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPasswordPage from "../../../app/forgot-password/page";
import { emailSubmitAPI } from '../../../services/api';

// Mock the API module
jest.mock('../../../services/api', () => ({
  emailSubmitAPI: {
    requestPasswordReset: jest.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  // Helper functions to reduce duplication
  const renderPage = (): RenderResult => render(<ForgotPasswordPage />);
  
  const fillEmailForm = (value: string) => {
    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value } });
  };
  
  const submitForm = () => {
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
  };
  
  const setupApiSuccess = () => {
    (emailSubmitAPI.requestPasswordReset as jest.Mock).mockResolvedValueOnce({ 
      success: true 
    });
  };
  
  const setupApiError = (errorMessage?: string) => {
    (emailSubmitAPI.requestPasswordReset as jest.Mock).mockResolvedValueOnce({ 
      success: false, 
      error: errorMessage 
    });
  };
  
  const setupNetworkError = () => {
    (emailSubmitAPI.requestPasswordReset as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );
  };
  
  const expectErrorMessage = (text: string) => {
    const errorElement = screen.getByTestId('email-error');
    expect(errorElement).toHaveTextContent(text);
    expect(errorElement).toBeVisible();
  };
  
  const expectFeedbackMessage = async (text: string) => {
    await waitFor(() => {
      const messageElement = screen.getByTestId('feedback-message');
      expect(messageElement).toHaveTextContent(text);
      expect(messageElement).toBeVisible();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the forgot password page correctly', () => {
    renderPage();
    
    expect(screen.getByText('Lupa Kata Sandi')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kirim/i })).toBeInTheDocument();
    expect(screen.getByAltText('Forgot Password Illustration')).toBeInTheDocument();
    expect(screen.getByText('Isi dengan email yang sudah terdaftar sebelumnya')).toBeInTheDocument();
  });

  describe('Email validation', () => {
    it('validates empty email', () => {
      renderPage();
      submitForm();
      expectErrorMessage('Email tidak boleh kosong');
    });
  
    it('validates invalid email format', () => {
      renderPage();
      fillEmailForm('invalid-email');
      submitForm();
      expectErrorMessage('Format email tidak valid');
    });
  
    it('clears validation error when entering valid email after error', () => {
      renderPage();
      fillEmailForm('invalid-email');
      submitForm();
      
      const errorElement = screen.getByTestId('email-error');
      expect(errorElement).toHaveTextContent('Format email tidak valid');
      
      fillEmailForm('valid@example.com');
      expect(errorElement).not.toBeVisible();
    });
  });

  describe('API interactions', () => {
    it('successfully submits the form with valid email', async () => {
      setupApiSuccess();
      renderPage();
      
      fillEmailForm('valid@example.com');
      submitForm();
      
      expect(screen.getByText('Mengirim...')).toBeInTheDocument();
      
      await expectFeedbackMessage('Jika email terdaftar, kami telah mengirimkan link reset password ke email Anda.');
      
      expect(emailSubmitAPI.requestPasswordReset).toHaveBeenCalledWith('valid@example.com');
      expect(screen.getByRole('button', { name: /Kirim/i })).toBeInTheDocument();
    });
  
    it('handles API error with error message', async () => {
      const errorMessage = 'Email tidak terdaftar';
      setupApiError(errorMessage);
      
      renderPage();
      fillEmailForm('valid@example.com');
      submitForm();
      
      await expectFeedbackMessage(errorMessage);
    });
  
    it('handles API error without specific error message', async () => {
      setupApiError();
      
      renderPage();
      fillEmailForm('valid@example.com');
      submitForm();
      
      await expectFeedbackMessage('Terjadi kesalahan. Silakan coba lagi.');
    });
  
    it('handles network error', async () => {
      setupNetworkError();
      
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderPage();
      fillEmailForm('valid@example.com');
      submitForm();
      
      await expectFeedbackMessage('Terjadi kesalahan jaringan. Coba lagi nanti.');
      
      expect(console.error).toHaveBeenCalled();
      (console.error as jest.Mock).mockRestore();
    });
  });
});