// __tests__/register/register.test.tsx
import { render, screen} from '@testing-library/react';
import RegisterPage from '@/app/register/page';
import '@testing-library/jest-dom';

describe('RegisterPage', () => {
  it('renders the register page correctly', () => {
    render(<RegisterPage />);
    
    // Test judul
    expect(screen.getByText('Mari bergabung dengan PantauTular!')).toBeInTheDocument();
    
    // Test form fields
    expect(screen.getByLabelText('Nama Depan')).toBeInTheDocument();
    expect(screen.getByLabelText('Nama Belakang')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Kata Sandi')).toBeInTheDocument();
    expect(screen.getByLabelText('Konfirmasi Kata Sandi')).toBeInTheDocument();
    
    // Test tombol daftar
    expect(screen.getByRole('button', { name: 'Daftar' })).toBeInTheDocument();
    
    // Test link login
    expect(screen.getByText('Sudah memiliki akun?')).toBeInTheDocument();
    expect(screen.getByText('Masuk')).toBeInTheDocument();
  });

});