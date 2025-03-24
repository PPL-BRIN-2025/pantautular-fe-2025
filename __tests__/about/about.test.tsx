import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import About from "../../app/about/page";

// Mocking global CSS imports
jest.mock("../styles/globals.css", () => ({}));

describe("About Page", () => {
  beforeEach(() => {
    render(<About />);
  });

  const checkTextPresence = (text: string, shouldBePresent: boolean = true) => {
    if (shouldBePresent) {
      expect(screen.getByText(text)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  };

  const checkAltTextPresence = (altText: string, shouldBePresent: boolean = true) => {
    if (shouldBePresent) {
      expect(screen.getByAltText(altText)).toBeInTheDocument();
    } else {
      expect(screen.queryByAltText(altText)).not.toBeInTheDocument();
    }
  };

  it("menampilkan judul utama 'Tentang PantauTular'", () => {
    checkTextPresence("Tentang PantauTular");
  });

  it("tidak menampilkan teks yang salah pada judul utama", () => {
    checkTextPresence("Tentang Fasilkom UI", false);
  });

  it("menampilkan paragraf utama dengan BRIN", () => {
    checkTextPresence(/Bekerja sama dengan Badan Riset dan Inovasi Nasional/i);
  });

  it("tidak menampilkan paragraf dengan teks yang salah", () => {
    checkTextPresence("Bekerja sama dengan NASA", false);
  });

  it("menampilkan gambar 'PantauTular_tentang_kami'", () => {
    checkAltTextPresence("PantauTular_tentang_kami");
  });

  it("tidak menampilkan gambar dengan alt text yang salah", () => {
    checkAltTextPresence("Tentang Kami PantauTular", false);
  });

  it("menampilkan bagian 'Kami memahami pentingnya'", () => {
    checkTextPresence("Kami memahami pentingnya");
  });

  it("tidak menampilkan teks yang tidak relevan", () => {
    checkTextPresence("Kami tidak peduli dengan ini", false);
  });

  it("menampilkan bagian 'Latar Belakang'", () => {
    checkTextPresence("Latar Belakang");
  });

  it("tidak menampilkan teks yang salah pada bagian latar belakang", () => {
    checkTextPresence("Sejarah Kami", false);
  });

  it("menampilkan gambar 'PantauTular_latarbelakang'", () => {
    checkAltTextPresence("PantauTular_latar_belakang");
  });

  it("tidak menampilkan gambar yang tidak relevan", () => {
    checkAltTextPresence("PantauTular_sejarah", false);
  });

  it("menampilkan bagian 'Dengan demikian'", () => {
    checkTextPresence("Dengan demikian,");
  });

  it("tidak menampilkan elemen dengan teks yang salah", () => {
    checkTextPresence("Tentang Fasilkom UI", false);
    checkTextPresence("Pusat Informasi Medis", false);
  });
});
