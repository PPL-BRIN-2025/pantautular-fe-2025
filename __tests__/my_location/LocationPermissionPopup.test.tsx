import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LocationPermissionPopup from "../../app/components/LocationPermissionPopup";
import { LocationService } from "../../services/LocationService";

// Mock LocationService to control behavior in tests
jest.mock("../../services/LocationService", () => ({
  LocationService: {
    checkPermission: jest.fn(),
    requestLocation: jest.fn(),
  },
}));

describe("LocationPermissionPopup", () => {
  let mockOnAllow: jest.Mock;
  let mockOnDeny: jest.Mock;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    mockOnAllow = jest.fn();
    mockOnDeny = jest.fn();
    mockOnClose = jest.fn();

    // Reset mocks before each test
    jest.clearAllMocks();

    // Default mock implementation for checkPermission
    (LocationService.checkPermission as jest.Mock).mockResolvedValue({ 
      state: "prompt" 
    });

    // Default mock implementation for requestLocation
    (LocationService.requestLocation as jest.Mock).mockImplementation(
      (onSuccess, onError) => {
        onSuccess();
      }
    );
  });

  test("Menampilkan popup izin lokasi saat pertama kali dirender dengan open=true", async () => {
    render(<LocationPermissionPopup open={true} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />);
    
    expect(await screen.findByText("Izin Lokasi Diperlukan")).toBeInTheDocument();
  });

  // Test to cover line 40 - test with open=false to ensure setShowPopup(false) is called
  test("Tidak menampilkan popup saat prop open=false", async () => {
    render(<LocationPermissionPopup open={false} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />);
    
    // Popup should not be rendered
    await waitFor(() => {
      expect(screen.queryByText("Izin Lokasi Diperlukan")).not.toBeInTheDocument();
    });
    
    // onAllow and onClose should not be called when open=false
    expect(mockOnAllow).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Test when open prop changes from true to false (to cover all branches)
  test("Menutup popup saat prop open berubah dari true ke false", async () => {
    const { rerender } = render(
      <LocationPermissionPopup open={true} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />
    );
    
    // Verify popup is initially shown
    expect(await screen.findByText("Izin Lokasi Diperlukan")).toBeInTheDocument();
    
    // Change open prop to false
    rerender(
      <LocationPermissionPopup open={false} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />
    );
    
    // Verify popup is closed
    await waitFor(() => {
      expect(screen.queryByText("Izin Lokasi Diperlukan")).not.toBeInTheDocument();
    });
  });

  test("Klik tombol 'Lanjutkan' memanggil onAllow jika izin diberikan", async () => {
    render(<LocationPermissionPopup open={true} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />);
  
    // Pastikan tombol "Lanjutkan" tersedia sebelum klik
    const allowButton = await screen.findByText("Lanjutkan");
    fireEvent.click(allowButton);
  
    await waitFor(() => {
      expect(mockOnAllow).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test("Klik tombol 'Lanjutkan' tidak memanggil onDeny", async () => {
    render(<LocationPermissionPopup open={true} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />);
  
    // Pastikan tombol "Lanjutkan" tersedia sebelum klik
    const allowButton = await screen.findByText("Lanjutkan");
    fireEvent.click(allowButton);
  
    expect(mockOnDeny).not.toHaveBeenCalled();
  });

  test("Klik tombol 'Batal' tidak memanggil onAllow", async () => {
    render(<LocationPermissionPopup open={true} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />);

    // Pastikan tombol "Batal" tersedia sebelum klik
    const denyButton = await screen.findByText("Batal");
    fireEvent.click(denyButton);

    expect(mockOnAllow).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled(); // Should call onClose
  });
  
  test("Jika pengguna memblokir lokasi, panggil onDeny", async () => {
    // Mock the requestLocation method to call onError instead
    (LocationService.requestLocation as jest.Mock).mockImplementation(
      (onSuccess, onError) => {
        onError();
      }
    );
  
    render(<LocationPermissionPopup open={true} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />);
  
    // Pastikan tombol "Lanjutkan" muncul sebelum mengklik
    const allowButton = await screen.findByText("Lanjutkan");
    fireEvent.click(allowButton);
  
    // Verify all callbacks are called correctly
    await waitFor(() => {
      expect(mockOnDeny).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnAllow).not.toHaveBeenCalled();
    });
  });  

  test("Popup tidak ditampilkan jika izin sudah granted", async () => {
    // Set permission to already granted
    (LocationService.checkPermission as jest.Mock).mockResolvedValue({ 
      state: "granted" 
    });

    render(<LocationPermissionPopup open={true} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockOnAllow).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    expect(screen.queryByText("Izin Lokasi Diperlukan")).not.toBeInTheDocument();
  });

  test("Popup muncul jika izin belum diberikan (prompt)", async () => {
    (LocationService.checkPermission as jest.Mock).mockResolvedValue({
      state: "prompt",
    });

    render(<LocationPermissionPopup open={true} onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />);

    expect(await screen.findByText("Izin Lokasi Diperlukan")).toBeInTheDocument();
  });

  // Test with undefined open prop to cover another branch
  test("Handle undefined open prop", async () => {
    render(<LocationPermissionPopup onAllow={mockOnAllow} onDeny={mockOnDeny} onClose={mockOnClose} />);
    
    // Popup should not be rendered
    await waitFor(() => {
      expect(screen.queryByText("Izin Lokasi Diperlukan")).not.toBeInTheDocument();
    });
    
    // LocationService.checkPermission should not be called
    expect(LocationService.checkPermission).not.toHaveBeenCalled();
  });
});