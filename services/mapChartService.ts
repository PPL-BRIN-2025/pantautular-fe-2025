import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_indonesiaLow from "@amcharts/amcharts5-geodata/indonesiaLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { MapLocation, MapConfig, ProvinceData } from "../types";
import { getTooltip } from "../utils/tooltipUtils";
import { useMapStore } from "../store/store";

export class MapChartService {
  private root: am5.Root | null = null;
  private chart: am5map.MapChart | null = null;
  private pointSeries: am5map.ClusteredPointSeries | null = null;
  private locationSeries: am5map.MapPointSeries | null = null;
  private basePolygonSeries: am5map.MapPolygonSeries | null = null;
  private highlightSeries: am5map.MapPolygonSeries | null = null;
  private precipitationSeries: am5map.MapPolygonSeries | null = null;
  private precipitationHeatLegend: am5.Container | null = null;
  private humiditySeries: am5map.MapPolygonSeries | null = null;
  private humidityHeatLegend: am5.Container | null = null;
  private severitySeries: am5map.MapPolygonSeries | null = null;
  private severityHeatLegend: am5.Container | null = null;
  private readonly onError: ((message: string) => void) | null = null;
  private locations: MapLocation[] | null = null;
  private _countSelectedPoints: number = 0;
  private provinceHumidityData: ProvinceData[] | null  = null;
  private provinceTemperatureData: ProvinceData[] | null = null;
  private provincePrecipitationData: ProvinceData[] | null = null;
  private provinceSeverityData: ProvinceData[] | null = null;


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
      this.precipitationSeries = this.chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_indonesiaLow,
          valueField: "value",
          calculateAggregates: true,
          exclude: ["AQ"], 
        })
      );

      // Add colored province layer
      this.humiditySeries = this.chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_indonesiaLow,
          valueField: "value",
          calculateAggregates: true,
          exclude: ["AQ"], 
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
          if (value <= 0) {
            (sprite as am5.Graphics).set("fill", am5.color("#C41A0A"));
          } else if (value <= 10) {
            (sprite as am5.Graphics).set("fill", am5.color("#F4440B"));
          } else if (value <= 20) {
            (sprite as am5.Graphics).set("fill", am5.color("#F47A0B"));
          } else if (value <= 30) {
            (sprite as am5.Graphics).set("fill", am5.color("#F4B00B"));
          } else if (value <= 40) {
            (sprite as am5.Graphics).set("fill", am5.color("#F4E60B"));
          } else if (value <= 50) {
            (sprite as am5.Graphics).set("fill", am5.color("#D2EE3C"));
          } else if (value <= 60) {
            (sprite as am5.Graphics).set("fill", am5.color("#AFF474"));
          } else if (value <= 70) {
            (sprite as am5.Graphics).set("fill", am5.color("#A3D4FF"));
          } else if (value <= 80) {
            (sprite as am5.Graphics).set("fill", am5.color("#6DBCFF"));
          } else if (value <= 90) {
            (sprite as am5.Graphics).set("fill", am5.color("#1392FF"));
          } else {
            (sprite as am5.Graphics).set("fill", am5.color("#00528F"));
          }
        }
      }]);

      // Create custom legend - positioned at the bottom center
      let humidityLegend = this.chart.children.push(am5.Container.new(root, {
        width: am5.percent(80),
        height: 50,
        layout: root.horizontalLayout,
        position: "absolute",
        x: am5.percent(50),
        centerX: am5.percent(50),
        y: am5.percent(100),
        dy: -30,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5
      }));

      // Create a container for the labels and color blocks
      let humidityLabelsContainer = humidityLegend.children.push(am5.Container.new(root, {
        width: am5.percent(100),
        height: am5.percent(100),
        layout: root.horizontalLayout,
        centerY: am5.percent(50)
      }));

      // Create color blocks container
      let humidityBlocksContainer = humidityLabelsContainer.children.push(am5.Container.new(root, {
        width: am5.percent(60),
        height: 20,
        layout: root.horizontalLayout,
        marginLeft: 10,
        marginRight: 10,
        centerY: am5.percent(50)
      }));

      // Define the colors and value ranges for each block
      const humidityColorBlocks = [
        { color: "#C41A0A", range: "0%" },
        { color: "#F4440B", range: "10%" },
        { color: "#F47A0B", range: "20%" },
        { color: "#F4B00B", range: "30%" },
        { color: "#F4E60B", range: "40%" },
        { color: "#D2EE3C", range: "50%" },
        { color: "#AFF474", range: "60%" },
        { color: "#A3D4FF", range: "70%" },
        { color: "#6DBCFF", range: "80%" },
        { color: "#1392FF", range: "90%" },
        { color: "#00528F", range: "100%" }
      ];

      // Create a higher container for block styling
      humidityColorBlocks.forEach(block => {
        // Create a container for each block (to hold both rectangle and label)
        let humidityBlockContainer = humidityBlocksContainer.children.push(am5.Container.new(root, {
          width: am5.percent(100 / humidityColorBlocks.length),
          height: 25,
          layout: root.verticalLayout
        }));

        // Add the colored rectangle
        humidityBlockContainer.children.push(am5.Rectangle.new(root, {
          width: am5.percent(100),
          height: 20,
          fill: am5.color(block.color),
        }));

        // Add the label inside the colored rectangle
        humidityBlockContainer.children.push(am5.Label.new(root, {
          text: block.range,
          fontSize: 11.5,
          fontWeight: "500",
          fill: am5.color(0xFFFFFF),
          // textAlign: "center",
          centerX: am5.percent(-75),
          marginTop: -25,
        }));
      });

      // Store the legend for later use
      this.humidityHeatLegend = humidityLegend;
      
      /* istanbul ignore next */
      // Initially hide the humidity layer
      this.humiditySeries.hide();
      this.humidityHeatLegend.hide()

      // Set up the colored province layer
      this.precipitationSeries.mapPolygons.template.setAll({
        fill: am5.color("#FFFFFF"),
        stroke: am5.color("#CCCCCC"),
        strokeWidth: 0.5,
        fillOpacity: 0.8,
      });

      this.precipitationSeries.set("heatRules", [{
        target: this.precipitationSeries.mapPolygons.template,
        dataField: "value",
        customFunction: function(sprite: am5.Sprite, min, max, value) {
          if (value == "Lokal") {
            (sprite as am5.Graphics).set("fill", am5.color("#DC3545"));
          } else if (value == "Multipattern") {
            (sprite as am5.Graphics).set("fill", am5.color("#E35D6A"));
          } else if (value == "Monsoon") {
            (sprite as am5.Graphics).set("fill", am5.color("#FFC107"));
          } else if (value == "Equatorial") {
            (sprite as am5.Graphics).set("fill", am5.color("#3CB371"));
          } else if (value == "Lainnya") {
            (sprite as am5.Graphics).set("fill", am5.color("#B8B8B8"));
          }
        }
      }]);

      // Create custom legend - positioned at the bottom center
      let percipitationLegend = this.chart.children.push(am5.Container.new(root, {
        width: am5.percent(80),
        height: 50,
        layout: root.horizontalLayout,
        position: "absolute",
        x: am5.percent(50),
        centerX: am5.percent(50),
        y: am5.percent(100),
        dy: -30,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5
      }));

      // Create a container for the labels and color blocks
      let precipitationLabelsContainer = percipitationLegend.children.push(am5.Container.new(root, {
        width: am5.percent(100),
        height: am5.percent(100),
        layout: root.horizontalLayout,
        centerY: am5.percent(50)
      }));

      // Create color blocks container
      let precipitationBlocksContainer = precipitationLabelsContainer.children.push(am5.Container.new(root, {
        width: am5.percent(60),
        height: 20,
        layout: root.horizontalLayout,
        marginLeft: 10,
        marginRight: 10,
        centerY: am5.percent(50)
      }));

      // Define the colors and value ranges for each block
      const precipitationColorBlocks = [
        { color: "#DC3545", range: "Lokal" },
        { color: "#E35D6A", range: "Multipattern" },
        { color: "#FFC107", range: "Monsoon" },
        { color: "#3CB371", range: "Equatorial" },
        { color: "#B8B8B8", range: "Lainnya" },
      ];

      // Create a higher container for block styling
      precipitationColorBlocks.forEach(block => {
        // Create a container for each block (to hold both rectangle and label)
        let precipitationBlockContainer = precipitationBlocksContainer.children.push(am5.Container.new(root, {
          width: am5.percent(100 / precipitationColorBlocks.length),
          height: 25,
          layout: root.verticalLayout
        }));

        // Add the colored rectangle
        precipitationBlockContainer.children.push(am5.Rectangle.new(root, {
          width: am5.percent(100),
          height: 20,
          fill: am5.color(block.color),
        }));

        // Add the label inside the colored rectangle
        precipitationBlockContainer.children.push(am5.Label.new(root, {
          text: block.range,
          fontSize: 11.5,
          fontWeight: "500",
          fill: am5.color(0xFFFFFF),
          // textAlign: "center",
          centerX: am5.percent(-100),
          marginTop: -25,
        }));
      });

      // Store the legend for later use
      this.precipitationHeatLegend = percipitationLegend;
      
      /* istanbul ignore next */
      // Initially hide the precipitation layer
      this.precipitationSeries.hide();
      this.precipitationHeatLegend.hide()

      // Add colored province layer
      this.severitySeries = this.chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_indonesiaLow,
          valueField: "value",
          calculateAggregates: true,
          exclude: ["AQ"], 
        })
      );

      // Set up the colored province layer
      this.severitySeries.mapPolygons.template.setAll({
        fill: am5.color("#FFFFFF"),
        stroke: am5.color("#CCCCCC"),
        strokeWidth: 0.5,
        fillOpacity: 0.8,
      });

      this.severitySeries.set("heatRules", [{
        target: this.severitySeries.mapPolygons.template,
        dataField: "value",
        customFunction: function(sprite: am5.Sprite, min, max, value) {
          if (value == "katastropik") {
            (sprite as am5.Graphics).set("fill", am5.color("#DC3545"));
          } else if (value == "bahaya") {
            (sprite as am5.Graphics).set("fill", am5.color("#FD7E14"));
          } else if (value == "biasa") {
            (sprite as am5.Graphics).set("fill", am5.color("#FFC107"));
          } else if (value == "minimal") {
            (sprite as am5.Graphics).set("fill", am5.color("#CACBCB"));
          } 
        }
      }]);

      // Create custom legend - positioned at the bottom center
      let severityLegend = this.chart.children.push(am5.Container.new(root, {
        width: am5.percent(80),
        height: 50,
        layout: root.horizontalLayout,
        position: "absolute",
        x: am5.percent(50),
        centerX: am5.percent(50),
        y: am5.percent(100),
        dy: -30,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5
      }));

      // Create a container for the labels and color blocks
      let severityLabelsContainer = severityLegend.children.push(am5.Container.new(root, {
        width: am5.percent(100),
        height: am5.percent(100),
        layout: root.horizontalLayout,
        centerY: am5.percent(50)
      }));

      // Create color blocks container
      let severityBlocksContainer = severityLabelsContainer.children.push(am5.Container.new(root, {
        width: am5.percent(60),
        height: 20,
        layout: root.horizontalLayout,
        marginLeft: 10,
        marginRight: 10,
        centerY: am5.percent(50)
      }));

      // Define the colors and value ranges for each block
      const severityColorBlocks = [
        { color: "#DC3545", range: "Katastropik" },
        { color: "#FD7E14", range: "Bahaya" },
        { color: "#FFC107", range: "Biasa" },
        { color: "#CACBCB", range: "Minimal" },
      ];

      // Create a higher container for block styling
      severityColorBlocks.forEach(block => {
        // Create a container for each block (to hold both rectangle and label)
        let severityBlockContainer = severityBlocksContainer.children.push(am5.Container.new(root, {
          width: am5.percent(100 / severityColorBlocks.length),
          height: 25,
          layout: root.verticalLayout
        }));

        // Add the colored rectangle
        severityBlockContainer.children.push(am5.Rectangle.new(root, {
          width: am5.percent(100),
          height: 20,
          fill: am5.color(block.color),
        }));

        // Add the label inside the colored rectangle
        severityBlockContainer.children.push(am5.Label.new(root, {
          text: block.range,
          fontSize: 11.5,
          fontWeight: "500",
          fill: am5.color(0xFFFFFF),
          // textAlign: "center",
          centerX: am5.percent(-100),
          marginTop: -25,
        }));
      });

      // Store the legend for later use
      this.severityHeatLegend = severityLegend;
      
      /* istanbul ignore next */
      // Initially hide the severity layer
      this.severitySeries.hide();
      this.severityHeatLegend.hide()

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
      const self = this; // Store reference to this
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
            console.log("CLICKED");
            try {
              console.log("Attempting to zoom to cluster with dataItem:", e.target.dataItem);
              // Check if zoomToCluster method exists
              if (self.pointSeries && typeof self.pointSeries.zoomToCluster === 'function') {
                // Pass true as second parameter to center the cluster
                self.pointSeries.zoomToCluster(e.target.dataItem as am5.DataItem<any>);
                console.log("Successfully called zoomToCluster with center parameter");
              } else {
                console.error("zoomToCluster method is not available on pointSeries", self.pointSeries);
              }
            } catch (error) {
              console.error("Error in zoomToCluster:", error);
            }
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

  populateProvinceHumidityData(provinceHumidityData: ProvinceData[]): void {
    if (!this.humiditySeries) return;
    this.provinceHumidityData = provinceHumidityData;
    this.humiditySeries.data.clear();
    console.log(provinceHumidityData);

    provinceHumidityData.forEach(data => {
      this.humiditySeries!.data.push({
        id: data.id,
        value: data.value
      });
    });
    
    console.log(this.humiditySeries.data);   
  }

  populateProvincePrecipitationData(provincePrecipitationData: ProvinceData[]): void {
    if (!this.precipitationSeries) return;
    this.provincePrecipitationData = provincePrecipitationData;
    this.precipitationSeries.data.clear();
    console.log(provincePrecipitationData);

    provincePrecipitationData.forEach(data => {
      // Classify precipitation pattern into 5 categories based on monthly data
      const pattern = this.classifyPrecipitationPattern(data.value);
      this.precipitationSeries!.data.push({
        id: data.id,
        value: pattern
      });
    });
    
    console.log(this.precipitationSeries.data);   
  }

  classifyPrecipitationPattern(precipitationValue: string | number): string {
    // Classify precipitation value into 5 precipitation pattern
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

  populateProvinceSeverityData(provinceSeverityData: ProvinceData[]): void {
    if (!this.severitySeries) return;
    this.provinceSeverityData = provinceSeverityData;
    this.severitySeries.data.clear();
    console.log(provinceSeverityData);

    provinceSeverityData.forEach(data => {
      this.severitySeries!.data.push({
        id: data.id,
        value: data.status
      });
    });
    
    console.log(this.severitySeries.data);   
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
            parseFloat(location.location__longitude), // DO NOT CHANGE THIS LINE
            parseFloat(location.location__latitude), // DO NOT CHANGE THIS LINE
          ] 
        },
        city: location.city,
        id: location.id,
        province: location.location__province,
      });
    });
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
    if (this.humiditySeries && this.humidityHeatLegend && this.root && this.chart) {
      this.humiditySeries.show();
      this.humidityHeatLegend.show();
      
      // Remove any existing background and set the new 
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"))
      console.log(this.chart.get("background"));      
      // Force chart to redraw
      this.chart.markDirty();
      
      // Make sure the legend is visible by bringing it to the front
      if (this.humidityHeatLegend.parent) {
        this.humidityHeatLegend.toFront();
      }
    }
  }
  
  /* istanbul ignore next */
  public hideHumidityLayer(): void {
    if (this.humiditySeries && this.humidityHeatLegend && this.root && this.chart) {
      this.humiditySeries.hide();
      this.humidityHeatLegend.hide();
      
      // Remove any existing background and set the new one
      this.chart.get("background")?.set("fill", am5.color("#E0E0E0"))
      console.log(this.chart.get("background"));   
      
      // Force chart to redraw
      this.chart.markDirty();
    }
  }
    
  /* istanbul ignore next */
  public showPrecipitationLayer(): void {
    if (this.precipitationSeries && this.precipitationHeatLegend && this.root && this.chart) {
      this.precipitationSeries.show();
      this.precipitationHeatLegend.show();
      
      // Remove any existing background and set the new 
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"))
      console.log(this.chart.get("background"));      
      // Force chart to redraw
      this.chart.markDirty();
      
      // Make sure the legend is visible by bringing it to the front
      if (this.precipitationHeatLegend.parent) {
        this.precipitationHeatLegend.toFront();
      }
    }
  }
  
  /* istanbul ignore next */
  public hidePrecipitationLayer(): void {
    if (this.precipitationSeries && this.precipitationHeatLegend && this.root && this.chart) {
      this.precipitationSeries.hide();
      this.precipitationHeatLegend.hide();
      
      // Remove any existing background and set the new one
      this.chart.get("background")?.set("fill", am5.color("#E0E0E0"))
      console.log(this.chart.get("background"));   
      
      // Force chart to redraw
      this.chart.markDirty();
    }
  }

   /* istanbul ignore next */
   public showSeverityLayer(): void {
    if (this.severitySeries && this.severityHeatLegend && this.root && this.chart) {
      this.severitySeries.show();
      this.severityHeatLegend.show();
      
      // Remove any existing background and set the new 
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"))
      console.log(this.chart.get("background"));      
      // Force chart to redraw
      this.chart.markDirty();
      
      // Make sure the legend is visible by bringing it to the front
      if (this.severityHeatLegend.parent) {
        this.severityHeatLegend.toFront();
      }
    }
  }
  
  /* istanbul ignore next */
  public hideSeverityLayer(): void {
    if (this.severitySeries && this.severityHeatLegend && this.root && this.chart) {
      this.severitySeries.hide();
      this.severityHeatLegend.hide();
      
      // Remove any existing background and set the new one
      this.chart.get("background")?.set("fill", am5.color("#E0E0E0"))
      console.log(this.chart.get("background"));   
      
      // Force chart to redraw
      this.chart.markDirty();
    }
  }

  // Update the toggleLayers method to include province layer
    
  /* istanbul ignore next */
  public toggleLayers(showBase: boolean, showHighlight: boolean, showPoints: boolean, showPrecipitation: boolean, showHumidity: boolean, showSeverity: boolean): void {
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

    if (showPrecipitation) {
      this.showPrecipitationLayer();
    } else {
      this.hidePrecipitationLayer();
    }

    if (showHumidity) {
      this.showHumidityLayer();
    } else {
      this.hideHumidityLayer();
    }

    if (showSeverity) {
      this.showSeverityLayer();
    } else {
      this.hideSeverityLayer();
    }
  }
}