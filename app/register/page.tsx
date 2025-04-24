'use client'

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRegistrationFormValidation } from '../../hooks/useRegistrationFormValidation';
import { useRateLimit } from '../../hooks/useRateLimit';
import { authService } from '../../services/authService';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  const { errors, validateForm, sanitizeInput, getPasswordValidationResult } = useRegistrationFormValidation();
  const { checkRateLimit, addAttempt } = useRateLimit();

  // Add debounce for password strength check
  useEffect(() => {
    const handler = setTimeout(() => {
      // istanbul ignore next
      if (formData.password) {
        const result = getPasswordValidationResult(formData.password);
        setPasswordStrength({
          score: result.score,
          feedback: result.feedback,
        });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [formData.password, getPasswordValidationResult]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    // For name fields, preserve spaces and prevent numbers
    if (id === 'firstName' || id === 'lastName') {
      // Remove any numbers from the input
      const sanitizedValue = value.replace(/[0-9]/g, '');
      setFormData(prev => ({ ...prev, [id]: sanitizedValue }));
    } else {
      const sanitizedValue = sanitizeInput(value);
      setFormData(prev => ({ ...prev, [id]: sanitizedValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    const { isAllowed, timeLeft } = checkRateLimit();
    if (!isAllowed) {
      setSubmitError(`Terlalu banyak percobaan. Silakan coba lagi dalam ${timeLeft} menit.`);
      return;
    }

    if (!validateForm(formData)) return;

    setIsLoading(true);
    try {
      addAttempt();

      await authService.register({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password
      });

      router.push('/'); // TO DO: change to login page
    } catch (error) {
      // istanbul ignore next
      setSubmitError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-[#0D2B5E] mb-8 text-center">
          Mari bergabung dengan PantauTular!
        </h1>
        {submitError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md" data-testid="error-message">
            {submitError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="firstName" className="block mb-1 font-medium">Nama Depan</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Isi nama depan"
                className={`w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md px-4 py-2`}
                maxLength={50}
                autoComplete="given-name"
              />
              {errors.firstName && <p data-testid="firstName-error" className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            <div className="flex-1">
              <label htmlFor="lastName" className="block mb-1 font-medium">Nama Belakang</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Isi nama belakang"
                className={`w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md px-4 py-2`}
                maxLength={50}
                autoComplete="family-name"
              />
              {errors.lastName && <p data-testid="lastName-error" className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Isi menggunakan domain institusi"
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md px-4 py-2`}
              maxLength={100}
              autoComplete="email"
            />
            {errors.email && <p data-testid="email-error" className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 font-medium">Kata Sandi</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
              className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md px-4 py-2`}
              minLength={8}
              autoComplete="new-password"
            />
            {errors.password && <p data-testid="password-error" className="text-red-500 text-sm mt-1">{errors.password}</p>}
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.score
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600">
                    {passwordStrength.feedback.map((msg, index) => (
                      <li key={index} className="flex items-center">
                        <span className="mr-1">•</span>
                        {msg}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-1 font-medium">Konfirmasi Kata Sandi</label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Pastikan konfirmasi kata sandi sesuai"
              className={`w-full border ${/* istanbul ignore next */ errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md px-4 py-2`}
              minLength={8}
              autoComplete="new-password"
            />
            {/* istanbul ignore next */
            errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            /* istanbul ignore next */}
          </div>
          <p className="text-sm mt-2">
            Sudah memiliki akun? <a href="/login" className="text-[#0D2B5E] font-semibold">Masuk</a>
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-[#0062E3] text-white font-semibold py-2 rounded-md mt-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            data-testid="submit-button"
          >
            {isLoading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>
      </div>
      <div className="hidden md:block mt-12 md:mt-0 md:ml-16">
        <Image 
          src="/register.png" 
          alt="Register" 
          width={300}
          height={150}
          className="w-[400px] h-auto"
          priority
        />
      </div>
    </div>
  );
}
  