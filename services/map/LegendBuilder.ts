import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";

/**
 * Factory class for creating map legends
 */
export class LegendBuilder {
  private readonly root: am5.Root;
  private readonly chart: am5map.MapChart;

  constructor(root: am5.Root, chart: am5map.MapChart) {
    this.root = root;
    this.chart = chart;
  }

  /**
   * Creates a humidity legend with color-coded scale
   */
  createHumidityLegend(): am5.Container {
    // Create custom legend - positioned at the bottom center
    const humidityLegend = this.chart.children.push(am5.Container.new(this.root, {
      width: am5.percent(80),
      height: 50,
      layout: this.root.horizontalLayout,
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
    const humidityLabelsContainer = humidityLegend.children.push(am5.Container.new(this.root, {
      width: am5.percent(100),
      height: am5.percent(100),
      layout: this.root.horizontalLayout,
      centerY: am5.percent(50)
    }));

    // Create color blocks container
    const humidityBlocksContainer = humidityLabelsContainer.children.push(am5.Container.new(this.root, {
      width: am5.percent(60),
      height: 20,
      layout: this.root.horizontalLayout,
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

    // Create blocks for legend
    this.createColorBlocks(humidityBlocksContainer, humidityColorBlocks);

    // Initially hide the legend
    humidityLegend.hide();

    return humidityLegend;
  }

  /**
   * Creates a precipitation legend with pattern categories
   */
  createPrecipitationLegend(): am5.Container {
    // Create custom legend - positioned at the bottom center
    const precipitationLegend = this.chart.children.push(am5.Container.new(this.root, {
      width: am5.percent(80),
      height: 50,
      layout: this.root.horizontalLayout,
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
    const precipitationLabelsContainer = precipitationLegend.children.push(am5.Container.new(this.root, {
      width: am5.percent(100),
      height: am5.percent(100),
      layout: this.root.horizontalLayout,
      centerY: am5.percent(50)
    }));

    // Create color blocks container
    const precipitationBlocksContainer = precipitationLabelsContainer.children.push(am5.Container.new(this.root, {
      width: am5.percent(60),
      height: 20,
      layout: this.root.horizontalLayout,
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

    // Create blocks for legend
    this.createColorBlocks(precipitationBlocksContainer, precipitationColorBlocks);

    // Initially hide the legend
    precipitationLegend.hide();

    return precipitationLegend;
  }

  /**
   * Creates a temperature legend with color scale
   */
  createTemperatureLegend(): am5.Container {
    // Create temperature legend
    const temperatureLegend = this.chart.children.push(am5.Container.new(this.root, {
      width: am5.percent(80),
      height: 50,
      layout: this.root.horizontalLayout,
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

    // Create labels container
    const temperatureLabelsContainer = temperatureLegend.children.push(am5.Container.new(this.root, {
      width: am5.percent(100),
      height: am5.percent(100),
      layout: this.root.horizontalLayout,
      centerY: am5.percent(50)
    }));

    // Create color blocks container
    const temperatureBlocksContainer = temperatureLabelsContainer.children.push(am5.Container.new(this.root, {
      width: am5.percent(60),
      height: 20,
      layout: this.root.horizontalLayout,
      marginLeft: 10,
      marginRight: 10,
      centerY: am5.percent(50)
    }));

    // Define temperature color blocks
    const temperatureColorBlocks = [
      { color: "#000080", range: "≤0°C" },
      { color: "#0000FF", range: "2°C" },
      { color: "#0066FF", range: "4°C" },
      { color: "#0099FF", range: "6°C" },
      { color: "#00CCFF", range: "8°C" },
      { color: "#00FFFF", range: "10°C" },
      { color: "#00FFCC", range: "12°C" },
      { color: "#00FF99", range: "14°C" },
      { color: "#00FF66", range: "16°C" },
      { color: "#00FF00", range: "18°C" },
      { color: "#66FF00", range: "20°C" },
      { color: "#99FF00", range: "22°C" },
      { color: "#CCFF00", range: "24°C" },
      { color: "#FFFF00", range: "26°C" },
      { color: "#FFCC00", range: "28°C" },
      { color: "#FF9900", range: "30°C" },
      { color: "#FF6600", range: "32°C" },
      { color: "#FF3300", range: "34°C" },
      { color: "#FF0000", range: "36°C" },
      { color: "#CC0000", range: ">36°C" }
    ];

    // Create blocks for temperature legend with smaller font due to more items
    this.createColorBlocks(temperatureBlocksContainer, temperatureColorBlocks, 10, -15);

    // Initially hide the legend
    temperatureLegend.hide();

    return temperatureLegend;
  }

  /**
   * Creates a severity legend with status categories
   */
  createSeverityLegend(): am5.Container {
    // Create custom legend - positioned at the bottom center
    const severityLegend = this.chart.children.push(am5.Container.new(this.root, {
      width: am5.percent(80),
      height: 50,
      layout: this.root.horizontalLayout,
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
    const severityLabelsContainer = severityLegend.children.push(am5.Container.new(this.root, {
      width: am5.percent(100),
      height: am5.percent(100),
      layout: this.root.horizontalLayout,
      centerY: am5.percent(50)
    }));

    // Create color blocks container
    const severityBlocksContainer = severityLabelsContainer.children.push(am5.Container.new(this.root, {
      width: am5.percent(60),
      height: 20,
      layout: this.root.horizontalLayout,
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

    // Create blocks for legend
    this.createColorBlocks(severityBlocksContainer, severityColorBlocks);

    // Initially hide the legend
    severityLegend.hide();

    return severityLegend;
  }

  /**
   * Helper method to create color blocks for legends with labels
   */
  private createColorBlocks(
    container: am5.Container, 
    colorBlocks: Array<{color: string, range: string}>,
    fontSize: number = 11.5,
    centerX: number = -100
  ): void {
    // Create a higher container for block styling
    colorBlocks.forEach(block => {
      // Create a container for each block (to hold both rectangle and label)
      const blockContainer = container.children.push(am5.Container.new(this.root, {
        width: am5.percent(100 / colorBlocks.length),
        height: 25,
        layout: this.root.verticalLayout
      }));

      // Add the colored rectangle
      blockContainer.children.push(am5.Rectangle.new(this.root, {
        width: am5.percent(100),
        height: 20,
        fill: am5.color(block.color),
      }));

      // Add the label inside the colored rectangle
      blockContainer.children.push(am5.Label.new(this.root, {
        text: block.range,
        fontSize: fontSize,
        fontWeight: "500",
        fill: am5.color(0xFFFFFF),
        centerX: am5.percent(centerX),
        marginTop: -25,
      }));
    });
  }
} 