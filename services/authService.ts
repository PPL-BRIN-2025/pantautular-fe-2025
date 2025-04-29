import { LoginRequestBody } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Helper function to handle API error responses
const handleApiError = async (response: Response, defaultMessage: string) => {
  const errorData = await response.json();
  let errorMessage = defaultMessage;
  
  if (errorData.detail) {
    if (Array.isArray(errorData.detail)) {
      // Get the first error message and clean it
      const rawMessage = errorData.detail[0];
      // Remove all special characters and quotes
      errorMessage = rawMessage.replace(/[[\]'"]/g, '');
    } else if (typeof errorData.detail === 'string') {
      errorMessage = errorData.detail;
    }
  }
  
  throw new Error(errorMessage);
};

export const authService = {
  register: async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/authentication/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': String(API_KEY),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return handleApiError(response, 'Terjadi kesalahan saat mendaftar');
    }

    return response.json();
  },

  login: async (data: LoginRequestBody) => {
    const response = await fetch(`${API_BASE_URL}/authentication/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': String(API_KEY),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return handleApiError(response, 'Terjadi kesalahan saat masuk');
    }
    return response.json();
  }
};