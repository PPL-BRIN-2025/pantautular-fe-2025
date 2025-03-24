import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_indonesiaLow from "@amcharts/amcharts5-geodata/indonesiaLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { MapLocation, MapConfig } from "../types";
import { getTooltip } from "../utils/tooltipUtils";

export class MapChartService {
  private root: am5.Root | null = null;
  private chart: am5map.MapChart | null = null;
  private pointSeries: am5map.ClusteredPointSeries | null = null;
  private locationSeries: am5map.MapPointSeries | null = null;
  private readonly onError: ((message: string) => void) | null = null;

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
  }

  private setupPolygonSeries(): void {
    if (!this.chart || !this.root) return;
    try {
      const root = this.root;
      const polygonSeries = this.chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_indonesiaLow,
          exclude: ["AQ"],
        })
      );


      polygonSeries.mapPolygons.template.setAll({
          fill: am5.color("#FFFFFF"), 
          stroke: am5.color("#CCCCCC"), 
          strokeWidth: 0.5,
      });

      this.chart.set("background", am5.Rectangle.new(this.root, {
          fill: am5.color("#E0E0E0"), 
          fillOpacity: 1,
      }));

      /* istanbul ignore next */
      polygonSeries.events.on("datavalidated", () => {
        this.chart?.goHome();
      });
    } catch (error) {
      console.error("Error setting up polygon series:", error);
      if (this.onError) this.onError("Error setting up map polygons.");
    }
  }

  private setupPointSeries(): void {
    if (!this.chart || !this.root) return;
    try {
      const root = this.root;
      this.pointSeries = this.chart.series.push(
        am5map.ClusteredPointSeries.new(root, {
          groupIdField: "city",
          minDistance: 30,
          scatterDistance: 10,
          scatterRadius: 10,
          stopClusterZoom: 0.9,
        })
      );

      this.setupClusterBullet();
      this.setupRegularBullet();
    } catch (error) {
      console.error("Error setting up point series:", error);
      if (this.onError) this.onError("Error setting up map points.");
    }
  }

  private setupClusterBullet(): void {
    if (!this.pointSeries || !this.root) return;
    try {
      const root = this.root;
      this.pointSeries.set("clusteredBullet", (root: am5.Root) => {
        const container = am5.Container.new(root, {
          cursorOverStyle: "pointer",
        });

        container.children.push(
          am5.Circle.new(root, { radius: 8, tooltipY: 0, fill: am5.color(0xfc0339) })
        );

        container.children.push(
          am5.Circle.new(root, { radius: 12, fillOpacity: 0.3, tooltipY: 0, fill: am5.color(0xfc0339) })
        );

        container.children.push(
          am5.Circle.new(root, { radius: 16, fillOpacity: 0.3, tooltipY: 0, fill: am5.color(0xfc0339) })
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
        fillOpacity: 1,
      }),
      labelText: "",
      autoTextColor: false,
      interactive: true,
    });

    this.pointSeries.bullets.push((root, series, dataItem) => {
      const circle = am5.Circle.new(root, {
        radius: 6,
        tooltipY: 0,
        fill: am5.color(0xfc0339),
        cursorOverStyle: "pointer",
      });
  
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

              // Add event listener after a small delay to ensure the tooltip is rendered
              setTimeout(() => {
                document.addEventListener('click', closeHandler, { once: true });
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
    
    // Clear existing data first
    this.pointSeries.data.clear();
    
    // Add new locations
    locations.forEach(location => {
      this.pointSeries!.data.push({
        geometry: { 
          type: "Point", 
          coordinates: [
            parseFloat(location.location__longitude), 
            parseFloat(location.location__latitude),
          ] 
        },
        city: location.city,
        id: location.id,
      });
    });
  }

  createLocationMarker(): void {
    /* istanbul ignore next */
    if (!this.chart || !this.root) return;
    
    this.locationSeries = this.chart.series.push(
      am5map.MapPointSeries.new(this.root, {})
    );

    /* istanbul ignore next */
    this.locationSeries.bullets.push(() =>
      am5.Bullet.new(this.root, {
        sprite: am5.Circle.new(this.root, {
          radius: 8,
          fill: am5.color(0x2196F3),
          strokeWidth: 2,
          stroke: am5.color(0xFFFFFF),
        }),
      })
    );

    /* istanbul ignore next */
    this.locationSeries.bullets.push(() =>
      am5.Bullet.new(this.root, {
        sprite: am5.Circle.new(this.root, {
          radius: 12,
          fill: am5.color(0x2196F3),
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
    } catch (error) {
      console.error("Failed to zoom to location: ", error);
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
}