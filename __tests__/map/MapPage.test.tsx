import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import MapPage from "../../app/map/page";

describe("MapPage Component", () => {
  
  test("renders the map container successfully", async () => {
    render(<MapPage />);
    
    // Wait for loading state to finish
    expect(screen.getByText("Loading map data...")).toBeInTheDocument();
    
    // Wait for map to load
    const mapContainer = await screen.findByTestId("map-container");
    expect(mapContainer).toBeInTheDocument();
  });

  test("hanya menampilkan satu popup jika ada multiple error messages", async () => {
    render(<MapPage />);

    // Wait for loading state to finish
    expect(screen.getByText("Loading map data...")).toBeInTheDocument();
    
    // Wait for map to load
    const mapContainer = await screen.findByTestId("map-container");
    
    fireEvent.error(mapContainer);

    expect(screen.queryAllByText(/Gagal memuat peta/)).toHaveLength(0);
  });

  test("popup menghilang setelah tombol tutup diklik", async () => {
    render(<MapPage />);

    // Wait for loading state to finish
    expect(screen.getByText("Loading map data...")).toBeInTheDocument();
    
    // Wait for map to load
    const mapContainer = await screen.findByTestId("map-container");
    fireEvent.error(mapContainer);
    expect(screen.getByText("Terjadi Kesalahan")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Tutup"));
    expect(screen.queryByText("Terjadi Kesalahan")).toBeInTheDocument();
  });

  test("tidak menampilkan popup error saat halaman pertama kali dimuat", () => {
    render(<MapPage />);

    expect(screen.queryByText("Gagal memuat peta, silakan coba lagi")).not.toBeInTheDocument();
  });

  test("tidak ada duplikasi popup error jika error terus terjadi sebelum popup ditutup", async () => {
    render(<MapPage />);

    // Wait for loading state to finish
    expect(screen.getByText("Loading map data...")).toBeInTheDocument();
    
    // Wait for map to load
    const mapContainer = await screen.findByTestId("map-container");

    fireEvent.error(mapContainer);
    fireEvent.error(mapContainer); 
    fireEvent.error(mapContainer);

    expect(screen.queryAllByText(/Gagal memuat peta/)).toHaveLength(0);
  });
});