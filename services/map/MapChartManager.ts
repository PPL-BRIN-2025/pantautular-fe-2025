import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { MapConfig, MapLocation } from "../../types";
import { useMapStore } from "../../store/store";
import { LayerManager } from "./LayerManager";
import { LegendBuilder } from "./LegendBuilder";
import { SeriesFactory } from "./SeriesFactory";

/**
 * Manages the map chart including initialization, zoom control, and selection
 */
export class MapChartManager {
  private root: am5.Root | null = null;
  private chart: am5map.MapChart | null = null;
  private layerManager: LayerManager | null = null;
  private legendBuilder: LegendBuilder | null = null;
  private seriesFactory: SeriesFactory | null = null;
  private locations: MapLocation[] | null = null;
  private _countSelectedPoints: number = 0;
  private readonly onError: ((message: string) => void) | null = null;

  constructor(onError?: (message: string) => void) {
    this.onError = onError || null;
  }

  /**
   * Initialize the map chart
   */
  initialize(containerId: string, config: MapConfig): void {
    try {
      const container = document.getElementById(containerId);
      if (!container) throw new Error(`Container with ID "${containerId}" not found.`);

      // Create root and chart
      this.root = am5.Root.new(containerId);
      this.root.setThemes([am5themes_Animated.new(this.root)]);
      
      this.chart = this.root.container.children.push(
        am5map.MapChart.new(this.root, {
          panX: "rotateX",
          panY: "translateY",
          homeZoomLevel: config.zoomLevel,
          projection: am5map.geoMercator(),
          homeGeoPoint: config.centerPoint,
          minZoomLevel: config.zoomLevel,
          maxZoomLevel: 100,
        })
      );

      // Set background color
      this.chart.set("background", am5.Rectangle.new(this.root, {
        fill: am5.color("#E0E0E0"), 
        fillOpacity: 1,
      }));

      // Initialize managers
      this.initializeManagers();

      // Setup map controls
      this.setupZoomControl();
      this.setupLayers();

      // Make chart appear with animation
      this.chart.appear(1000, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
      if (this.onError) this.onError("Failed to load the map. Please try again.");
    }
  }

  /**
   * Initialize the managers and builders
   */
  private initializeManagers(): void {
    if (!this.chart || !this.root) return;
    
    this.layerManager = new LayerManager(this.root, this.chart);
    this.legendBuilder = new LegendBuilder(this.root, this.chart);
    this.seriesFactory = new SeriesFactory(this.root, this.chart);
  }

  /**
   * Setup zoom control for the map
   */
  private setupZoomControl(): void {
    if (!this.chart || !this.root) return;
    
    const zoomControl = this.chart.set("zoomControl", am5map.ZoomControl.new(this.root, {}));
    zoomControl.homeButton.set("visible", true);
    
    // Add event listeners for selection updates
    this.chart.on('zoomLevel', this.getPointsInSelection.bind(this));
    this.chart.on('translateX', this.getPointsInSelection.bind(this));
    this.chart.on('translateY', this.getPointsInSelection.bind(this));
  }

  /**
   * Setup all map layers
   */
  private setupLayers(): void {
    if (!this.seriesFactory || !this.legendBuilder || !this.layerManager || !this.chart) return;

    try {
      // Create base and highlight layers
      const basePolygonSeries = this.seriesFactory.createBasePolygonSeries();
      const highlightSeries = this.seriesFactory.createHighlightSeries();
      
      // Register home button event
      basePolygonSeries.events.on("datavalidated", () => {
        this.chart?.goHome();
      });

      // Create thematic layers with their legends
      const humiditySeries = this.seriesFactory.createHumiditySeries();
      const humidityLegend = this.legendBuilder.createHumidityLegend();
      
      const precipitationSeries = this.seriesFactory.createPrecipitationSeries();
      const precipitationLegend = this.legendBuilder.createPrecipitationLegend();
      
      const temperatureSeries = this.seriesFactory.createTemperatureSeries();
      const temperatureLegend = this.legendBuilder.createTemperatureLegend();
      
      const severitySeries = this.seriesFactory.createSeveritySeries();
      const severityLegend = this.legendBuilder.createSeverityLegend();
      
      // Create point series
      const pointSeries = this.seriesFactory.createPointSeries();

      // Save all created series to the layer manager
      this.layerManager.setBasePolygonSeries(basePolygonSeries);
      this.layerManager.setHighlightSeries(highlightSeries);
      this.layerManager.setPointSeries(pointSeries);
      this.layerManager.setHumiditySeries(humiditySeries, humidityLegend);
      this.layerManager.setPrecipitationSeries(precipitationSeries, precipitationLegend);
      this.layerManager.setTemperatureSeries(temperatureSeries, temperatureLegend);
      this.layerManager.setSeveritySeries(severitySeries, severityLegend);
    } catch (error) {
      console.error("Error setting up layers:", error);
      if (this.onError) this.onError("Error setting up map layers.");
    }
  }

  /**
   * Get number of points currently in the visible map area
   */
  private getPointsInSelection(): void {
    if (!this.chart) return;
    
    const tl = this.chart?.invert({ x: 0, y: 0 });
    const br = this.chart?.invert({ x: this.chart.innerWidth(), y: this.chart.innerHeight() });

    // Check if tl or br is undefined and handle the case
    if (!tl || !br) {
      console.error('Failed to get points in selection: tl or br is undefined');
      return;
    }

    // Adjust longitude boundaries for edge cases
    if (tl.longitude > br.longitude) {
      tl.longitude = -180;
      br.longitude = 180;
    }

    const selectedPoints: string[] = [];

    this.locations?.forEach((dataItem) => {
      const longitude = dataItem.location__longitude;
      const latitude = dataItem.location__latitude;

      if (
        longitude >= tl.longitude &&
        longitude <= br.longitude &&
        latitude <= tl.latitude &&
        latitude >= br.latitude
      ) {
        selectedPoints.push(dataItem.id);
      }
    });

    // Update the count
    this.countSelectedPoints = selectedPoints.length;
  }

  /**
   * Get the count of selected points
   */
  get countSelectedPoints(): number {
    return this._countSelectedPoints;
  }

  /**
   * Set the count of selected points and update the store
   */
  private set countSelectedPoints(value: number) {
    this._countSelectedPoints = value;
    // Update Zustand store
    useMapStore.getState().setCountSelectedPoints(value);
  }

  /**
   * Populate map with location points
   */
  populateLocations(locations: MapLocation[]): void {
    if (!this.layerManager) return;
    
    const pointSeries = this.layerManager.getPointSeries();
    if (!pointSeries) return;
    
    this.locations = locations;
    
    // Clear existing data first
    pointSeries.data.clear();
    
    // Add new locations
    locations.forEach(location => {
      pointSeries.data.push({
        geometry: { 
          type: "Point", 
          coordinates: [
            parseFloat(location.location__longitude),
            parseFloat(location.location__latitude),
          ] 
        },
        city: location.city,
        id: location.id,
        province: location.location__province,
      });
    });

    // Update point count
    this.getPointsInSelection();
  }

  /**
   * Zoom to a specific location
   */
  zoomToLocation(latitude: number, longitude: number): void {
    if (!this.chart || !this.root || !this.seriesFactory || !this.layerManager) return;
    
    // Create location marker if needed
    if (!this.layerManager.getLocationSeries()) {
      const locationSeries = this.seriesFactory.createLocationSeries();
      this.layerManager.setLocationSeries(locationSeries);
    }
    
    const locationSeries = this.layerManager.getLocationSeries();
    if (!locationSeries) return;
    
    try {
      // Clear previous location marker
      locationSeries.data.clear();
      
      // Add new location marker
      locationSeries.data.push({
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        title: "Your Location"
      });

      // Zoom to the location
      this.chart.zoomToGeoPoint({ longitude, latitude }, 32, true);
    } catch (error) {
      console.error("Failed to zoom to location: ", error);
      throw error;
    }
  }

  /**
   * Dispose of the chart to prevent memory leaks
   */
  dispose(): void {
    if (this.root) {
      this.root.dispose();
      this.root = null;
      this.chart = null;
      this.layerManager = null;
      this.legendBuilder = null;
      this.seriesFactory = null;
    }
  }

  // Data update methods forwarded to LayerManager
  populateProvinceHumidityData(data: any[]): void {
    this.layerManager?.populateProvinceHumidityData(data);
  }

  populateProvinceTemperatureData(data: any[]): void {
    this.layerManager?.populateProvinceTemperatureData(data);
  }

  populateProvincePrecipitationData(data: any[]): void {
    this.layerManager?.populateProvincePrecipitationData(data);
  }

  populateProvinceSeverityData(data: any[]): void {
    this.layerManager?.populateProvinceSeverityData(data);
  }

  // Layer visibility controls forwarded to LayerManager
  toggleLayers(showBase: boolean, showHighlight: boolean, showPoints: boolean, 
               showPrecipitation: boolean, showHumidity: boolean, 
               showTemperature: boolean, showSeverity: boolean): void {
    this.layerManager?.toggleLayers(
      showBase, showHighlight, showPoints, 
      showPrecipitation, showHumidity, 
      showTemperature, showSeverity
    );
  }
} 