import { render, screen, cleanup} from "@testing-library/react";
import Navbar from "../../app/components/Navbar";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("Navbar", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    cleanup();
    render(<Navbar />);
  });

  const testActiveMenu = (path: string, activeMenu: string, inactiveMenus: string[]) => {
    (usePathname as jest.Mock).mockReturnValue(path);
    cleanup();
    render(<Navbar />);

    expect(screen.getByText(activeMenu)).toHaveClass("font-bold text-[#1e3a8a]");

    inactiveMenus.forEach((menu) => {
      expect(screen.getByText(menu)).not.toHaveClass("font-bold text-[#1e3a8a]");
    });
  };

  it("menampilkan logo PantauTular", () => {
    expect(screen.getByAltText("PantauTular Logo")).toBeInTheDocument();
  });

  it("menampilkan menu navigasi utama", () => {
    ["Beranda", "Peta Sebaran", "Tentang Kami", "Bantuan"].forEach((menu) =>
      expect(screen.getByText(menu)).toBeInTheDocument()
    );
  });

  it("menampilkan ikon profil", () => {
    // Periksa SVG icon profil berdasarkan class
    expect(screen.getByRole('button', { 
      name: '' // Button tidak memiliki teks
    })).toBeInTheDocument();
    
    // Atau lebih spesifik menggunakan SVG class
    const userIcon = document.querySelector('.lucide-user');
    expect(userIcon).toBeInTheDocument();
  });

  it("tidak menampilkan menu yang tidak ada", () => {
    ["Kontak", "Layanan"].forEach((menu) =>
      expect(screen.queryByText(menu)).not.toBeInTheDocument()
    );
  });

  it("menandai menu aktif dengan font-bold dan warna yang benar", () => {
    testActiveMenu("/", "Beranda", ["Peta Sebaran", "Tentang Kami", "Bantuan"]);
    testActiveMenu("/map", "Peta Sebaran", ["Beranda", "Tentang Kami", "Bantuan"]);
    testActiveMenu("/about", "Tentang Kami", ["Beranda", "Peta Sebaran", "Bantuan"]);
    testActiveMenu("/help", "Bantuan", ["Beranda", "Peta Sebaran", "Tentang Kami"]);
  });

  // NEGATIVE CASES
  it("tidak memberi class aktif ke menu yang bukan halaman saat ini", () => {
    (usePathname as jest.Mock).mockReturnValue("/map");
    cleanup();
    render(<Navbar />);

    expect(screen.getByText("Beranda")).not.toHaveClass("font-bold text-[#1e3a8a]");
    expect(screen.getByText("Tentang Kami")).not.toHaveClass("font-bold text-[#1e3a8a]");
    expect(screen.getByText("Bantuan")).not.toHaveClass("font-bold text-[#1e3a8a]");
  });

  it("tidak crash jika usePathname mengembalikan undefined", () => {
    (usePathname as jest.Mock).mockReturnValue(undefined);
    cleanup();
    expect(() => render(<Navbar />)).not.toThrow();
  });

});
