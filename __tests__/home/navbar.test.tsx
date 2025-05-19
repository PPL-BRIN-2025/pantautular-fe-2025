import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthProvider } from "../../app/auth/provider";
import Navbar from "../../app/components/Navbar";

// Mock next/image supaya tidak error useContext di testing
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

// Simpan mock push di module scope supaya bisa dipakai di semua test
let mockPush = jest.fn();

// Mock next/navigation hanya sekali saja di sini
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: jest.fn(() => "/"),
  __esModule: true,
}));

// Mock useAuth di top-level, akan diubah return valuenya di setiap describe
const mockUseAuth = jest.fn();
jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));


describe("Navbar - user not logged in", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: jest.fn(),
    });
    render(
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("menampilkan logo PantauTular", () => {
    expect(screen.getByAltText("PantauTular Logo")).toBeInTheDocument();
  });

  it("menampilkan menu navigasi utama", () => {
    expect(screen.getByText("Beranda")).toBeInTheDocument();
    expect(screen.getByText("Peta Sebaran")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Tentang Kami")).toBeInTheDocument();
    expect(screen.getByText("Bantuan")).toBeInTheDocument();
  });

  it("menampilkan tombol login dan register", () => {
    expect(screen.getByText("Masuk")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("menandai menu aktif dengan class yang sesuai", () => {
    const beranda = screen.getByText("Beranda");
    expect(beranda).toHaveClass("font-bold", "text-[#1e3a8a]");
  });

  it("tidak memberi class aktif ke menu non-aktif", () => {
    const tentangKami = screen.getByText("Tentang Kami");
    expect(tentangKami).not.toHaveClass("font-bold", "text-[#1e3a8a]");
  });

  it("tidak menampilkan menu yang tidak ada", () => {
    expect(screen.queryByText("Menu Tidak Ada")).not.toBeInTheDocument();
  });

  it("mengarahkan ke /login saat tombol Masuk diklik", () => {
    const loginButton = screen.getByText("Masuk");
    fireEvent.click(loginButton);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("mengarahkan ke /register saat tombol Register diklik", () => {
    const registerButton = screen.getByText("Register");
    fireEvent.click(registerButton);
    expect(mockPush).toHaveBeenCalledWith("/register");
  });
});


describe("Navbar - user logged in", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { name: "Test User" },
      logout: jest.fn(),
    });
    render(
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("menampilkan ikon profil saat user login", () => {
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("tidak menampilkan tombol Masuk dan Register saat user login", () => {
    expect(screen.queryByText("Masuk")).not.toBeInTheDocument();
    expect(screen.queryByText("Register")).not.toBeInTheDocument();
  });

  
  it("menampilkan PasswordSettings saat menu Pengaturan diklik", async () => {
    const profileButton = screen.getAllByRole("button")[0];
    fireEvent.click(profileButton);
    fireEvent.keyDown(profileButton, { key: "ArrowDown" }); // Tambahan penting!

    const pengaturan = await within(document.body).findByText("Pengaturan");
    fireEvent.click(pengaturan);

    expect(await screen.findByRole("heading", { name: /Ubah Kata Sandi/i })).toBeInTheDocument();
  });

  it("memanggil logout saat menu Keluar diklik", async () => {
    const profileButton = screen.getAllByRole("button")[0];
    fireEvent.click(profileButton);
    fireEvent.keyDown(profileButton, { key: "ArrowDown" }); // Tambahan penting!

    const keluar = await within(document.body).findByText("Keluar");
    fireEvent.click(keluar);

    expect(mockUseAuth.mock.results[0].value.logout).toHaveBeenCalled();
  });

  it("menutup PasswordSettings saat tombol close diklik", async () => {
    const profileButton = screen.getAllByRole("button")[0];
    fireEvent.click(profileButton);
    fireEvent.keyDown(profileButton, { key: "ArrowDown" });

    const pengaturan = await within(document.body).findByText("Pengaturan");
    fireEvent.click(pengaturan);

    // Modal muncul
    expect(await screen.findByRole("heading", { name: /Ubah Kata Sandi/i })).toBeInTheDocument();

    // Cari tombol close di dalam modal
    const modal = await within(document.body).findByTestId("password-settings");
    const closeButton = within(modal).getAllByRole("button")[0];
    fireEvent.click(closeButton);

    // Modal hilang
    expect(screen.queryByRole("heading", { name: /Ubah Kata Sandi/i })).not.toBeInTheDocument();
  });

});


describe("Navbar - usePathname undefined", () => {
  it("tidak crash jika usePathname mengembalikan undefined", () => {
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue(undefined);

    mockUseAuth.mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    expect(() => {
      render(
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      );
    }).not.toThrow();
  });
});