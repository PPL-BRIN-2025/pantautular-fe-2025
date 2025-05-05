import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../../app/page";

jest.mock("../../app/layout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../app/auth/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    },
    login: jest.fn(),
    logout: jest.fn()
  })
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: jest.fn(() => "/"),
}));

describe("Home Page", () => {
  beforeEach(() => {
    render(<Home />);
  });

  const getButton = (name: string) => screen.getByRole("button", { name });

  it("menampilkan elemen utama", () => {
    expect(screen.getByText("Selamat Datang di PantauTular!")).toBeInTheDocument();
    expect(screen.getByAltText("PantauTular_home")).toBeInTheDocument();
    expect(screen.getByText(/Bekerja sama dengan Badan Riset dan Inovasi Nasional/i)).toBeInTheDocument();
  });

  it("tombol 'Gunakan Sekarang!' berfungsi", () => {
    fireEvent.click(getButton("Gunakan Sekarang!"));
    expect(mockPush).toHaveBeenCalledWith("/map");
  });

  it("tombol 'Lihat Sekarang' berfungsi", () => {
    fireEvent.click(getButton("Lihat Sekarang"));
    expect(mockPush).toHaveBeenCalledWith("/about");
  });

  it("tombol 'Baca Selengkapnya' berfungsi", () => {
    fireEvent.click(getButton("Baca Selengkapnya"));
    expect(mockPush).toHaveBeenCalledWith("/help");
  });

  it("memastikan elemen yang tidak seharusnya ada tidak muncul", () => {
    ["Selamat Datang di Fasilkom-C02!", "Pusat Informasi Penyakit"].forEach((text) =>
      expect(screen.queryByText(text)).not.toBeInTheDocument()
    );

    ["Mulai Sekarang", "Daftar"].forEach((btn) =>
      expect(screen.queryByRole("button", { name: btn })).not.toBeInTheDocument()
    );
  });

  it("menampilkan tiga gambar dalam MapGallery", () => {
    ["Peta Sebaran 1", "Peta Sebaran 2", "Peta Sebaran 3"].forEach((altText) =>
      expect(screen.getByAltText(altText)).toBeInTheDocument()
    );
  });

  it("tidak menampilkan gambar yang tidak seharusnya ada", () => {
    ["Peta Sebaran 200", "Peta Sebaran Tidak Ada", "Peta Dummy"].forEach((altText) =>
      expect(screen.queryByAltText(altText)).not.toBeInTheDocument()
    );
  });
});
