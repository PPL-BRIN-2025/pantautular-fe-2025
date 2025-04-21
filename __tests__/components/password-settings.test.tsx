import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordSettings from '../../app/components/password-settings';

jest.mock('../../app/components/ui-profile/button', () => ({
  Button: ({ children, className, onClick }: any) => (
    <button className={className} onClick={onClick} data-testid="button">
      {children}
    </button>
  ),
}));

jest.mock('../../app/components/ui-profile/input', () => ({
  Input: ({ id, type, placeholder, className }: any) => (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      className={className}
      data-testid={`input-${id}`}
    />
  ),
}));

describe('PasswordSettings Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    render(<PasswordSettings onClose={mockOnClose} />);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders password settings modal with title', () => {
    // Gunakan getByRole dengan name untuk memastikan hanya mengambil heading
    const heading = screen.getByRole('heading', { name: 'Ubah Kata Sandi' });
    expect(heading).toBeInTheDocument();
  });

  it('displays all password requirements', () => {
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 8 karakter')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 huruf kapital')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 huruf kecil')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 angka')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi harus terdiri dari setidaknya 1 simbol khusus')).toBeInTheDocument();
  });

  it('renders password form fields', () => {
    expect(screen.getByTestId('input-current-password')).toBeInTheDocument();
    expect(screen.getByTestId('input-new-password')).toBeInTheDocument();
    expect(screen.getByTestId('input-confirm-password')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    // Find the close button (X button)
    const closeButton = screen.getByRole('button', { name: '' });
    
    // Click the button
    fireEvent.click(closeButton);
    
    // Check if the onClose callback was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});