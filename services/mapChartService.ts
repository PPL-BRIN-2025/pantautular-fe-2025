import { MapLocation, MapConfig, ProvinceData } from "../types";
import { MapChartManager } from "./map";

/**
 * Main MapChartService class - acts as a facade for the map chart subsystem
 * This version has been refactored for better maintainability using a more modular architecture
 */
export class MapChartService {
  private readonly mapManager: MapChartManager;

  constructor(onError?: (message: string) => void) {
    this.mapManager = new MapChartManager(onError);
  }

  /**
   * Initialize the map chart
   */
  initialize(containerId: string, config: MapConfig): void {
    this.mapManager.initialize(containerId, config);
  }

  /**
   * Clean up resources when component is unmounted
   */
  dispose(): void {
    this.mapManager.dispose();
  }

  /**
   * Populate map with location points
   */
  populateLocations(locations: MapLocation[]): void {
    this.mapManager.populateLocations(locations);
  }

  /**
   * Get the count of points currently in view
   */
  get countSelectedPoints(): number {
    return this.mapManager.countSelectedPoints;
  }

  /**
   * Zoom to a specific location on the map
   */
  zoomToLocation(latitude: number, longitude: number): void {
    this.mapManager.zoomToLocation(latitude, longitude);
  }

  /**
   * Populate humidity data for provinces
   */
  populateProvinceHumidityData(provinceHumidityData: ProvinceData[]): void {
    this.mapManager.populateProvinceHumidityData(provinceHumidityData);
  }

  /**
   * Populate precipitation data for provinces
   */
  populateProvincePrecipitationData(provincePrecipitationData: ProvinceData[]): void {
    this.mapManager.populateProvincePrecipitationData(provincePrecipitationData);
  }

  /**
   * Populate temperature data for provinces
   */
  populateProvinceTemperatureData(provinceTemperatureData: ProvinceData[]): void {
    this.mapManager.populateProvinceTemperatureData(provinceTemperatureData);
  }

  /**
   * Populate severity data for provinces
   */
  populateProvinceSeverityData(provinceSeverityData: ProvinceData[]): void {
    this.mapManager.populateProvinceSeverityData(provinceSeverityData);
  }

  /**
   * Show humidity layer on the map
   */
  showHumidityLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, true, false, false);
  }

  /**
   * Hide humidity layer on the map
   */
  hideHumidityLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }

  /** 
   * Show precipitation layer on the map
   */
  showPrecipitationLayer(): void {
    this.mapManager.toggleLayers(true, true, true, true, false, false, false);
  }

  /** 
   * Hide precipitation layer on the map
   */
  hidePrecipitationLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }
  
  /**
   * Show temperature layer on the map
   */
  showTemperatureLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, true, false);
  }

  /**
   * Hide temperature layer on the map
   */
  hideTemperatureLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }

  /**
   * Show severity layer on the map
   */
  showSeverityLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, true);
  }

  /**
   * Hide severity layer on the map
   */
  hideSeverityLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }

  /**
   * Hide all theme layers on the map
   */
  hideAllLayers(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }

  /**
   * Toggle the visibility of map layers
   */
  toggleLayers(
    showBase: boolean, 
    showHighlight: boolean, 
    showPoints: boolean, 
    showPrecipitation: boolean, 
    showHumidity: boolean, 
    showTemperature: boolean, 
    showSeverity: boolean
  ): void {
    this.mapManager.toggleLayers(
      showBase, 
      showHighlight, 
      showPoints, 
      showPrecipitation, 
      showHumidity, 
      showTemperature, 
      showSeverity
    );
  }
}