import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_indonesiaLow from "@amcharts/amcharts5-geodata/indonesiaLow";
import { getTooltip } from "../../utils/tooltipUtils";

/**
 * Type definition for color mapping function
 */
type ColorMappingFunction = (sprite: am5.Sprite, min: any, max: any, value: any) => void;

// Color mapping objects
const humidityColorMap: Record<string, string> = {
  "0": "#C41A0A",
  "10": "#F4440B",
  "20": "#F47A0B",
  "30": "#F4B00B",
  "40": "#F4E60B",
  "50": "#D2EE3C",
  "60": "#AFF474",
  "70": "#A3D4FF",
  "80": "#6DBCFF",
  "90": "#1392FF",
  "91+": "#00528F",
  "default": "#FFFFFF"
};

const precipitationColorMap: Record<string, string> = {
  "Lokal": "#DC3545",
  "Multipattern": "#E35D6A",
  "Monsoon": "#FFC107",
  "Equatorial": "#3CB371",
  "Lainnya": "#B8B8B8",
  "default": "#FFFFFF"
};

const temperatureColorMap: Record<string, string> = {
  "0": "#000080", // Dark blue
  "2": "#0000FF", // Blue
  "4": "#0066FF",
  "6": "#0099FF",
  "8": "#00CCFF",
  "10": "#00FFFF", // Cyan
  "12": "#00FFCC",
  "14": "#00FF99",
  "16": "#00FF66",
  "18": "#00FF00", // Green
  "20": "#66FF00",
  "22": "#99FF00",
  "24": "#CCFF00",
  "26": "#FFFF00", // Yellow
  "28": "#FFCC00",
  "30": "#FF9900",
  "32": "#FF6600",
  "34": "#FF3300",
  "36": "#FF0000", // Red
  "37+": "#CC0000", // Dark red
  "default": "#FFFFFF"
};

const severityColorMap: Record<string, string> = {
  "katastropik": "#DC3545",
  "bahaya": "#FD7E14",
  "biasa": "#FFC107",
  "minimal": "#CACBCB",
  "default": "#FFFFFF"
};

/**
 * Factory class for creating different types of map series
 */
export class SeriesFactory {
  private readonly root: am5.Root;
  private readonly chart: am5map.MapChart;

  constructor(root: am5.Root, chart: am5map.MapChart) {
    this.root = root;
    this.chart = chart;
  }

  /**
   * Creates a base map polygon series with common settings
   * @param options Additional options for the series
   */
  private createBaseMapSeries(options: {
    valueField?: string;
    calculateAggregates?: boolean;
  } = {}): am5map.MapPolygonSeries {
    return this.chart.series.push(
      am5map.MapPolygonSeries.new(this.root, {
        geoJSON: am5geodata_indonesiaLow,
        exclude: ["AQ"],
        valueField: options.valueField,
        calculateAggregates: options.calculateAggregates,
      })
    );
  }

  /**
   * Applies common polygon styling
   * @param series The series to style
   * @param options Styling options
   */
  private applyPolygonStyle(
    series: am5map.MapPolygonSeries,
    options: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      fillOpacity?: number;
    } = {}
  ): void {
    series.mapPolygons.template.setAll({
      fill: am5.color(options.fill ?? "#FFFFFF"),
      stroke: am5.color(options.stroke ?? "#CCCCCC"),
      strokeWidth: options.strokeWidth ?? 0.5,
      fillOpacity: options.fillOpacity ?? 1,
    });
  }

  /**
   * Applies heat rules to a series with a custom function
   * @param series The series to apply heat rules to
   * @param customFunction The custom function for coloring
   */
  private applyHeatRules(
    series: am5map.MapPolygonSeries,
    customFunction: ColorMappingFunction
  ): void {
    series.set("heatRules", [
      {
        target: series.mapPolygons.template,
        dataField: "value",
        customFunction: customFunction,
      },
    ]);
  }

  /**
   * Creates a layer series with common structure
   * @param colorMappingFn Function to map values to colors
   */
  private createLayerSeries(colorMappingFn: ColorMappingFunction): am5map.MapPolygonSeries {
    const series = this.createBaseMapSeries({
      valueField: "value",
      calculateAggregates: true,
    });

    this.applyPolygonStyle(series, { fillOpacity: 0.8 });
    this.applyHeatRules(series, colorMappingFn);
    
    // Initially hide the series
    series.hide();

    return series;
  }

  /**
   * Gets color for numeric ranges using a mapping object
   */
  private getNumericRangeColor(value: number, colorMap: Record<string, string>): string {
    const keys = Object.keys(colorMap)
      .filter(k => k !== "default" && !k.includes("+"))
      .map(Number)
      .sort((a, b) => a - b);
    
    // Handle special case for values above highest threshold
    const highestKey = Math.max(...keys);
    if (value > highestKey && colorMap[`${highestKey + 1}+`]) {
      return colorMap[`${highestKey + 1}+`];
    }
    
    // Find appropriate range
    for (const threshold of keys) {
      if (value <= threshold) {
        return colorMap[threshold.toString()];
      }
    }
    
    return colorMap.default;
  }

  /**
   * Creates a base polygon series for Indonesia map
   */
  createBasePolygonSeries(): am5map.MapPolygonSeries {
    const series = this.createBaseMapSeries();
    this.applyPolygonStyle(series);
    return series;
  }

  /**
   * Creates a highlight polygon series for Indonesia map
   */
  createHighlightSeries(): am5map.MapPolygonSeries {
    const series = this.createBaseMapSeries();
    this.applyPolygonStyle(series, {
      fill: "#E0E0E0",
      fillOpacity: 0.3,
      stroke: "#999999",
      strokeWidth: 1,
    });
    return series;
  }

  /**
   * Creates a humidity layer series
   */
  createHumiditySeries(): am5map.MapPolygonSeries {
    return this.createLayerSeries((sprite: am5.Sprite, min, max, value) => {
      const color = this.getNumericRangeColor(value, humidityColorMap);
      (sprite as am5.Graphics).set("fill", am5.color(color));
    });
  }

  /**
   * Creates a precipitation layer series
   */
  createPrecipitationSeries(): am5map.MapPolygonSeries {
    return this.createLayerSeries((sprite: am5.Sprite, min, max, value) => {
      const color = precipitationColorMap[value] || precipitationColorMap.default;
      (sprite as am5.Graphics).set("fill", am5.color(color));
    });
  }

  /**
   * Creates a temperature layer series
   */
  createTemperatureSeries(): am5map.MapPolygonSeries {
    return this.createLayerSeries((sprite: am5.Sprite, min, max, value) => {
      const color = this.getNumericRangeColor(value, temperatureColorMap);
      (sprite as am5.Graphics).set("fill", am5.color(color));
    });
  }

  /**
   * Creates a severity layer series
   */
  createSeveritySeries(): am5map.MapPolygonSeries {
    return this.createLayerSeries((sprite: am5.Sprite, min, max, value) => {
      const color = severityColorMap[value] || severityColorMap.default;
      (sprite as am5.Graphics).set("fill", am5.color(color));
    });
  }

  /**
   * Creates clustered point series for locations
   */
  createPointSeries(): am5map.ClusteredPointSeries {
    const series = this.chart.series.push(
      am5map.ClusteredPointSeries.new(this.root, {
        groupIdField: "province",
        scatterDistance: 20
      })
    );

    // Setup cluster bullet
    series.set("clusteredBullet", (root: am5.Root) => {
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
        if (e.target.dataItem && series) {
          try {
            series.zoomToCluster(e.target.dataItem as am5.DataItem<any>);
          } catch (error) {
            console.error("Error in zoomToCluster:", error);
          }
        }
      });

      return am5.Bullet.new(root, {
        sprite: container,
      });
    });

    // Setup regular bullet
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

    series.bullets.push((root, series, dataItem) => {
      const circle = am5.Circle.new(root, {
        radius: 6,
        tooltipY: 0,
        fill: am5.color("#fc0339"),
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
    series.set("tooltip", tooltip);

    return series;
  }

  /**
   * Creates location marker point series
   */
  createLocationSeries(): am5map.MapPointSeries {
    const series = this.chart.series.push(
      am5map.MapPointSeries.new(this.root, {})
    );

    // Add circle marker
    series.bullets.push(() =>
      am5.Bullet.new(this.root, {
        sprite: am5.Circle.new(this.root, {
          radius: 8,
          fill: am5.color("#2196F3"),
          strokeWidth: 2,
          stroke: am5.color("#FFFFFF"),
        }),
      })
    );

    // Add glow effect
    series.bullets.push(() =>
      am5.Bullet.new(this.root, {
        sprite: am5.Circle.new(this.root, {
          radius: 12,
          fill: am5.color("#2196F3"),
          fillOpacity: 0.3,
        }),
      })
    );

    return series;
  }
} 