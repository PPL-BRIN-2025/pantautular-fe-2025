import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "../../app/components/Navbar";
import { AuthProvider } from "../../app/auth/provider";

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: jest.fn(() => "/"),
}));

describe("Navbar", () => {
  beforeEach(() => {
    render(
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    );
  });

  it("menampilkan logo PantauTular", () => {
    const logo = screen.getByAltText("PantauTular Logo");
    expect(logo).toBeInTheDocument();
  });

  it("menampilkan menu navigasi utama", () => {
    const beranda = screen.getByText("Beranda");
    const petaSebaran = screen.getByText("Peta Sebaran");
    const tentangKami = screen.getByText("Tentang Kami");
    const bantuan = screen.getByText("Bantuan");

    expect(beranda).toBeInTheDocument();
    expect(petaSebaran).toBeInTheDocument();
    expect(tentangKami).toBeInTheDocument();
    expect(bantuan).toBeInTheDocument();
  });

  it("menampilkan tombol login dan register", () => {
    const loginButton = screen.getByText("Masuk");
    const registerButton = screen.getByText("Register");

    expect(loginButton).toBeInTheDocument();
    expect(registerButton).toBeInTheDocument();
  });

  it("tidak menampilkan menu yang tidak ada", () => {
    const nonExistentMenu = screen.queryByText("Menu Tidak Ada");
    expect(nonExistentMenu).not.toBeInTheDocument();
  });

  it("menandai menu aktif dengan font-bold dan warna yang benar", () => {
    const beranda = screen.getByText("Beranda");
    expect(beranda).toHaveClass("font-bold", "text-[#1e3a8a]");
  });

  it("tidak memberi class aktif ke menu yang bukan halaman saat ini", () => {
    const tentangKami = screen.getByText("Tentang Kami");
    const bantuan = screen.getByText("Bantuan");

    expect(tentangKami).not.toHaveClass("font-bold", "text-[#1e3a8a]");
    expect(bantuan).not.toHaveClass("font-bold", "text-[#1e3a8a]");
  });

  it("tidak crash jika usePathname mengembalikan undefined", () => {
    jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue(undefined);
    
    expect(() => {
      render(
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      );
    }).not.toThrow();
  });
});
