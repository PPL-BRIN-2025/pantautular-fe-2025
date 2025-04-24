// __tests__/register/register.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../../app/register/page';
import '@testing-library/jest-dom';
import { authService } from '../../services/authService';

/**
 * Test-specific constants
 * These values are only used in test environment and should never be used in production
 */
const TEST_CONSTANTS = {
  PASSWORD: 'testPassword123!',
  EMAIL: 'test@example.com',
  FIRST_NAME: 'Test',
  LAST_NAME: 'User'
} as const;

/**
 * Error message constants for tests
 * These messages are only used in test environment
 */
const TEST_ERROR_MESSAGES = {
  FIRST_NAME_REQUIRED: 'Nama depan wajib diisi',
  LAST_NAME_REQUIRED: 'Nama belakang wajib diisi',
  EMAIL_REQUIRED: 'Email wajib diisi',
  EMAIL_INVALID: 'Format email tidak valid',
  PASSWORD_REQUIRED: 'Kata sandi wajib diisi',
  PASSWORD_MIN_LENGTH: 'Password minimal 8 karakter',
  EMAIL_ALREADY_EXISTS: 'Email sudah terdaftar',
  TOO_MANY_ATTEMPTS: 'Terlalu banyak percobaan. Silakan coba lagi dalam 5 menit.'
} as const;

// Simple and efficient email validation pattern
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Mock the authService
jest.mock('../../services/authService', () => ({
  authService: {
    register: jest.fn().mockImplementation(() => {
      return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
          reject(new Error(TEST_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS));
        }, 100);
      });
    }),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the hooks
jest.mock('../../hooks/useRegistrationFormValidation', () => {
  const mockErrors = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };
  
  return {
    useRegistrationFormValidation: () => {
      const validateForm = jest.fn((formData: any) => {
        // Reset errors
        mockErrors.firstName = '';
        mockErrors.lastName = '';
        mockErrors.email = '';
        mockErrors.password = '';
        
        // Validate first name
        if (!formData.firstName) {
          mockErrors.firstName = TEST_ERROR_MESSAGES.FIRST_NAME_REQUIRED;
        }
        
        // Validate last name
        if (!formData.lastName) {
          mockErrors.lastName = TEST_ERROR_MESSAGES.LAST_NAME_REQUIRED;
        }
        
        // Validate email
        if (!formData.email) {
          mockErrors.email = TEST_ERROR_MESSAGES.EMAIL_REQUIRED;
        } else if (!EMAIL_PATTERN.test(formData.email)) {
          mockErrors.email = TEST_ERROR_MESSAGES.EMAIL_INVALID;
        }
        
        // Validate password
        if (!formData.password) {
          mockErrors.password = TEST_ERROR_MESSAGES.PASSWORD_REQUIRED;
        }
        
        return Object.values(mockErrors).every(error => !error);
      });
      
      return {
        errors: mockErrors,
        validateForm,
        sanitizeInput: jest.fn((value: string) => value),
        getPasswordValidationResult: jest.fn(() => ({ 
          score: 0, 
          feedback: [TEST_ERROR_MESSAGES.PASSWORD_MIN_LENGTH] 
        })),
      };
    },
  };
});

jest.mock('../../hooks/useRateLimit', () => ({
  useRateLimit: () => ({
    checkRateLimit: jest.fn().mockReturnValue({ isAllowed: true, timeLeft: 0 }),
    addAttempt: jest.fn(),
  }),
}));

// Test helper functions
const fillFormWithValidData = () => {
  fireEvent.change(screen.getByLabelText('Nama Depan'), { target: { value: TEST_CONSTANTS.FIRST_NAME } });
  fireEvent.change(screen.getByLabelText('Nama Belakang'), { target: { value: TEST_CONSTANTS.LAST_NAME } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: TEST_CONSTANTS.EMAIL } });
  fireEvent.change(screen.getByLabelText('Kata Sandi'), { target: { value: TEST_CONSTANTS.PASSWORD } });
  fireEvent.change(screen.getByLabelText('Konfirmasi Kata Sandi'), { target: { value: TEST_CONSTANTS.PASSWORD } });
};

const mockValidationHook = (options: {
  errors?: Record<string, string>;
  validateForm?: jest.Mock;
  getPasswordValidationResult?: jest.Mock;
  sanitizeInput?: jest.Mock;
}) => {
  jest.spyOn(require('../../hooks/useRegistrationFormValidation'), 'useRegistrationFormValidation').mockImplementation(() => ({
    errors: options.errors ?? {},
    validateForm: options.validateForm ?? jest.fn().mockReturnValue(true),
    sanitizeInput: options.sanitizeInput ?? jest.fn().mockImplementation(value => value),
    getPasswordValidationResult: options.getPasswordValidationResult ?? jest.fn().mockReturnValue({ score: 4, feedback: [] })
  }));
};

const mockRateLimitHook = (isAllowed: boolean = true, timeLeft: number = 0) => {
  jest.spyOn(require('../../hooks/useRateLimit'), 'useRateLimit').mockImplementation(() => ({
    checkRateLimit: jest.fn().mockReturnValue({ isAllowed, timeLeft }),
    addAttempt: jest.fn(),
  }));
};

const mockAuthServiceRegister = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(TEST_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS));
    }, 100);
  });
};

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.register as jest.Mock).mockImplementation(mockAuthServiceRegister);
  });

  it('renders the register page correctly', () => {
    render(<RegisterPage />);
    
    expect(screen.getByText('Mari bergabung dengan PantauTular!')).toBeInTheDocument();
    expect(screen.getByLabelText('Nama Depan')).toBeInTheDocument();
    expect(screen.getByLabelText('Nama Belakang')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Kata Sandi')).toBeInTheDocument();
    expect(screen.getByLabelText('Konfirmasi Kata Sandi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Daftar' })).toBeInTheDocument();
    expect(screen.getByText('Sudah memiliki akun?')).toBeInTheDocument();
    expect(screen.getByText('Masuk')).toBeInTheDocument();
  });

  it('prevents numbers in name fields', async () => {
    render(<RegisterPage />);
    
    const firstNameInput = screen.getByLabelText('Nama Depan');
    const lastNameInput = screen.getByLabelText('Nama Belakang');
    
    fireEvent.change(firstNameInput, { target: { value: 'John123' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe456' } });
    
    expect(firstNameInput).toHaveValue('John');
    expect(lastNameInput).toHaveValue('Doe');
  });

  it('validates password strength and shows feedback', async () => {
    mockValidationHook({
      getPasswordValidationResult: jest.fn().mockImplementation((password) => {
        if (password === 'weak') {
          return {
            score: 1,
            feedback: ['Password minimal 8 karakter']
          };
        }
        return {
          score: 4,
          feedback: []
        };
      })
    });

    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText('Kata Sandi');
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    await waitFor(() => {
      expect(screen.getByText('Password minimal 8 karakter')).toBeInTheDocument();
      const strengthBars = document.querySelectorAll('.h-1.flex-1.rounded');
      expect(strengthBars.length).toBe(5);
      expect(strengthBars[0]).toHaveClass('bg-green-500');
      expect(strengthBars[1]).toHaveClass('bg-gray-200');
    });
    
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Password minimal 8 karakter')).not.toBeInTheDocument();
      const strengthBars = document.querySelectorAll('.h-1.flex-1.rounded');
      expect(strengthBars[0]).toHaveClass('bg-green-500');
      expect(strengthBars[1]).toHaveClass('bg-green-500');
      expect(strengthBars[2]).toHaveClass('bg-green-500');
      expect(strengthBars[3]).toHaveClass('bg-green-500');
    });
  });

  it('handles successful registration', async () => {
    (authService.register as jest.Mock).mockResolvedValueOnce({});
    mockValidationHook({});
    mockRateLimitHook();
    
    render(<RegisterPage />);
    fillFormWithValidData();
    
    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }));
    
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: `${TEST_CONSTANTS.FIRST_NAME} ${TEST_CONSTANTS.LAST_NAME}`,
        email: TEST_CONSTANTS.EMAIL,
        password: TEST_CONSTANTS.PASSWORD
      });
    });
  });

  it('handles registration error', async () => {
    const errorMessage = TEST_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
    (authService.register as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    mockValidationHook({});
    mockRateLimitHook();
    
    render(<RegisterPage />);
    fillFormWithValidData();
    
    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }));
    
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it('handles rate limiting', async () => {
    mockRateLimitHook(false, 5);
    mockValidationHook({});
    
    render(<RegisterPage />);
    fillFormWithValidData();
    
    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(TEST_ERROR_MESSAGES.TOO_MANY_ATTEMPTS);
    });
  });

  it('displays password strength bars correctly', async () => {
    // Mock getPasswordValidationResult to return different scores
    mockValidationHook({
      getPasswordValidationResult: jest.fn().mockImplementation((password) => {
        if (password === 'weak') {
          return {
            score: 2,
            feedback: ['Password minimal 8 karakter']
          };
        }
        return {
          score: 4,
          feedback: []
        };
      })
    });

    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText('Kata Sandi');
    
    // Input weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    // Wait for debounce
    await waitFor(() => {
      const strengthBars = document.querySelectorAll('.h-1.flex-1.rounded');
      expect(strengthBars.length).toBe(5);
      // Check that only 2 bars are filled
      expect(strengthBars[0]).toHaveClass('bg-green-500');
      expect(strengthBars[1]).toHaveClass('bg-green-500');
      expect(strengthBars[2]).toHaveClass('bg-gray-200');
      expect(strengthBars[3]).toHaveClass('bg-gray-200');
      expect(strengthBars[4]).toHaveClass('bg-gray-200');
    });
    
    // Input strong password
    fireEvent.change(passwordInput, { target: { value: TEST_CONSTANTS.PASSWORD } });
    
    // Wait for debounce
    await waitFor(() => {
      const strengthBars = document.querySelectorAll('.h-1.flex-1.rounded');
      // Check that 4 bars are filled
      expect(strengthBars[0]).toHaveClass('bg-green-500');
      expect(strengthBars[1]).toHaveClass('bg-green-500');
      expect(strengthBars[2]).toHaveClass('bg-green-500');
      expect(strengthBars[3]).toHaveClass('bg-green-500');
      expect(strengthBars[4]).toHaveClass('bg-gray-200');
    });
  });

  it('handles form submission with validation errors', async () => {
    // Mock validation to return errors
    mockValidationHook({
      errors: {
        firstName: TEST_ERROR_MESSAGES.FIRST_NAME_REQUIRED,
        lastName: TEST_ERROR_MESSAGES.LAST_NAME_REQUIRED,
        email: TEST_ERROR_MESSAGES.EMAIL_REQUIRED,
        password: TEST_ERROR_MESSAGES.PASSWORD_REQUIRED
      },
      validateForm: jest.fn().mockReturnValue(false),
      sanitizeInput: jest.fn().mockImplementation(value => value),
      getPasswordValidationResult: jest.fn().mockReturnValue({ score: 0, feedback: [] })
    });

    render(<RegisterPage />);
    
    // Submit empty form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Check that error messages are displayed
    expect(screen.getByText('Nama depan wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Nama belakang wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument();
    
    // Check that form was not submitted
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('handles successful form submission', async () => {
    // Mock successful registration
    (authService.register as jest.Mock).mockResolvedValueOnce({});
    
    // Mock validation to pass
    mockValidationHook({});

    // Mock rate limit to allow submission
    mockRateLimitHook();

    render(<RegisterPage />);
    
    // Fill form with valid data
    fillFormWithValidData();
    
    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(screen.getByText('Mendaftar...')).toBeInTheDocument();
    
    // Wait for registration to complete
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: `${TEST_CONSTANTS.FIRST_NAME} ${TEST_CONSTANTS.LAST_NAME}`,
        email: TEST_CONSTANTS.EMAIL,
        password: TEST_CONSTANTS.PASSWORD
      });
    });
  });

  it('handles password strength feedback UI and form submission states', async () => {
    // Mock getPasswordValidationResult to return different scores and feedback
    mockValidationHook({
      getPasswordValidationResult: jest.fn().mockImplementation((password) => {
        if (password === 'weak') {
          return {
            score: 1,
            feedback: ['Password minimal 8 karakter', 'Gunakan kombinasi huruf dan angka']
          };
        }
        return {
          score: 4,
          feedback: []
        };
      })
    });

    // Mock successful registration
    (authService.register as jest.Mock).mockResolvedValueOnce({});
    
    // Mock rate limit to allow submission
    mockRateLimitHook();

    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText('Kata Sandi');
    
    // Input weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    // Wait for debounce and check feedback
    await waitFor(() => {
      // Check strength bars
      const strengthBars = document.querySelectorAll('.h-1.flex-1.rounded');
      expect(strengthBars.length).toBe(5);
      expect(strengthBars[0]).toHaveClass('bg-green-500');
      expect(strengthBars[1]).toHaveClass('bg-gray-200');
      
      // Check feedback messages
      expect(screen.getByText('Password minimal 8 karakter')).toBeInTheDocument();
      expect(screen.getByText('Gunakan kombinasi huruf dan angka')).toBeInTheDocument();
    });
    
    // Input strong password
    fireEvent.change(passwordInput, { target: { value: TEST_CONSTANTS.PASSWORD } });
    
    // Wait for debounce and check feedback is removed
    await waitFor(() => {
      expect(screen.queryByText('Password minimal 8 karakter')).not.toBeInTheDocument();
      expect(screen.queryByText('Gunakan kombinasi huruf dan angka')).not.toBeInTheDocument();
    });
    
    // Fill form with valid data
    fillFormWithValidData();
    fireEvent.change(screen.getByLabelText('Konfirmasi Kata Sandi'), { target: { value: TEST_CONSTANTS.PASSWORD } });
    
    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(screen.getByText('Mendaftar...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Wait for registration to complete
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: `${TEST_CONSTANTS.FIRST_NAME} ${TEST_CONSTANTS.LAST_NAME}`,
        email: TEST_CONSTANTS.EMAIL,
        password: TEST_CONSTANTS.PASSWORD
      });
    });
    
    // Check that loading state is removed
    expect(screen.queryByText('Mendaftar...')).not.toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it('handles registration error with proper error message', async () => {
    // Mock validation to pass
    mockValidationHook({});

    // Mock rate limit to allow submission
    mockRateLimitHook();

    // Mock registration to throw an error
    const errorMessage = TEST_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
    (authService.register as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(<RegisterPage />);
    
    // Fill form with valid data
    fillFormWithValidData();
    
    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(submitButton).toHaveTextContent('Mendaftar...');
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });
    
    // Check that loading state is removed
    expect(submitButton).toHaveTextContent('Daftar');
  });
});