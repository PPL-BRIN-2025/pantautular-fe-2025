import { JWTStrategy } from "../../app/auth/strategies/jwt";
import { authService } from "../../services/authService";

jest.mock("../../services/authService", () => ({
  authService: {
    login: jest.fn(),
  },
}));

const createToken = (payload: Record<string, unknown>) => {
  const encoded = Buffer.from(JSON.stringify(payload))
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `header.${encoded}.signature`;
};

beforeAll(() => {
  if (!(global as any).atob) {
    (global as any).atob = (input: string) =>
      Buffer.from(input, "base64").toString("binary");
  }
});

describe("JWTStrategy", () => {
  const loginMock = authService.login as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("login stores token and user info then reports not expired", async () => {
    const payload = {
      user_id: "123",
      email: "user@example.com",
      name: "User Example",
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    loginMock.mockResolvedValue({ access_token: createToken(payload) });
    const strategy = new JWTStrategy();

    await strategy.login({ email: "user@example.com", password: "secret" });

    expect(loginMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
    });
    expect(localStorage.getItem("accessToken")).toBeTruthy();
    expect(await strategy.getUser()).toEqual({
      id: "123",
      email: "user@example.com",
      name: "User Example",
      role: "ADMIN",
    });
    expect(strategy.isTokenExpired()).toBe(false);
  });

  test("isTokenExpired returns true when token payload is expired", async () => {
    const payload = {
      user_id: "1",
      email: "expired@example.com",
      name: "Expired",
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) - 10,
    };
    loginMock.mockResolvedValue({ access_token: createToken(payload) });
    const strategy = new JWTStrategy();

    await strategy.login({ email: "expired@example.com", password: "x" });
    expect(strategy.isTokenExpired()).toBe(true);
  });

  test("login throws when token cannot be decoded", async () => {
    loginMock.mockResolvedValue({ access_token: "malformed.token" });
    const strategy = new JWTStrategy();

    await expect(
      strategy.login({ email: "bad@example.com", password: "x" })
    ).rejects.toThrow("Invalid token format");
  });

  test("logout clears stored token and user", async () => {
    const payload = {
      user_id: "5",
      email: "logout@example.com",
      name: "Logout",
      role: "USER",
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    loginMock.mockResolvedValue({ access_token: createToken(payload) });
    const strategy = new JWTStrategy();

    await strategy.login({ email: "logout@example.com", password: "pass" });
    await strategy.logout();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(await strategy.getUser()).toBeNull();
    expect(strategy.isTokenExpired()).toBe(true);
  });
});
