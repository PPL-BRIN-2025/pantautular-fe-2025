import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AreaMap from '../../../app/components/dashboard/area_map/AreaMap';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img 
      src={props.src} 
      alt={props.alt} 
      style={props.style}
      onError={props.onError}
      data-testid="map-image"
    />
  },
}));

describe('AreaMap Component', () => {
  beforeEach(async () => {
    render(<AreaMap />);
    // Wait for loading to complete in each test
    await waitFor(() => {
      expect(screen.queryByText('Loading map...')).not.toBeInTheDocument();
    });
  });
  
  it('should display the component after loading', () => {
    expect(screen.getByText('Pemetaan Kondisi Wilayah')).toBeInTheDocument();
  });

  it('should display the first area by default', () => {
    expect(screen.getByText('Peta Geografis Ketinggian Wilayah')).toBeInTheDocument();
  });

  it('should display the correct area info', () => {
    expect(screen.getByText('Peta Geografis Ketinggian Wilayah')).toBeInTheDocument();
    expect(screen.getByText('Last updated: 10 Mei 2025 00.25 WIB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unduh informasi/i })).toBeInTheDocument();
  });

  it('should navigate to the next area when next button is clicked', () => {
    fireEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText('Peta Geografis Curah Hujan')).toBeInTheDocument();
  });

  it('should navigate to the previous area when prev button is clicked', () => {
    // Navigate to second area
    fireEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText('Peta Geografis Curah Hujan')).toBeInTheDocument();

    // Go back to first area
    fireEvent.click(screen.getByLabelText('Previous'));
    expect(screen.getByText('Peta Geografis Ketinggian Wilayah')).toBeInTheDocument();
  });

  // Edge case tests
  it('should cycle to the first area when navigating next from the last area', () => {
    // Navigate to last area (4th item)
    fireEvent.click(screen.getByLabelText('Next'));
    fireEvent.click(screen.getByLabelText('Next'));
    fireEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText('Peta Kepadatan Penduduk (orang per Km persegi)')).toBeInTheDocument();

    // Should cycle back to first area
    fireEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText('Peta Geografis Ketinggian Wilayah')).toBeInTheDocument();
  });

  it('should cycle to the last area when navigating previous from the first area', () => {
    // From first area, navigate to last area using previous
    fireEvent.click(screen.getByLabelText('Previous'));
    expect(screen.getByText('Peta Kepadatan Penduduk (orang per Km persegi)')).toBeInTheDocument();
  });

  it('should handle multiple rapid clicks correctly', () => {
    // Multiple rapid next clicks
    fireEvent.click(screen.getByLabelText('Next'));
    fireEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText('Peta Kerentanan Penyakit Menular')).toBeInTheDocument();

    // Multiple rapid previous clicks
    fireEvent.click(screen.getByLabelText('Previous'));
    fireEvent.click(screen.getByLabelText('Previous'));
    expect(screen.getByText('Peta Geografis Ketinggian Wilayah')).toBeInTheDocument();
  });

  // Unhappy path tests
  it('should handle image load error', () => {
    const image = screen.getByTestId('map-image');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Simulate error on image
    fireEvent.error(image);
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Image failed to load');
    
    consoleSpy.mockRestore();
  });
});
