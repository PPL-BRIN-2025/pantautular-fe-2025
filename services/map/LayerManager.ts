import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import { ProvinceData } from "../../types";
import { useMapStore } from "../../store/store";

/**
 * Manages map layers like base, highlight, points, and thematic layers
 */
export class LayerManager {
  private root: am5.Root;
  private chart: am5map.MapChart;
  private basePolygonSeries: am5map.MapPolygonSeries | null = null;
  private highlightSeries: am5map.MapPolygonSeries | null = null;
  private pointSeries: am5map.ClusteredPointSeries | null = null;
  private locationSeries: am5map.MapPointSeries | null = null;

  // Thematic layers
  private precipitationSeries: am5map.MapPolygonSeries | null = null;
  private humiditySeries: am5map.MapPolygonSeries | null = null;
  private temperatureSeries: am5map.MapPolygonSeries | null = null;
  private severitySeries: am5map.MapPolygonSeries | null = null;

  // Heat legends
  private precipitationHeatLegend: am5.Container | null = null;
  private humidityHeatLegend: am5.Container | null = null;
  private temperatureHeatLegend: am5.Container | null = null;
  private severityHeatLegend: am5.Container | null = null;

  // Data storage
  private provinceHumidityData: ProvinceData[] | null = null;
  private provinceTemperatureData: ProvinceData[] | null = null;
  private provincePrecipitationData: ProvinceData[] | null = null;
  private provinceSeverityData: ProvinceData[] | null = null;

  constructor(root: am5.Root, chart: am5map.MapChart) {
    this.root = root;
    this.chart = chart;
  }

  // Getters
  getBasePolygonSeries(): am5map.MapPolygonSeries | null {
    return this.basePolygonSeries;
  }

  getHighlightSeries(): am5map.MapPolygonSeries | null {
    return this.highlightSeries;
  }

  getPointSeries(): am5map.ClusteredPointSeries | null {
    return this.pointSeries;
  }

  getLocationSeries(): am5map.MapPointSeries | null {
    return this.locationSeries;
  }

  getPrecipitationSeries(): am5map.MapPolygonSeries | null {
    return this.precipitationSeries;
  }

  getHumiditySeries(): am5map.MapPolygonSeries | null {
    return this.humiditySeries;
  }

  getTemperatureSeries(): am5map.MapPolygonSeries | null {
    return this.temperatureSeries;
  }

  getSeveritySeries(): am5map.MapPolygonSeries | null {
    return this.severitySeries;
  }

  // Setters
  setBasePolygonSeries(series: am5map.MapPolygonSeries): void {
    this.basePolygonSeries = series;
  }

  setHighlightSeries(series: am5map.MapPolygonSeries): void {
    this.highlightSeries = series;
  }

  setPointSeries(series: am5map.ClusteredPointSeries): void {
    this.pointSeries = series;
  }

  setLocationSeries(series: am5map.MapPointSeries): void {
    this.locationSeries = series;
  }

  setPrecipitationSeries(series: am5map.MapPolygonSeries, legend: am5.Container): void {
    this.precipitationSeries = series;
    this.precipitationHeatLegend = legend;
  }

  setHumiditySeries(series: am5map.MapPolygonSeries, legend: am5.Container): void {
    this.humiditySeries = series;
    this.humidityHeatLegend = legend;
  }

  setTemperatureSeries(series: am5map.MapPolygonSeries, legend: am5.Container): void {
    this.temperatureSeries = series;
    this.temperatureHeatLegend = legend;
  }

  setSeveritySeries(series: am5map.MapPolygonSeries, legend: am5.Container): void {
    this.severitySeries = series;
    this.severityHeatLegend = legend;
  }

  // Layer visibility controls
  showBaseLayer(): void {
    if (this.basePolygonSeries) {
      this.basePolygonSeries.show();
    }
  }

  hideBaseLayer(): void {
    if (this.basePolygonSeries) {
      this.basePolygonSeries.hide();
    }
  }

  showHighlightLayer(): void {
    if (this.highlightSeries) {
      this.highlightSeries.show();
    }
  }
  
  hideHighlightLayer(): void {
    if (this.highlightSeries) {
      this.highlightSeries.hide();
    }
  }
  
  showPointLayer(): void {
    if (this.pointSeries) {
      this.pointSeries.show();
    }
  }
  
  hidePointLayer(): void {
    if (this.pointSeries) {
      this.pointSeries.hide();
    }
  }

  // Thematic layer visibility
  showHumidityLayer(): void {
    if (this.humiditySeries && this.humidityHeatLegend && this.root && this.chart) {
      this.humiditySeries.show();
      this.humidityHeatLegend.show();
      this.chart.markDirty();

      
      if (this.humidityHeatLegend.parent) {
        this.humidityHeatLegend.toFront();
      }
    }
  }
  
  hideHumidityLayer(): void {
    if (this.humiditySeries && this.humidityHeatLegend && this.root && this.chart) {
      this.humiditySeries.hide();
      this.humidityHeatLegend.hide();
      this.chart.markDirty();


    }
  }
    
  showPrecipitationLayer(): void {
    if (this.precipitationSeries && this.precipitationHeatLegend && this.root && this.chart) {
      this.precipitationSeries.show();
      this.precipitationHeatLegend.show();
      this.chart.markDirty();

      
      if (this.precipitationHeatLegend.parent) {
        this.precipitationHeatLegend.toFront();
      }
    }
  }
  
  hidePrecipitationLayer(): void {
    if (this.precipitationSeries && this.precipitationHeatLegend && this.root && this.chart) {
      this.precipitationSeries.hide();
      this.precipitationHeatLegend.hide();
      this.chart.markDirty();

    }
  }

  showTemperatureLayer(): void {
    if (this.temperatureSeries && this.temperatureHeatLegend && this.root && this.chart) {
      this.temperatureSeries.show();
      this.temperatureHeatLegend.show();
      this.chart.markDirty();

      
      if (this.temperatureHeatLegend.parent) {
        this.temperatureHeatLegend.toFront();
      }
    }
  }
  
  hideTemperatureLayer(): void {
    if (this.temperatureSeries && this.temperatureHeatLegend && this.root && this.chart) {
      this.temperatureSeries.hide();
      this.temperatureHeatLegend.hide();
      this.chart.markDirty();

    }
  }

  showSeverityLayer(): void {
    if (this.severitySeries && this.severityHeatLegend && this.root && this.chart) {
      this.severitySeries.show();
      this.severityHeatLegend.show();
      this.chart.markDirty();

      if (this.severityHeatLegend.parent) {
        this.severityHeatLegend.toFront();
      }
    }
  }
  
  hideSeverityLayer(): void {
    if (this.severitySeries && this.severityHeatLegend && this.root && this.chart) {
      this.severitySeries.hide();
      this.severityHeatLegend.hide();
      this.chart.markDirty();

    }
  }

  // Convenience method to toggle all layers at once
  toggleLayers(showBase: boolean, showHighlight: boolean, showPoints: boolean, 
               showPrecipitation: boolean, showHumidity: boolean, 
               showTemperature: boolean, showSeverity: boolean): void {
    showBase ? this.showBaseLayer() : this.hideBaseLayer();
    showHighlight ? this.showHighlightLayer() : this.hideHighlightLayer();
    showPoints ? this.showPointLayer() : this.hidePointLayer();
    
    if (showHumidity) {
      this.hidePrecipitationLayer();
      this.hideTemperatureLayer();
      this.hideSeverityLayer();
      this.showHumidityLayer(); 
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"));
    } 
    if (showTemperature) {
      this.hidePrecipitationLayer();
      this.hideHumidityLayer();
      this.hideSeverityLayer();
      this.showTemperatureLayer();
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"));
    } 
    if (showSeverity) { 
      this.hidePrecipitationLayer();
      this.hideHumidityLayer();
      this.hideTemperatureLayer();
      this.showSeverityLayer();
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"));
    } 
    if (showPrecipitation) {
      this.hideHumidityLayer();
      this.hideTemperatureLayer();
      this.hideSeverityLayer();
      this.showPrecipitationLayer();
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"));
    } 
    if (!showHumidity && !showTemperature && !showSeverity && !showPrecipitation) {
      this.hideHumidityLayer();
      this.hideTemperatureLayer();
      this.hideSeverityLayer();
      this.hidePrecipitationLayer();
      this.chart.get("background")?.set("fill", am5.color("#E0E0E0"));
    }
    console.log("showPrecipitation", showPrecipitation);
    console.log("showHumidity", showHumidity);
    console.log("showTemperature", showTemperature);
    console.log("showSeverity", showSeverity);
  }

  // Data update methods
  populateProvinceHumidityData(provinceHumidityData: ProvinceData[]): void {
    if (!this.humiditySeries) return;
    this.provinceHumidityData = provinceHumidityData;
    this.humiditySeries.data.clear();

    provinceHumidityData.forEach(data => {
      this.humiditySeries!.data.push({
        id: data.id,
        value: data.value
      });
    });
  }

  populateProvincePrecipitationData(provincePrecipitationData: ProvinceData[]): void {
    if (!this.precipitationSeries) return;
    this.provincePrecipitationData = provincePrecipitationData;
    this.precipitationSeries.data.clear();

    provincePrecipitationData.forEach(data => {
      const pattern = this.classifyPrecipitationPattern(data.value);
      this.precipitationSeries!.data.push({
        id: data.id,
        value: pattern
      });
    });
  }

  populateProvinceTemperatureData(provinceTemperatureData: ProvinceData[]): void {
    if (!this.temperatureSeries) return;
    this.provinceTemperatureData = provinceTemperatureData;
    this.temperatureSeries.data.clear();
    
    provinceTemperatureData.forEach(data => {
      this.temperatureSeries!.data.push({
        id: data.id,
        value: data.value
      });
    });
  }

  populateProvinceSeverityData(provinceSeverityData: ProvinceData[]): void {
    if (!this.severitySeries) return;
    this.provinceSeverityData = provinceSeverityData;
    this.severitySeries.data.clear();

    provinceSeverityData.forEach(data => {
      this.severitySeries!.data.push({
        id: data.id,
        value: data.status
      });
    });
  }

  private classifyPrecipitationPattern(precipitationValue: string | number): string {
    const value = typeof precipitationValue === 'string' ? parseFloat(precipitationValue) : precipitationValue;
    
    if (value < 100) {
      return "Lokal";
    } else if (value >= 100 && value < 200) {
      return "Multipattern";
    } else if (value >= 200 && value < 300) {
      return "Monsoon";
    } else if (value >= 300 && value < 400) {
      return "Equatorial";
    } else {
      return "Lainnya";
    }
  }
} 