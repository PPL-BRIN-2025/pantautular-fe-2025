import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_indonesiaLow from "@amcharts/amcharts5-geodata/indonesiaLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { MapLocation, MapConfig } from "../types";
import { getTooltip } from "../utils/tooltipUtils";
import { useMapStore } from "../store/store";

export class MapChartService {
  private root: am5.Root | null = null;
  private chart: am5map.MapChart | null = null;
  private pointSeries: am5map.ClusteredPointSeries | null = null;
  private locationSeries: am5map.MapPointSeries | null = null;
  private basePolygonSeries: am5map.MapPolygonSeries | null = null;
  private highlightSeries: am5map.MapPolygonSeries | null = null;
  private humiditySeries: am5map.MapPolygonSeries | null = null;
  private humidityHeatLegend: am5.HeatLegend | null = null;
  private readonly onError: ((message: string) => void) | null = null;
  private locations: MapLocation[] | null = null;
  private _countSelectedPoints: number = 0;

  constructor(onError?: (message: string) => void) {
    this.onError = onError || null;
  }

  initialize(containerId: string, config: MapConfig): void {
    try {
      const container = document.getElementById(containerId);
      if (!container) throw new Error(`Container with ID "${containerId}" not found.`);

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

      this.setupZoomControl();
      this.setupPolygonSeries();
      this.setupPointSeries();
      this.chart.appear(1000, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
      if (this.onError) this.onError("Failed to load the map. Please try again.");
    }
  }
  
  private setupZoomControl(): void {
    if (!this.chart || !this.root) return;
    const root = this.root;
    const zoomControl = this.chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    zoomControl.homeButton.set("visible", true);
    this.chart.on('zoomLevel', this.getPointsInSelection.bind(this));
    this.chart.on('translateX', this.getPointsInSelection.bind(this));
    this.chart.on('translateY', this.getPointsInSelection.bind(this));
  }
  get countSelectedPoints(): number {
    return this._countSelectedPoints;
  }

  // Private setter for countSelectedPoints
  private set countSelectedPoints(value: number) {
    this._countSelectedPoints = value;
    // Update Zustand store
    useMapStore.getState().setCountSelectedPoints(value); // Update global state
  }

  // Your method that updates the count of selected points
  private getPointsInSelection(): void {
    console.log('Runnnnn');
    const tl = this.chart?.invert({ x: 0, y: 0 });
    const br = this.chart?.invert({ x: this.chart.innerWidth(), y: this.chart.innerHeight() });

    // Check if tl or br is undefined and handle the case
    /* istanbul ignore next */
    if (!tl || !br) {
      console.error('Failed to get points in selection: tl or br is undefined');
      return;
    }

    // Now safely use tl and br since they are guaranteed to be defined
    /* istanbul ignore next */
    if (tl.longitude > br.longitude) {
      tl.longitude = -180;
      br.longitude = 180;
    }

    /* istanbul ignore next */
    const selectedPoints: string[] = [];

    /* istanbul ignore next */
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

    /* istanbul ignore next */
    // Set the countSelectedPoints using the private setter
    this.countSelectedPoints = selectedPoints.length;
    console.log(this._countSelectedPoints);
  }

  private setupPolygonSeries(): void {
    if (!this.chart || !this.root) return;
    try {
      const root = this.root;
      
      // Base layer - Indonesia map
      this.basePolygonSeries = this.chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_indonesiaLow,
          exclude: ["AQ"],
        })
      );

      this.basePolygonSeries.mapPolygons.template.setAll({
          fill: am5.color("#FFFFFF"), 
          stroke: am5.color("#CCCCCC"), 
          strokeWidth: 0.5,
      });

      // Add colored province layer
      this.humiditySeries = this.chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_indonesiaLow,
          valueField: "value",
          calculateAggregates: true,
          // exclude: ["AQ"],   
        })
      );

      // Set up the colored province layer
      this.humiditySeries.mapPolygons.template.setAll({
        fill: am5.color("#FFFFFF"),
        stroke: am5.color("#CCCCCC"),
        strokeWidth: 0.5,
        fillOpacity: 0.8,
      });

      this.humiditySeries.set("heatRules", [{
        target: this.humiditySeries.mapPolygons.template,
        dataField: "value",
        customFunction: function(sprite: am5.Sprite, min, max, value) {
          if (value <= 100) {
            (sprite as am5.Graphics).set("fill", am5.color("#FFFFFF"));
          } else if (value <= 200) {
            (sprite as am5.Graphics).set("fill", am5.color("#A5D6A7"));
          } else if (value <= 300) {
            (sprite as am5.Graphics).set("fill", am5.color("#4CAF50"));
          } else if (value <= 400) {
            (sprite as am5.Graphics).set("fill", am5.color("#2196F3"));
          } else if (value <= 500) {
            (sprite as am5.Graphics).set("fill", am5.color("#3F51B5"));
          } else if (value <= 600) {
            (sprite as am5.Graphics).set("fill", am5.color("#9C27B0"));
          } else if (value <= 700) {
            (sprite as am5.Graphics).set("fill", am5.color("#E91E63"));
          } else if (value <= 800) {
            (sprite as am5.Graphics).set("fill", am5.color("#F44336"));
          } else {
            (sprite as am5.Graphics).set("fill", am5.color("#E03444"));
          }
        }
      }]);

      this.humiditySeries.data.setAll([
        { id: "ID-AC", value: 417 },
        { id: "ID-BA", value: 156 },
        { id: "ID-BB", value: 141 },
        { id: "ID-BE", value: 343 },
        { id: "ID-BT", value: 225 },
        { id: "ID-GO", value: 364 },
        { id: "ID-JA", value: 910 },
        { id: "ID-JB", value: 588 },
        { id: "ID-JI", value: 721 },
        { id: "ID-JK", value: 399 },
        { id: "ID-JT", value: 522 },
        { id: "ID-KB", value: 843 },
        { id: "ID-KI", value: 294 },
        { id: "ID-KR", value: 515 },
        { id: "ID-KS", value: 238 },
        { id: "ID-KT", value: 291 },
        { id: "ID-KU", value: 136 },
        { id: "ID-LA", value: 211 },
        { id: "ID-MA", value: 525 },
        { id: "ID-MU", value: 421 },
        { id: "ID-NB", value: 358 },
        { id: "ID-NT", value: 427 },
        { id: "ID-PA", value: 294 },
        { id: "ID-PB", value: 799 },
        { id: "ID-RI", value: 98 },
        { id: "ID-SA", value: 801 },
        { id: "ID-SB", value: 311 },
        { id: "ID-SG", value: 194 },
        { id: "ID-SN", value: 436 },
        { id: "ID-SR", value: 757 },
        { id: "ID-SS", value: 28 },
        { id: "ID-ST", value: 501 },
        { id: "ID-SU", value: 442 },
        { id: "ID-YO", value: 357 }
      ])

      this.humidityHeatLegend = this.chart.children.push(am5.HeatLegend.new(root, {
        orientation: "horizontal",
        startColor: am5.color("#FFFFFF"),
        endColor: am5.color("#E03444"),
        startText: "Lowest",
        endText: "Highest",
        stepCount: 9,
        maxWidth: 1000,
        paddingTop: 800,
        paddingLeft: 600,
        paddingRight: -200
      }));
      
      /* istanbul ignore next */
      this.humidityHeatLegend.startLabel.setAll({
        fontSize: 12,
        fill: this.humidityHeatLegend.get("startColor")
      });
      
      /* istanbul ignore next */
      this.humidityHeatLegend.endLabel.setAll({
        fontSize: 12,
        fill: this.humidityHeatLegend.get("endColor")
      });
      
      /* istanbul ignore next */
      // Initially hide the humidity layer
      this.humiditySeries.hide();
      this.humidityHeatLegend.hide()

      // Add a second layer for highlighting
      this.highlightSeries = this.chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_indonesiaLow,
          exclude: ["AQ"],
        })
      );

      this.highlightSeries.mapPolygons.template.setAll({
          fill: am5.color("#E0E0E0"),
          fillOpacity: 0.3,
          stroke: am5.color("#999999"),
          strokeWidth: 1,
      });

      // Add hover effect using the helper function
      /* istanbul ignore next */
      this.basePolygonSeries.mapPolygons.template.events.on("pointerover", (ev) => {
        this.handlePolygonEvent(ev, "#FF0000");
      });

      /* istanbul ignore next */
      this.basePolygonSeries.mapPolygons.template.events.on("pointerout", (ev) => {
        this.handlePolygonEvent(ev, "#E0E0E0");
      });

      /* istanbul ignore next */
      this.chart.set("background", am5.Rectangle.new(this.root, {
          fill: am5.color("#E0E0E0"), 
          fillOpacity: 1,
      }));

      /* istanbul ignore next */
      this.basePolygonSeries.events.on("datavalidated", () => {
        this.chart?.goHome();
      });
    } catch (error) {
      console.error("Error setting up polygon series:", error);
      if (this.onError) this.onError("Error setting up map polygons.");
    }
  }

  /* istanbul ignore next */
  private handlePolygonEvent(ev: any, fillColor: string): void {
    const polygon = ev.target;
    if (polygon && this.highlightSeries?.mapPolygons) {
      const index = this.basePolygonSeries?.mapPolygons.indexOf(polygon);
      if (index !== undefined) {
        const highlightPolygon = this.highlightSeries.mapPolygons.getIndex(index);
        if (highlightPolygon) {
          highlightPolygon.set("fill", am5.color(fillColor));
        }
      }
    }
  }

  private setupPointSeries(): void {
    if (!this.chart || !this.root) return;
    try {
      const root = this.root;
      this.pointSeries = this.chart.series.push(
        am5map.ClusteredPointSeries.new(root, {
          groupIdField: "province",
          scatterDistance: 20
          
        })
      );

      this.setupClusterBullet();
      this.setupRegularBullet();
    } catch (error) {
      console.error("Error setting up point series:", error);
      /* istanbul ignore next */
      if (this.onError) this.onError("Error setting up map points.");
    }
  }

  private setupClusterBullet(): void {
    if (!this.pointSeries || !this.root) return;
    try {
      const root = this.root;
      /* istanbul ignore next */
      this.pointSeries.set("clusteredBullet", (root: am5.Root) => {
        const container = am5.Container.new(root, {
          cursorOverStyle: "pointer",
        });

        container.children.push(
          am5.Circle.new(root, { radius: 8, tooltipY: 0, fill: am5.color("#fc0339") })
        );

        container.children.push(
          am5.Circle.new(root, { radius: 12, fillOpacity: 0.3, tooltipY: 0, fill: am5.color("#fc0339") })
        );

        container.children.push(
          am5.Circle.new(root, { radius: 16, fillOpacity: 0.3, tooltipY: 0, fill: am5.color("#fc0339") })
        );

        container.children.push(
          am5.Label.new(root, {
            centerX: am5.p50,
            centerY: am5.p50,
            fill: am5.color(0xffffff),
            populateText: true,
            fontSize: "8",
            text: "{value}",
          })
        );

        container.events.on("click", (e) => {
          if (e.target.dataItem) {
            this.pointSeries?.zoomToCluster(e.target.dataItem as am5.DataItem<any>);
          }
        });

        return am5.Bullet.new(root, {
          sprite: container,
        });
      });
    } catch (error) {
      console.error("Error setting up cluster bullet:", error);
      if (this.onError) this.onError("Error setting up cluster bullet.");
    }
  }

  private setupRegularBullet(): void {
    if (!this.pointSeries || !this.root) return;
  
    // First, set up the tooltip configuration
    const tooltip = am5.Tooltip.new(this.root, {
      getFillFromSprite: false,
      background: am5.Rectangle.new(this.root, {
        fill: am5.color(0xffffff),
        fillOpacity: 0,
      }),
      labelText: "",
      autoTextColor: false,
      interactive: true,
    });

    this.pointSeries.bullets.push((root, series, dataItem) => {
      const circle = am5.Circle.new(root, {
        radius: 6,
        tooltipY: 0,
        fill: am5.color("#fc0339"),
        cursorOverStyle: "pointer",
      });
  
      /* istanbul ignore next */
      circle.events.on("pointerover", async (ev) => {
        if (dataItem?.dataContext) {
          try {
            const dataContext = dataItem.dataContext as { id: string };
            if (dataContext.id) {
              const tooltipHtml = await getTooltip({ id: dataContext.id });
              tooltip.set("html", tooltipHtml);
              
              // Set up click handler for close button
              const closeHandler = (e: Event) => {
                const target = e.target as HTMLElement;
                const closeButton = target.closest('[data-tooltip-close]');
                if (closeButton) {
                  e.preventDefault();
                  e.stopPropagation();
                  tooltip.hide();
                }
              };

              // Remove any existing event listeners
              document.removeEventListener('click', closeHandler);
              
              // Add event listener after a small delay to ensure the tooltip is rendered
              setTimeout(() => {
                document.addEventListener('click', closeHandler);
              }, 100);

              tooltip.show();
            }
          } catch (error) {
            console.error('Error showing tooltip:', error);
          }
        }
      });

      return am5.Bullet.new(root, { sprite: circle });
    });
  
    // Set the tooltip for the series
    this.pointSeries.set("tooltip", tooltip);
  }
  
  populateLocations(locations: MapLocation[]): void {
    if (!this.pointSeries) return;
    this.locations = locations
    
    // Clear existing data first
    this.pointSeries.data.clear();
    
    // Add new locations
    locations.forEach(location => {
      this.pointSeries!.data.push({
        geometry: { 
          type: "Point", 
          coordinates: [
            location.location__longitude, 
            location.location__latitude,
          ] 
        },
        city: location.city,
        id: location.id,
        province: location.location__province,
      });
    });
    console.log(locations)
  }

  createLocationMarker(): void {
    /* istanbul ignore next */
    if (!this.chart || !this.root) return;
    
    // Non-null assertion is safe after the check above
    const root = this.root!;
    
    this.locationSeries = this.chart.series.push(
      am5map.MapPointSeries.new(root, {})
    );

    /* istanbul ignore next */
    this.locationSeries.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 8,
          fill: am5.color("#2196F3"),
          strokeWidth: 2,
          stroke: am5.color("#FFFFFF"),
        }),
      })
    );

    /* istanbul ignore next */
    this.locationSeries.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 12,
          fill: am5.color("#2196F3"),
          fillOpacity: 0.3,
        }),
      })
    );
  }

  zoomToLocation(latitude: number, longitude: number): void {
    /* istanbul ignore next */
    if (!this.chart || !this.root) return;
    
    // Create location marker series if it doesn't exist yet
    if (!this.locationSeries) {
      this.createLocationMarker();
    }
    
    try {
      // Clear previous location marker if any
      this.locationSeries!.data.clear();
      
      // Add new location marker
      this.locationSeries!.data.push({
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        title: "Your Location"
      });

      // Zoom to the location
      this.chart.zoomToGeoPoint({ longitude, latitude }, 32, true);
      /* istanbul ignore next */
    } catch (error) {
      /* istanbul ignore next */
      console.error("Failed to zoom to location: ", error);
      /* istanbul ignore next */
      throw error;
    }
  }

  dispose(): void {
    if (this.root) {
      this.root.dispose();
      this.root = null;
      this.chart = null;
      this.pointSeries = null;
    }
  }

  // Add methods to control layer visibility
  /* istanbul ignore next */
  public showBaseLayer(): void {
    if (this.basePolygonSeries) {
      this.basePolygonSeries.show();
    }
  }

  /* istanbul ignore next */
  public hideBaseLayer(): void {
    if (this.basePolygonSeries) {
      this.basePolygonSeries.hide();
    }
  }

  /* istanbul ignore next */
  public showHighlightLayer(): void {
    if (this.highlightSeries) {
      this.highlightSeries.show();
    }
  }
  
  /* istanbul ignore next */
  public hideHighlightLayer(): void {
    if (this.highlightSeries) {
      this.highlightSeries.hide();
    }
  }
  
  /* istanbul ignore next */
  public showPointLayer(): void {
    if (this.pointSeries) {
      this.pointSeries.show();
    }
  }
  
  /* istanbul ignore next */
  public hidePointLayer(): void {
    if (this.pointSeries) {
      this.pointSeries.hide();
    }
  }

  // Add methods to control province layer visibility
    
  /* istanbul ignore next */
  public showHumidityLayer(): void {
    if (this.humiditySeries && this.humidityHeatLegend) {
      this.humiditySeries.show();
      this.humidityHeatLegend.show();
    }
  }
  
  /* istanbul ignore next */
  public hideHumidityLayer(): void {
    if (this.humiditySeries && this.humidityHeatLegend) {
      this.humiditySeries.hide();
      this.humidityHeatLegend.hide();
    }
  }

  // Update the toggleLayers method to include province layer
    
  /* istanbul ignore next */
  public toggleLayers(showBase: boolean, showHighlight: boolean, showPoints: boolean, showHumidity: boolean): void {
    if (showBase) {
      this.showBaseLayer();
    } else {
      this.hideBaseLayer();
    }

    if (showHighlight) {
      this.showHighlightLayer();
    } else {
      this.hideHighlightLayer();
    }

    if (showPoints) {
      this.showPointLayer();
    } else {
      this.hidePointLayer();
    }

    if (showHumidity) {
      this.showHumidityLayer();
    } else {
      this.hideHumidityLayer();
    }
  }
}