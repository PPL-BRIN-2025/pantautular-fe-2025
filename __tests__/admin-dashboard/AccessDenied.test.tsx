import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import AccessDenied from '../../app/admin-dashboard/_components/AccessDenied';

describe('Admin Dashboard - AccessDenied', () => {
  it('renders with default message when no detail provided', () => {
    render(<AccessDenied />);
    
    expect(screen.getByText('Informasi Akses')).toBeInTheDocument();
    expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    expect(screen.getByText(/Anda tidak memiliki izin untuk mengakses halaman ini/)).toBeInTheDocument();
  });

  it('renders with custom detail message when provided', () => {
    const customMessage = 'Permission Required: Admin Only';
    render(<AccessDenied detail={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<AccessDenied />);
    
    const backLink = screen.getByRole('link', { name: 'Kembali' });
    expect(backLink).toBeInTheDocument();
    expect(backLink.getAttribute('href')).toBe('/');
    
    const loginLink = screen.getByRole('link', { name: 'Login' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login?next=/admin-dashboard');
  });

  it('has proper accessibility attributes', () => {
    render(<AccessDenied />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement.getAttribute('aria-live')).toBe('polite');
  });
});