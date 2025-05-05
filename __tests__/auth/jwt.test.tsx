import { JWTStrategy } from '../../app/auth/strategies/jwt';
import { authService } from '../../services/authService';

// Mock authService
jest.mock('../../services/authService', () => ({
  authService: {
    login: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
} as unknown as Storage;

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test constants for passwords - clearly marked as test data
const TEST_PASSWORDS = {
  // Test data only - not real passwords
  current: 'test123',
  wrong: 'wrong123',
  new: 'Test123!',
  different: 'Test456!'
} as const;

// Test data
const TEST_DATA = {
  email: 'test@example.com',
  password: TEST_PASSWORDS.current
} as const;

describe('JWTStrategy', () => {
  let jwt: JWTStrategy;
  const mockUser = {
    id: 1,
    email: TEST_DATA.email,
    name: 'Test User',
    role: 'user'
  };

  // Create a valid JWT token format
  const mockTokenPayload = {
    user_id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    role: mockUser.role,
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  };
  const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(mockTokenPayload))}.signature`;

  beforeEach(() => {
    jwt = new JWTStrategy();
    jest.clearAllMocks();
    (authService.login as jest.Mock).mockResolvedValue({ access_token: mockToken });
  });

  it('logs in successfully', async () => {
    await jwt.login(TEST_DATA);
    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', mockToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  it('fetches user correctly', async () => {
    (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockUser));
    const user = await jwt.getUser();
    expect(user).toEqual(mockUser);
  });

  it('logs out correctly', async () => {
    await jwt.logout();
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });
});

// app/auth/strategies/base.ts
export interface AuthStrategy {
    login(credentials: any): Promise<any>
    logout(): Promise<void>
    getUser(): Promise<any>
  }
  

