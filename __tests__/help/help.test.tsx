import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BantuanPantauTular from '../../app/help/page';

jest.mock('../../app/components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar"></div>;
  };
});

jest.mock('../../app/components/help/GlossarySection', () => {
  return function MockGlossarySection(props: any) {
    return <div data-testid="glossary-section">{props.title}</div>;
  };
});

jest.mock('../../app/components/help/GlossaryItem', () => {
  return function MockGlossaryItem(props: any) {
    return <div data-testid="glossary-item">{props.title}</div>;
  };
});

jest.mock('../../app/auth/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

describe('BantuanPantauTular', () => {
    it('renders the title', () => {
      render(<BantuanPantauTular />);
      const titleElement = screen.getByText(/Bantuan PantauTular/i);
      expect(titleElement).toBeInTheDocument();
    });
  
    it('renders the description', () => {
      render(<BantuanPantauTular />);
      const descriptionElement = screen.getByText(/platform yang memungkinkan pengguna untuk melacak sebaran penyakit menular di wilayah Indonesia/i);
      expect(descriptionElement).toBeInTheDocument();
    });
  
    it('renders section titles', () => {
      render(<BantuanPantauTular />);
      const section1Title = screen.getByText(/1. Pencarian Berdasarkan Nama Penyakit/i);
      const section2Title = screen.getByText(/2. Pencarian Berdasarkan Lokasi/i);
      const section3Title = screen.getByText(/3. Pencarian Berdasarkan Sumber Berita/i);
      const section4Title = screen.getByText(/4. Pencarian Berdasarkan Tingkat Kewaspadaan/i);
      const section5Title = screen.getByText(/5. Pencarian Berdasarkan Tanggal Kejadian/i);
  
      expect(section1Title).toBeInTheDocument();
      expect(section2Title).toBeInTheDocument();
      expect(section3Title).toBeInTheDocument();
      expect(section4Title).toBeInTheDocument();
      expect(section5Title).toBeInTheDocument();
    });
  
    it('renders images', () => {
      render(<BantuanPantauTular />);
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('renders the final section', () => {
      render(<BantuanPantauTular />);
      const finalSection = screen.getByText(/Setelah melakukan pencarian/i);
      expect(finalSection).toBeInTheDocument();
    });

    it('should not have a section titled "6. Pencarian"', () => {
      render(<BantuanPantauTular />);
      const nonExistentSection = screen.queryByText(/6\. Pencarian/i);
      expect(nonExistentSection).not.toBeInTheDocument();
    });

    it('should not contain form elements', () => {
      render(<BantuanPantauTular />);
      const inputElements = screen.queryAllByRole('textbox');
      const buttonElements = screen.queryAllByRole('button');
      
      expect(inputElements.length).toBe(0);
      expect(buttonElements.length).toBe(0);
    });

    it('should not contain pagination elements', () => {
      render(<BantuanPantauTular />);
      const paginationElement = screen.queryByText(/halaman/i);
      const nextPageElement = screen.queryByText(/berikutnya/i);
      const prevPageElement = screen.queryByText(/sebelumnya/i);
      
      expect(paginationElement).not.toBeInTheDocument();
      expect(nextPageElement).not.toBeInTheDocument();
      expect(prevPageElement).not.toBeInTheDocument();
    });

    it('does not render glossary section when user is not logged in', () => {
      // Setup the mock to return no user (not logged in)
      const useAuthMock = require('../../app/auth/hooks/useAuth');
      useAuthMock.useAuth.mockReturnValue({ user: null });
      
      render(<BantuanPantauTular />);
      
      // Glossary heading should not be present
      const glossaryHeading = screen.queryByText('Glosarium PantauTular');
      expect(glossaryHeading).not.toBeInTheDocument();
      
      // No glossary sections should be rendered
      const glossarySections = screen.queryAllByTestId('glossary-section');
      expect(glossarySections.length).toBe(0);
    });

    it('renders glossary section when user is logged in', () => {
      // Setup the mock to return a logged-in user
      const useAuthMock = require('../../app/auth/hooks/useAuth');
      useAuthMock.useAuth.mockReturnValue({ user: { name: 'Test User' } });
      
      render(<BantuanPantauTular />);
      
      // Glossary heading should be present
      const glossaryHeading = screen.getByText('Glosarium PantauTular');
      expect(glossaryHeading).toBeInTheDocument();
      
      // Glossary sections should be rendered
      const glossarySections = screen.getAllByTestId('glossary-section');
      expect(glossarySections.length).toBeGreaterThan(0);
      
      // Check for specific glossary section titles
      expect(screen.getByText('Curah Hujan')).toBeInTheDocument();
      expect(screen.getByText('Mortalitas')).toBeInTheDocument();
      expect(screen.getByText('Prevalensi')).toBeInTheDocument();
      // Add more specific titles as needed
    });

    it('shows login prompt when user is not logged in', () => {
      // Setup the mock to return no user (not logged in)
      const useAuthMock = require('../../app/auth/hooks/useAuth');
      useAuthMock.useAuth.mockReturnValue({ user: null });
      
      render(<BantuanPantauTular />);
      
      // Should display the login prompt
      const loginPrompt = screen.getByText(/Ingin melihat Glosarium PantauTular?/i);
      expect(loginPrompt).toBeInTheDocument();
      
      // Should have a login link
      const loginLink = screen.getByText(/masuk/i);
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('does not show login prompt when user is logged in', () => {
      // Setup the mock to return a logged-in user
      const useAuthMock = require('../../app/auth/hooks/useAuth');
      useAuthMock.useAuth.mockReturnValue({ user: { name: 'Test User' } });
      
      render(<BantuanPantauTular />);
      
      // Login prompt should not be displayed
      const loginPrompt = screen.queryByText(/Ingin melihat Glosarium PantauTular?/i);
      expect(loginPrompt).not.toBeInTheDocument();
    });
});