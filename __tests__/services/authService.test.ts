import { authService } from '../../services/authService';
import { LoginRequestBody } from '../../types';

describe('authService.login error handling', () => {
  const originalFetch = global.fetch;
  const credentials: LoginRequestBody = { email: 'user@example.com', password: 'secret' };

  const mockErrorResponse = (status: number, detail: unknown) => ({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue(detail),
  }) as unknown as Response;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    process.env.NEXT_PUBLIC_API_KEY = 'test-key';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns Indonesian message when credentials are invalid (401)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockErrorResponse(401, { detail: 'Invalid credentials' }),
    );

    await expect(authService.login(credentials)).rejects.toThrow('Email atau kata sandi salah.');
  });

  it('returns Indonesian message when account is not found (404)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockErrorResponse(404, { detail: 'User not found' }),
    );

    await expect(authService.login(credentials)).rejects.toThrow('Akun tidak ditemukan.');
  });

  it('returns Indonesian message when access is forbidden (403)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockErrorResponse(403, { detail: 'Account inactive' }),
    );

    await expect(authService.login(credentials)).rejects.toThrow('Akses login ditolak. Hubungi administrator Anda.');
  });

  it('returns Indonesian message when rate limited (429)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockErrorResponse(429, { detail: 'Too many attempts' }),
    );

    await expect(authService.login(credentials)).rejects.toThrow('Terlalu banyak percobaan login. Silakan coba lagi beberapa menit lagi.');
  });

  it('handles validation errors with array detail (400)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockErrorResponse(400, { detail: ['Email is required'] }),
    );

    await expect(authService.login(credentials)).rejects.toThrow('Data login tidak valid. Periksa kembali email dan kata sandi Anda.');
  });

  it('falls back to server error message when JSON parsers fail', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
    });

    await expect(authService.login(credentials)).rejects.toThrow('Terjadi gangguan pada server. Silakan coba lagi nanti.');
  });
});
