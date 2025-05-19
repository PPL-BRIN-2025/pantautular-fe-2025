import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationErrorPopup from "../../app/components/LocationErrorPopup";
import { LocationErrorType } from '@/services/LocationService';

describe('LocationErrorPopup Component', () => {
  const mockOnOpenChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should use default props if not given", () => {
    render(<LocationErrorPopup onOpenChange={jest.fn()} />);
    expect(screen.queryByTestId("location-error-popup")).not.toBeInTheDocument();
  });

  test('should not render when open is false', () => {
    render(
      <LocationErrorPopup 
        open={false} 
        onOpenChange={mockOnOpenChange} 
        errorType="UNKNOWN" 
      />
    );
    
    const popup = screen.queryByTestId('location-error-popup');
    expect(popup).not.toBeInTheDocument();
  });

  test('should render default error message when open is true', () => {
    render(
      <LocationErrorPopup 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        errorType="UNKNOWN" 
      />
    );
    
    const popup = screen.getByTestId('location-error-popup');
    expect(popup).toBeInTheDocument();
    
    const title = screen.getByText('Lokasi Tidak Ditemukan');
    expect(title).toBeInTheDocument();
    
    const description = screen.getByText('Kami tidak dapat menentukan lokasi Anda saat ini.');
    expect(description).toBeInTheDocument();
    
    // Check that default reasons are shown
    const reasonsList = screen.getByText('Ini mungkin terjadi karena:').nextElementSibling;
    expect(reasonsList).toHaveTextContent('Sinyal GPS perangkat Anda lemah atau terhalang');
  });

  test('should close when close button is clicked', () => {
    render(
      <LocationErrorPopup 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        errorType="UNKNOWN" 
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /tutup/i });
    fireEvent.click(closeButton);
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  // Test each error type to ensure correct messages are displayed
  const errorTypes: LocationErrorType[] = [
    "BROWSER_UNSUPPORTED",
    "PERMISSION_DENIED",
    "POSITION_UNAVAILABLE",
    "TIMEOUT"
  ];

  errorTypes.forEach(errorType => {
    test(`should display correct content for ${errorType} error type`, () => {
      render(
        <LocationErrorPopup 
          open={true} 
          onOpenChange={mockOnOpenChange} 
          errorType={errorType} 
        />
      );
      
      // Expected titles for each error type
      const expectedTitles = {
        "BROWSER_UNSUPPORTED": "Browser Tidak Mendukung",
        "PERMISSION_DENIED": "Akses Lokasi Ditolak",
        "POSITION_UNAVAILABLE": "Lokasi Tidak Tersedia",
        "TIMEOUT": "Waktu Permintaan Habis",
        "UNKNOWN": "Lokasi Tidak Ditemukan"
      };
      
      // Expected descriptions for each error type
      const expectedDescriptions = {
        "BROWSER_UNSUPPORTED": "Browser Anda tidak mendukung fitur geolokasi.",
        "PERMISSION_DENIED": "Anda telah menolak akses ke lokasi Anda.",
        "POSITION_UNAVAILABLE": "Sistem tidak dapat menentukan lokasi Anda saat ini.",
        "TIMEOUT": "Waktu untuk mendapatkan lokasi Anda telah habis.",
        "UNKNOWN": "Kami tidak dapat menentukan lokasi Anda saat ini."
      };
      
      // Check title and description
      const title = screen.getByText(expectedTitles[errorType]);
      expect(title).toBeInTheDocument();
      
      const description = screen.getByText(expectedDescriptions[errorType]);
      expect(description).toBeInTheDocument();
      
      // Check for relevant error-specific content in reasons
      const reasonsSection = screen.getByText('Ini mungkin terjadi karena:').nextElementSibling;
      
      // Specific text to check for each error type
      const expectedReasonContent = {
        "BROWSER_UNSUPPORTED": "Browser Anda mungkin sudah usang",
        "PERMISSION_DENIED": "Izin lokasi dinonaktifkan",
        "POSITION_UNAVAILABLE": "Sinyal GPS perangkat Anda lemah",
        "TIMEOUT": "Koneksi internet Anda lambat",
        "UNKNOWN": "Sinyal GPS perangkat Anda lemah atau terhalang"
      };
      
      expect(reasonsSection).toHaveTextContent(expectedReasonContent[errorType]);
    });
  });
});