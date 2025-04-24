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
  EMAIL_INVALID: 'Format email tidak valid',
  NAME_CONTAINS_NUMBER: 'Tidak boleh mengandung angka'
} as const;

// Password validation helper functions
const checkPasswordLength = (password: string, feedback: string[]): number => {
  if (password.length >= PASSWORD_REQUIREMENTS.minLength) return 1;
  feedback.push(`Password minimal ${PASSWORD_REQUIREMENTS.minLength} karakter`);
  return 0;
};

const checkPasswordCase = (password: string, feedback: string[]): number => {
  let score = 0;
  if (PASSWORD_REQUIREMENTS.requireUppercase && /[A-Z]/.test(password)) score++;
  else feedback.push('Password harus mengandung huruf kapital');

  if (PASSWORD_REQUIREMENTS.requireLowercase && /[a-z]/.test(password)) score++;
  else feedback.push('Password harus mengandung huruf kecil');

  return score;
};

const checkPasswordSpecialChars = (password: string, feedback: string[]): number => {
  if (PASSWORD_REQUIREMENTS.requireNumbers && /\d/.test(password)) {
    if (PASSWORD_REQUIREMENTS.requireSpecialChars && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 2;
    }
    feedback.push('Password harus mengandung karakter khusus');
    return 1;
  }
  feedback.push('Password harus mengandung angka');
  return 0;
};

const checkPasswordCommonPatterns = (password: string, feedback: string[]): void => {
  if (/(.)\1{2,}/.test(password)) feedback.push('Password tidak boleh mengandung karakter yang berulang');
  if (/password|123456|qwerty|admin/i.test(password)) feedback.push('Password terlalu umum atau mudah ditebak');
};

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

    score += checkPasswordLength(password, feedback);
    score += checkPasswordCase(password, feedback);
    score += checkPasswordSpecialChars(password, feedback);
    checkPasswordCommonPatterns(password, feedback);

    const isValid = feedback.length === 0;
    const errorMessage = isValid ? undefined : feedback[0];

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
    else if (/\d/.test(sanitizedFirstName)) newErrors.firstName = VALIDATION_MESSAGES.NAME_CONTAINS_NUMBER;
    
    if (!sanitizedLastName) newErrors.lastName = 'Nama belakang wajib diisi';
    else if (/\d/.test(sanitizedLastName)) newErrors.lastName = VALIDATION_MESSAGES.NAME_CONTAINS_NUMBER;

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