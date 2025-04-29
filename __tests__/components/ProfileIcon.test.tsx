import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock komponen dropdown-menu
jest.mock('../../app/components/ui-profile/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children, className }: any) => (
    <button data-testid="dropdown-trigger" className={className}>
      {children}
    </button>
  ),
  DropdownMenuContent: ({ children, className }: any) => (
    <div data-testid="dropdown-content" className={className}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <button data-testid="dropdown-item" onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

// Mock komponen password-settings
jest.mock('../../app/components/password-settings', () => ({
  __esModule: true,
  default: jest.fn(({ onClose }) => (
    <div data-testid="password-settings">
      <button data-testid="close-settings" onClick={onClose}>Close</button>
    </div>
  ))
}));

// Import Navbar yang berisi ProfileIcon
import Navbar from '../../app/components/Navbar';
// Jika ProfileIcon adalah komponen terpisah, import langsung:
// import { ProfileIcon } from '../../app/components/ProfileIcon';

// Mock komponen lucide-react User icon
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/')
}));

// Mock next/image dan next/link
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  )
}));

describe('ProfileIcon Component', () => {
  it('renders user icon button', () => {
    // Render navbar yang berisi ProfileIcon
    render(<Navbar />);
    
    // Jika kamu punya komponen ProfileIcon terpisah:
    // render(<ProfileIcon />);
    
    const iconButton = screen.getByTestId('dropdown-trigger');
    expect(iconButton).toBeInTheDocument();
  });

  it('shows password settings when settings option is clicked', () => {
    // Render navbar yang berisi ProfileIcon
    render(<Navbar />);
    
    // Cari semua dropdown item dan klik yang berisi teks "Pengaturan"
    // Karena kita sudah mock dropdown item sebagai button dengan data-testid="dropdown-item"
    const allItems = screen.getAllByTestId('dropdown-item');
    
    // Cari item yang melakukan operasi pengaturan
    // Bisa jadi kita tidak bisa mencarinya berdasarkan teks persis
    const settingsItem = allItems[0]; // Biasanya item pertama adalah "Pengaturan"
    fireEvent.click(settingsItem);
    
    // Password settings seharusnya muncul
    expect(screen.getByTestId('password-settings')).toBeInTheDocument();
    
    // Klik tombol close untuk menutup settings
    fireEvent.click(screen.getByTestId('close-settings'));
    
    // Password settings seharusnya hilang
    expect(screen.queryByTestId('password-settings')).not.toBeInTheDocument();
  });
});