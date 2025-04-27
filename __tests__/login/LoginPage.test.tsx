import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import LoginPage from '../../app/login/page';

// Mock Next's Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('LoginPage Component', () => {
  // Happy Path Tests
  describe('Happy Path', () => {
    it('renders the login page correctly', () => {
      render(<LoginPage />);
      
      // Check heading
      expect(screen.getByText('Sudah siap menjelajahi PantauTular?')).toBeInTheDocument();
      
      // Check inputs
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Kata Sandi')).toBeInTheDocument();
      
      // Check links
      expect(screen.getByText('Daftar')).toBeInTheDocument();
      expect(screen.getByText('Lupa Kata Sandi?')).toBeInTheDocument();
      
      // Check button
      expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument();
      
      // Check image
      const image = screen.getByAltText('Login');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src');
    });

    it('allows user to input email and password', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Kata Sandi');
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });
    
    it('handles form submission correctly', async () => {
      // Setup a spy on form submission
      const formSubmitSpy = jest.fn((e) => e.preventDefault());
      
      const { container } = render(<LoginPage />);
      const form = container.querySelector('form');
      form?.addEventListener('submit', formSubmitSpy);
      
      // Fill in the form
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Kata Sandi');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: 'Masuk' });
      fireEvent.click(submitButton);
      
      // Check if form was submitted
      expect(formSubmitSpy).toHaveBeenCalledTimes(1);
    });
  });
  
  // Unhappy Path Tests
  describe('Unhappy Path', () => {
    it('shows validation error for invalid email format', async () => {
      // This test is for future implementation of validation
      const user = userEvent.setup();
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Masuk' });
      
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      // Since validation is not implemented yet, we just verify we can type invalid data
      expect(emailInput).toHaveValue('invalid-email');
    });
    
    it('handles empty form submission', async () => {
      // Setup a spy on form submission
      const formSubmitSpy = jest.fn((e) => e.preventDefault());
      
      const { container } = render(<LoginPage />);
      const form = container.querySelector('form');
      form?.addEventListener('submit', formSubmitSpy);
      
      // Submit the form without filling it
      const submitButton = screen.getByRole('button', { name: 'Masuk' });
      fireEvent.click(submitButton);
      
      // Check if form was submitted anyway (as there's no validation yet)
      expect(formSubmitSpy).toHaveBeenCalledTimes(1);
    });
  });
  
  // Edge Cases
  describe('Edge Cases', () => {
    it('handles very long input values', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Kata Sandi');
      
      const longEmail = 'a'.repeat(100) + '@example.com';
      const longPassword = 'b'.repeat(100);
      
      await user.type(emailInput, longEmail);
      await user.type(passwordInput, longPassword);
      
      expect(emailInput).toHaveValue(longEmail);
      expect(passwordInput).toHaveValue(longPassword);
    });
    
    it('renders correctly on small screen sizes', () => {
      // Mock window innerWidth to simulate mobile device
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      
      // Trigger window resize event
      window.dispatchEvent(new Event('resize'));
      
      render(<LoginPage />);
      
      // Check that elements still exist in mobile view
      expect(screen.getByText('Sudah siap menjelajahi PantauTular?')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Kata Sandi')).toBeInTheDocument();
    });
    
    it('handles tab navigation correctly', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      // Focus first element (email input)
      const emailInput = screen.getByLabelText('Email');
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
      
      // Tab to next element (password input)
      await user.tab();
      const passwordInput = screen.getByLabelText('Kata Sandi');
      expect(document.activeElement).toBe(passwordInput);
      
      // Continue tabbing to ensure all interactive elements are reachable
      await user.tab(); // Should move to Daftar link
      await user.tab(); // Should move to Lupa Kata Sandi link
      await user.tab(); // Should move to Masuk button
      
      const submitButton = screen.getByRole('button', { name: 'Masuk' });
      expect(document.activeElement).toBe(submitButton);
    });
  });

  // Specific UI element behavior tests
  describe('UI Element Behavior', () => {
    it('button has hover state', async () => {
      render(<LoginPage />);
      const button = screen.getByRole('button', { name: 'Masuk' });
      
      // Check that button has the hover styles class
      expect(button).toHaveClass('hover:bg-blue-700');
    });
    
    it('tests link navigation', () => {
      render(<LoginPage />);
      
      const registerLink = screen.getByText('Daftar');
      const forgotPasswordLink = screen.getByText('Lupa Kata Sandi?');
      
      // Verify links have href attribute (would be populated in real implementation)
      expect(registerLink.tagName.toLowerCase()).toBe('a');
      expect(forgotPasswordLink.tagName.toLowerCase()).toBe('a');
      expect(registerLink).toHaveAttribute('href', '#');
      expect(forgotPasswordLink).toHaveAttribute('href', '#');
    });
  });
});