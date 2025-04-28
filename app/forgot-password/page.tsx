'use client';

import { useState } from 'react';
import { emailSubmitAPI } from '../../services/api';

// Email validation pattern
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email tidak boleh kosong');
      return false;
    }
    
    if (!EMAIL_PATTERN.test(email)) {
      setEmailError('Format email tidak valid');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate email before submitting
    if (!validateEmail(email)) {
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await emailSubmitAPI.requestPasswordReset(email);
      
      if (result.success) {
        setMessage('Jika email terdaftar, kami telah mengirimkan link reset password ke email Anda.');
      } else {
        setMessage(result.error ?? 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Terjadi kesalahan jaringan. Coba lagi nanti.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left side */}
      <div className="flex flex-col items-center justify-center bg-white p-6 md:w-1/2">
        <div className="flex w-full items-center justify-center mb-2">
          <div className="illustration-placeholder -mt-6">
            <img src="/logo-forgotPassword.svg" alt="Forgot Password Illustration" className="object-contain max-h-96" />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col justify-center p-4 md:w-1/2">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#0A2463]">Lupa Kata Sandi</h1>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate data-testid="forgot-password-form">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-lg font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Masukkan email terdaftar"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                className={`w-full rounded-md border ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                } p-3 focus:border-[#0066CC] focus:outline-none focus:ring-1 focus:ring-[#0066CC]`}
                required
                data-testid="email-input"
              />
              {/* Only render the error element when there's an error */}
              {emailError && (
                <p 
                  className="text-red-500 text-sm mt-1" 
                  data-testid="email-error"
                >
                  {emailError}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <div className="flex items-center">
                <span className="text-[#0066CC]">•</span>
                <span className="ml-2 text-[#0066CC]">Isi dengan email yang sudah terdaftar sebelumnya</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#0066CC] py-3 text-white hover:bg-[#0055AA] focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 transition-colors"
              data-testid="submit-button"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim'}
            </button>

            {/* Only render the message element when there's a message */}
            {message && (
              <div 
                className="mt-4 text-center text-sm text-gray-600"
                data-testid="feedback-message"
              >
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}