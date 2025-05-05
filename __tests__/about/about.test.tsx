import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import About from "../../app/about/page";

jest.mock("../styles/globals.css", () => ({}));

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

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: jest.fn(() => "/"),
}));

describe("About Page", () => {
  beforeEach(() => {
    render(<About />);
  });

  const checkTextPresence = (text: string | RegExp, method: 'should' | 'shouldNot' = 'should') => {
    if (method === 'should') {
      expect(screen.getByText(text)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  };

  const checkAltTextPresence = (altText: string, method: 'should' | 'shouldNot' = 'should') => {
    if (method === 'should') {
      expect(screen.getByAltText(altText)).toBeInTheDocument();
    } else {
      expect(screen.queryByAltText(altText)).not.toBeInTheDocument();
    }
  };

  it("menampilkan judul utama 'Tentang PantauTular'", () => {
    checkTextPresence("Tentang PantauTular", 'should');
  });

  it("tidak menampilkan teks yang salah pada judul utama", () => {
    checkTextPresence("Tentang Fasilkom UI", 'shouldNot');
  });

  it("menampilkan paragraf utama dengan BRIN", () => {
    checkTextPresence(/Bekerja sama dengan Badan Riset dan Inovasi Nasional/i, 'should');
  });

  it("tidak menampilkan paragraf dengan teks yang salah", () => {
    checkTextPresence("Bekerja sama dengan NASA", 'shouldNot');
  });

  it("menampilkan gambar 'PantauTular_tentang_kami'", () => {
    checkAltTextPresence("PantauTular_tentang_kami", 'should');
  });

  it("tidak menampilkan gambar dengan alt text yang salah", () => {
    checkAltTextPresence("Tentang Kami PantauTular", 'shouldNot');
  });

  it("menampilkan bagian 'Kami memahami pentingnya'", () => {
    checkTextPresence("Kami memahami pentingnya", 'should');
  });

  it("tidak menampilkan teks yang tidak relevan", () => {
    checkTextPresence("Kami tidak peduli dengan ini", 'shouldNot');
  });

  it("menampilkan bagian 'Latar Belakang'", () => {
    checkTextPresence("Latar Belakang", 'should');
  });

  it("tidak menampilkan teks yang salah pada bagian latar belakang", () => {
    checkTextPresence("Sejarah Kami", 'shouldNot');
  });

  it("menampilkan gambar 'PantauTular_latarbelakang'", () => {
    checkAltTextPresence("PantauTular_latar_belakang", 'should');
  });

  it("tidak menampilkan gambar yang tidak relevan", () => {
    checkAltTextPresence("PantauTular_sejarah", 'shouldNot');
  });

  it("menampilkan bagian 'Dengan demikian'", () => {
    checkTextPresence("Dengan demikian,", 'should');
  });

  it("tidak menampilkan elemen dengan teks yang salah", () => {
    checkTextPresence("Tentang Fasilkom UI", 'shouldNot');
    checkTextPresence("Pusat Informasi Medis", 'shouldNot');
  });
});
