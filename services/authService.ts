const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

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
      const errorData = await response.json();
      let errorMessage = 'Terjadi kesalahan saat mendaftar';
      
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
    }

    return response.json();
  }
}; 