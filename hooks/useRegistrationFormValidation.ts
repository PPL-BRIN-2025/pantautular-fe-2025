import { useState } from 'react';
import DOMPurify from 'dompurify';

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// Simple and efficient email validation pattern
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Validation messages
const VALIDATION_MESSAGES = {
  PASSWORD_REQUIRED: 'Kata sandi wajib diisi',
  PASSWORD_MISMATCH: 'Kata sandi tidak sesuai',
  EMAIL_INVALID: 'Format email tidak valid'
} as const;

export const useRegistrationFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clean input data
  const sanitizeInput = (input: string, id?: string): string => {
    if (input === '') return '';
    // For names, only remove leading/trailing spaces and prevent XSS
    if (id && (id === 'firstName' || id === 'lastName')) {
      return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
    }
    // For other fields, use the original sanitization
    return DOMPurify.sanitize(input.trim());
  };

  const getPasswordValidationResult = (password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
    errorMessage?: string;
  } => {
    const feedback: string[] = [];
    let score = 0;
    let errorMessage = '';

    if (password.length >= PASSWORD_REQUIREMENTS.minLength) score++;
    else feedback.push(`Password minimal ${PASSWORD_REQUIREMENTS.minLength} karakter`);

    if (PASSWORD_REQUIREMENTS.requireUppercase && /[A-Z]/.test(password)) score++;
    else feedback.push('Password harus mengandung huruf kapital');

    if (PASSWORD_REQUIREMENTS.requireLowercase && /[a-z]/.test(password)) score++;
    else feedback.push('Password harus mengandung huruf kecil');

    if (PASSWORD_REQUIREMENTS.requireNumbers && /[0-9]/.test(password)) score++;
    else feedback.push('Password harus mengandung angka');

    if (PASSWORD_REQUIREMENTS.requireSpecialChars && /[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('Password harus mengandung karakter khusus');

    if (/(.)\1{2,}/.test(password)) feedback.push('Password tidak boleh mengandung karakter yang berulang');
    if (/password|123456|qwerty|admin/i.test(password)) feedback.push('Password terlalu umum atau mudah ditebak');

    const isValid = feedback.length === 0;
    if (!isValid) errorMessage = feedback[0];

    return { isValid, score, feedback, errorMessage };
  };

  const validateForm = (formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): boolean => {
    const newErrors: Record<string, string> = {};
    const sanitizedFirstName = sanitizeInput(formData.firstName, 'firstName');
    const sanitizedLastName = sanitizeInput(formData.lastName, 'lastName');
    const sanitizedEmail = sanitizeInput(formData.email);

    if (!sanitizedFirstName) newErrors.firstName = 'Nama depan wajib diisi';
    else if (/[0-9]/.test(sanitizedFirstName)) newErrors.firstName = 'Nama depan tidak boleh mengandung angka';
    
    if (!sanitizedLastName) newErrors.lastName = 'Nama belakang wajib diisi';
    else if (/[0-9]/.test(sanitizedLastName)) newErrors.lastName = 'Nama belakang tidak boleh mengandung angka';

    if (!sanitizedEmail) {
      newErrors.email = 'Email wajib diisi';
    } else if (!EMAIL_PATTERN.test(sanitizedEmail)) {
      newErrors.email = VALIDATION_MESSAGES.EMAIL_INVALID;
    }

    if (!formData.password) {
      newErrors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    } else {
      const result = getPasswordValidationResult(formData.password);
      if (!result.isValid) {
        newErrors.password = result.errorMessage ?? 'Password tidak valid';
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = VALIDATION_MESSAGES.PASSWORD_MISMATCH;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    errors,
    validateForm,
    sanitizeInput,
    getPasswordValidationResult
  };
}; 