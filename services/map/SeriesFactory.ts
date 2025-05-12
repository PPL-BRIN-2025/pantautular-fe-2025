import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_indonesiaLow from "@amcharts/amcharts5-geodata/indonesiaLow";
import { getTooltip } from "../../utils/tooltipUtils";

/**
 * Factory class for creating different types of map series
 */
export class SeriesFactory {
  private root: am5.Root;
  private chart: am5map.MapChart;

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
      fill: am5.color(options.fill || "#FFFFFF"),
      stroke: am5.color(options.stroke || "#CCCCCC"),
      strokeWidth: options.strokeWidth || 0.5,
      fillOpacity: options.fillOpacity === undefined ? 1 : options.fillOpacity,
    });
  }

  /**
   * Applies heat rules to a series with a custom function
   * @param series The series to apply heat rules to
   * @param customFunction The custom function for coloring
   */
  private applyHeatRules(
    series: am5map.MapPolygonSeries,
    customFunction: (sprite: am5.Sprite, min: any, max: any, value: any) => void
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
    const series = this.createBaseMapSeries({
      valueField: "value",
      calculateAggregates: true,
    });

    this.applyPolygonStyle(series, { fillOpacity: 0.8 });

    this.applyHeatRules(series, (sprite: am5.Sprite, min, max, value) => {
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
      } else if (value > 90) {
        (sprite as am5.Graphics).set("fill", am5.color("#00528F"));
      } else {
        (sprite as am5.Graphics).set("fill", am5.color("#FFFFFF"));
      }
    });

    // Initially hide the series
    series.hide();

    return series;
  }

  /**
   * Creates a precipitation layer series
   */
  createPrecipitationSeries(): am5map.MapPolygonSeries {
    const series = this.createBaseMapSeries({
      valueField: "value",
      calculateAggregates: true,
    });

    this.applyPolygonStyle(series, { fillOpacity: 0.8 });

    this.applyHeatRules(series, (sprite: am5.Sprite, min, max, value) => {
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
      } else {
        (sprite as am5.Graphics).set("fill", am5.color("#FFFFFF"));
      }
    });

    // Initially hide the series
    series.hide();

    return series;
  }

  /**
   * Creates a temperature layer series
   */
  createTemperatureSeries(): am5map.MapPolygonSeries {
    const series = this.createBaseMapSeries({
      valueField: "value",
      calculateAggregates: true,
    });

    this.applyPolygonStyle(series, { fillOpacity: 0.8 });

    this.applyHeatRules(series, (sprite: am5.Sprite, min, max, value) => {
      if (value <= 0) {
        (sprite as am5.Graphics).set("fill", am5.color("#000080")); // Dark blue
      } else if (value <= 2) {
        (sprite as am5.Graphics).set("fill", am5.color("#0000FF")); // Blue
      } else if (value <= 4) {
        (sprite as am5.Graphics).set("fill", am5.color("#0066FF"));
      } else if (value <= 6) {
        (sprite as am5.Graphics).set("fill", am5.color("#0099FF"));
      } else if (value <= 8) {
        (sprite as am5.Graphics).set("fill", am5.color("#00CCFF"));
      } else if (value <= 10) {
        (sprite as am5.Graphics).set("fill", am5.color("#00FFFF")); // Cyan
      } else if (value <= 12) {
        (sprite as am5.Graphics).set("fill", am5.color("#00FFCC"));
      } else if (value <= 14) {
        (sprite as am5.Graphics).set("fill", am5.color("#00FF99"));
      } else if (value <= 16) {
        (sprite as am5.Graphics).set("fill", am5.color("#00FF66"));
      } else if (value <= 18) {
        (sprite as am5.Graphics).set("fill", am5.color("#00FF00")); // Green
      } else if (value <= 20) {
        (sprite as am5.Graphics).set("fill", am5.color("#66FF00"));
      } else if (value <= 22) {
        (sprite as am5.Graphics).set("fill", am5.color("#99FF00"));
      } else if (value <= 24) {
        (sprite as am5.Graphics).set("fill", am5.color("#CCFF00"));
      } else if (value <= 26) {
        (sprite as am5.Graphics).set("fill", am5.color("#FFFF00")); // Yellow
      } else if (value <= 28) {
        (sprite as am5.Graphics).set("fill", am5.color("#FFCC00"));
      } else if (value <= 30) {
        (sprite as am5.Graphics).set("fill", am5.color("#FF9900")); 
      } else if (value <= 32) {
        (sprite as am5.Graphics).set("fill", am5.color("#FF6600"));
      } else if (value <= 34) {
        (sprite as am5.Graphics).set("fill", am5.color("#FF3300"));
      } else if (value <= 36) {
        (sprite as am5.Graphics).set("fill", am5.color("#FF0000")); // Red
      } else if (value > 36) {
        (sprite as am5.Graphics).set("fill", am5.color("#CC0000")); // Dark red
      } else {
        (sprite as am5.Graphics).set("fill", am5.color("#FFFFFF"));
      }
    });

    // Initially hide the series
    series.hide();

    return series;
  }

  /**
   * Creates a severity layer series
   */
  createSeveritySeries(): am5map.MapPolygonSeries {
    const series = this.createBaseMapSeries({
      valueField: "value",
      calculateAggregates: true,
    });

    this.applyPolygonStyle(series, { fillOpacity: 0.8 });

    this.applyHeatRules(series, (sprite: am5.Sprite, min, max, value) => {
      if (value == "katastropik") {
        (sprite as am5.Graphics).set("fill", am5.color("#DC3545"));
      } else if (value == "bahaya") {
        (sprite as am5.Graphics).set("fill", am5.color("#FD7E14"));
      } else if (value == "biasa") {
        (sprite as am5.Graphics).set("fill", am5.color("#FFC107"));
      } else if (value == "minimal") {
        (sprite as am5.Graphics).set("fill", am5.color("#CACBCB"));
      } else {
        (sprite as am5.Graphics).set("fill", am5.color("#FFFFFF"));
      }
    });

    // Initially hide the series
    series.hide();

    return series;
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