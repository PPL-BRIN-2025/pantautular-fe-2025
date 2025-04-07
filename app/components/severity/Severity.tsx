import React, { useEffect, useState, useMemo } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import { severityApi } from "../../../services/api";

interface ChartData {
  [key: string]: any;
  name: string;
  hospitalisasi: number;
  insiden: number;
  mortalitas: number;
  total_cases: number;
}

interface SeverityChartProps {
  title: string;
  categoryField: string;
  fetchData: () => Promise<Array<{ [key: string]: any }>>;
  seriesConfig: {
    field: string;
    name: string;
    color: string;
  }[];
}

interface SeriesConfig {
  root: am5.Root;
  chart: am5xy.XYChart;
  xAxis: am5xy.CategoryAxis<am5.Renderer>;
  yAxis: am5xy.ValueAxis<am5.Renderer>;
  field: string;
  name: string;
  color: string;
  categoryField: string;
  chartData: ChartData[];
}

// Add this at the top of the file, outside any component
let chartIdCounter = 0;

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
    <span
      style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: color,
        display: "inline-block",
      }}
    ></span>
    <span style={{ fontSize: "12px", fontWeight: "500" }}>{label}</span>
  </div>
);

const createTooltip = (root: am5.Root) => {
  const tooltip = am5.Tooltip.new(root, {
    getFillFromSprite: false,
    background: am5.RoundedRectangle.new(root, {
      fill: am5.color("#e5e7eb"),
      stroke: am5.color("#9ca3af"),
      strokeWidth: 1,
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      cornerRadiusBL: 5,
      cornerRadiusBR: 5
    })
  });

  tooltip.label.setAll({
    fontSize: 10,
    fill: am5.color("#4b5563"),
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8
  });

  return tooltip;
};

const setupXAxis = (root: am5.Root, chart: am5xy.XYChart, categoryField: string) => {
  const xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: categoryField,
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 20,
      }),
    })
  );

  xAxis.get("renderer").labels.template.setAll({
    oversizedBehavior: "truncate",
    maxWidth: 50,
    rotation: -30,
    fontSize: 12,
  });
  xAxis.get("renderer").grid.template.set("visible", false);
  // @ts-ignore
  xAxis.get("renderer").setAll({ paddingInner: 0.5, paddingOuter: 0.3 });

  return xAxis;
};

const setupYAxis = (root: am5.Root, chart: am5xy.XYChart, chartData: ChartData[], seriesConfig: SeverityChartProps['seriesConfig']) => {
  // Ensure chartData is an array and has data
  const maxValue = chartData && Array.isArray(chartData) && chartData.length > 0
    ? Math.max(...chartData.map(item =>
        seriesConfig.reduce((sum, config) => sum + (item[config.field] || 0), 0)
      )) * 1.1
    : 100; // Default max value if no data

  return chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {}),
      min: 0,
      max: maxValue,
      extraMax: 0.1,
      numberFormat: "#,###",
    })
  );
};

const createSeries = (config: SeriesConfig) => {
  const { root, chart, xAxis, yAxis, field, name, color, categoryField, chartData } = config;
  
  // Ensure chartData is an array and has the correct type
  const validData: ChartData[] = Array.isArray(chartData) ? chartData : [];

  const series = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: name,
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: field,
      categoryXField: categoryField,
      stacked: true,
      fill: am5.color(color)
    })
  );

  series.columns.template.setAll({
    cornerRadiusTL: 6,
    cornerRadiusTR: 6,
    cornerRadiusBL: 6,
    cornerRadiusBR: 6,
    strokeWidth: 0,
    width: am5.percent(60)
  });

  // Set tooltip styling
  series.set("tooltip", am5.Tooltip.new(root, {
    getFillFromSprite: false,
    background: am5.RoundedRectangle.new(root, {
      fill: am5.color("#e5e7eb"),
      stroke: am5.color("#9ca3af"),
      strokeWidth: 1,
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      cornerRadiusBL: 5,
      cornerRadiusBR: 5
    })
  }));

  series.get("tooltip").label.setAll({
    fontSize: 10,
    fill: am5.color("#4b5563"),
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8
  });

  series.columns.template.adapters.add("tooltipText", (text, target) => {
    const dataItem = target.dataItem;
    if (dataItem) {
      const categoryValue = dataItem.get("categoryX" as any);
      const itemData = validData.find((item: ChartData) => item[categoryField] === categoryValue);
      if (itemData) {
        return `[fontSize: 10px][bold]${categoryValue}[/]\n[fontSize: 9px]Total Kasus: ${itemData.total_cases.toLocaleString()}\nHospitalisasi: ${itemData.hospitalisasi.toLocaleString()}\nInsiden: ${itemData.insiden.toLocaleString()}\nMortalitas: ${itemData.mortalitas.toLocaleString()}[/]`;
      }
    }
    return "";
  });

  series.columns.template.states.create("hover", {
    strokeWidth: 2,
    stroke: am5.color(color)
  });

  series.data.setAll(validData);
  return series;
};

const SeverityChart = ({ title, categoryField, fetchData, seriesConfig }: SeverityChartProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ChartData[]>([]);
  const chartId = useMemo(() => {
    chartIdCounter += 1;
    return `chartdiv-${Date.now()}-${chartIdCounter}`;
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-500 text-center p-4">
          Error: {error.message}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-gray-500 text-center p-4">
          No data available
        </div>
      );
    }

    return (
      <div id={chartId} className="w-full h-96"></div>
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchData();
        
        console.log('API Response:', response); // Debug log
        
        // Transform data to match ChartData interface
        const transformedData = Array.isArray(response) 
          ? response.map(item => {
              console.log('Processing item:', item); // Debug log
              return {
                name: item.name || '',
                hospitalisasi: Number(item.hospitalisasi || 0),
                insiden: Number(item.insiden || 0),
                mortalitas: Number(item.mortalitas || 0),
                total_cases: Number(item.total_cases || 0)
              };
            })
          : [];

        console.log('Transformed data:', transformedData); // Debug log
        setData(transformedData);
      } catch (err) {
        console.error('Error in SeverityChart:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchData]);

  useEffect(() => {
    if (data.length === 0) return;

    const root = am5.Root.new(chartId);
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        paddingLeft: 0,
        paddingRight: 0
      })
    );

    const xAxis = setupXAxis(root, chart, "name");
    const yAxis = setupYAxis(root, chart, data, seriesConfig);

    xAxis.data.setAll(data);

    seriesConfig.forEach(config => {
      createSeries({
        root,
        chart,
        xAxis,
        yAxis,
        field: config.field,
        name: config.name,
        color: config.color,
        categoryField: "name",
        chartData: data
      });
    });

    return () => {
      root.dispose();
    };
  }, [data, seriesConfig, chartId]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex flex-wrap gap-4 mb-4">
        {seriesConfig.map((config) => (
          <LegendItem
            key={config.name}
            color={config.color}
            label={config.name}
          />
        ))}
      </div>
      {renderContent()}
    </div>
  );
};

// Disease severity chart
export const DiseaseSeverityChart = () => {
  return (
    <SeverityChart
      title="Kasus Jenis Penyakit"
      categoryField="name"
      fetchData={severityApi.getDiseaseSeverityStats}
      seriesConfig={[
        { field: "hospitalisasi", name: "Hospitalisasi", color: "#3cb371" },
        { field: "insiden", name: "Insiden", color: "#ffcd39" },
        { field: "mortalitas", name: "Mortalitas", color: "#e35d6a" },
      ]}
    />
  );
};

// Province severity chart
export const ProvinceSeverityChart = () => {
  return (
    <SeverityChart
      title="Kasus Jangkauan Provinsi"
      categoryField="province"
      fetchData={severityApi.getProvinceSeverityStats}
      seriesConfig={[
        { field: "hospitalisasi", name: "Hospitalisasi", color: "#3cb371" },
        { field: "insiden", name: "Insiden", color: "#ffcd39" },
        { field: "mortalitas", name: "Mortalitas", color: "#e35d6a" },
      ]}
    />
  );
};

// City severity chart
export const CitySeverityChart = () => {
  return (
    <SeverityChart
      title="Kasus Jangkauan Kota"
      categoryField="city"
      fetchData={severityApi.getCitySeverityStats}
      seriesConfig={[
        { field: "hospitalisasi", name: "Hospitalisasi", color: "#3cb371" },
        { field: "insiden", name: "Insiden", color: "#ffcd39" },
        { field: "mortalitas", name: "Mortalitas", color: "#e35d6a" },
      ]}
    />
  );
};

export default SeverityChart;
