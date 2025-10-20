import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import { severityApi } from "../../../services/api";
import { FilterState } from "../../../types";
import DownloadButton from "../dashboard/DownloadButton";

interface ChartData {
  [key: string]: any;
  name: string;
  hospitalisasi: number;
  insiden: number;
  mortalitas: number;
  total_cases: number;
}

interface FilterResponse {
  disease_stats: Array<{
    name: string;
    severity_counts: {
      hospitalisasi: number;
      insiden: number;
      mortalitas: number;
    };
    total_cases: number;
  }>;
  province_stats: Array<{
    name: string;
    severity_counts: {
      hospitalisasi: number;
      insiden: number;
      mortalitas: number;
    };
    total_cases: number;
  }>;
  city_stats: Array<{
    name: string;
    severity_counts: {
      hospitalisasi: number;
      insiden: number;
      mortalitas: number;
    };
    total_cases: number;
  }>;
}

interface SeverityChartProps {
  title: string;
  categoryField: string;
  fetchData: (filter?: FilterState) => Promise<Array<{ [key: string]: any }>>;
  seriesConfig: {
    field: string;
    name: string;
    color: string;
  }[];
  filter?: FilterState;
  type: 'disease' | 'province' | 'city';
}

interface SeriesConfig {
  root: am5.Root;
  chart: am5xy.XYChart;
  // @ts-ignore - Renderer exists in amcharts but isn't properly exported in types
  xAxis: am5xy.CategoryAxis<am5.Renderer>;
  // @ts-ignore - Renderer exists in amcharts but isn't properly exported in types
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

/* istanbul ignore next */
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

const setupXAxis = (root: am5.Root, chart: am5xy.XYChart, categoryField: string, dataLength: number) => {
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
  
  // Adjust padding based on data length
  /* istanbul ignore next */
  const padding = dataLength <= 3 ? 0.3 : 0.1;
  /* istanbul ignore next */
  xAxis.get("renderer").setAll({ 
    // @ts-ignore - paddingInner property exists in amcharts but isn't properly typed
    paddingInner: padding,
    paddingOuter: padding
  });

  return xAxis;
};

const setupYAxis = (root: am5.Root, chart: am5xy.XYChart, chartData: ChartData[], seriesConfig: SeverityChartProps['seriesConfig']) => {
  // Ensure chartData is an array and has data
  /* istanbul ignore next */
  const maxValue = chartData && Array.isArray(chartData) && chartData.length > 0
    ? Math.max(...chartData.map(item =>
        seriesConfig.reduce((sum, config) => sum + (item[config.field] ?? 0), 0)
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
  /* istanbul ignore next */
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

  // Adjust width based on data length
  /* istanbul ignore next */
  const width = validData.length <= 3 ? am5.percent(30) : am5.percent(60);

  series.columns.template.setAll({
    cornerRadiusTL: 6,
    cornerRadiusTR: 6,
    cornerRadiusBL: 6,
    cornerRadiusBR: 6,
    strokeWidth: 0,
    width: width
  });

  /* istanbul ignore next */
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

  /* istanbul ignore next */
  series.get("tooltip")?.label.setAll({
    fontSize: 10,
    fill: am5.color("#4b5563"),
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8
  });

  series.columns.template.adapters.add("tooltipText", (text, target) => {
    /* istanbul ignore next */
    const dataItem = target.dataItem;
    /* istanbul ignore next */
    if (dataItem) {
      const categoryValue = dataItem.get("categoryX" as any);
      const itemData = validData.find((item: ChartData) => item[categoryField] === categoryValue);
      if (itemData) {
        return `[fontSize: 10px][bold]${categoryValue}[/]\n[fontSize: 9px]Total Kasus: ${itemData.total_cases.toLocaleString()}\nHospitalisasi: ${itemData.hospitalisasi.toLocaleString()}\nInsiden: ${itemData.insiden.toLocaleString()}\nMortalitas: ${itemData.mortalitas.toLocaleString()}[/]`;
      }
    }
    /* istanbul ignore next */
    return "";
  });

  /* istanbul ignore next */
  series.columns.template.states.create("hover", {
    strokeWidth: 2,
    stroke: am5.color(color)
  });

  series.data.setAll(validData);
  return series;
};

const SeverityChart = ({ 
  title, 
  categoryField, 
  fetchData, 
  seriesConfig,
  filter,
  type
}: SeverityChartProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const rootRef = useRef<am5.Root | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartId = useMemo(() => {
    chartIdCounter += 1;
    return `chartdiv-${Date.now()}-${chartIdCounter}`;
  }, []);

  /* istanbul ignore next */
  const transformedData = useMemo(() => {
    return rawData.map(item => ({
      name: item.name ?? '',
      hospitalisasi: Number(item.hospitalisasi ?? 0),
      insiden: Number(item.insiden ?? 0),
      mortalitas: Number(item.mortalitas ?? 0),
      total_cases: Number(item.total_cases ?? 0)
    }));
  }, [rawData]);

  const hasData = useMemo(
    () => transformedData.some(item => item.total_cases > 0),
    [transformedData]
  );

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading data with filter:', filter);
      const response = await fetchData(filter);
      console.log('API Response:', response);
      
      let data;
      if (filter && !Array.isArray(response)) {
        const filterResponse = response as FilterResponse;
        
        // Extract the nested ternary into a separate statement
        let stats;
        if (type === 'disease') {
          stats = filterResponse.disease_stats;
        } else if (type === 'province') {
          stats = filterResponse.province_stats;
        } else {
          stats = filterResponse.city_stats;
        }
        
        // Transform the data to match the expected format
        data = stats.map(item => ({
          name: item.name,
          hospitalisasi: item.severity_counts.hospitalisasi,
          insiden: item.severity_counts.insiden,
          mortalitas: item.severity_counts.mortalitas,
          total_cases: item.total_cases
        }));
      } else {
        data = response;
      }
      
      console.log('Transformed data:', data);
      /* istanbul ignore next */
      setRawData(data);
    } catch (err) {
      console.error('Error in SeverityChart:', err);
      /* istanbul ignore next */
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      setRawData([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, filter, type]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

    if (transformedData.length === 0) {
      return (
        <div className="text-gray-500 text-center p-4">
          No data available
        </div>
      );
    }

    return (
      <div className="relative">
        <div id={chartId} className="w-full h-64"></div>
      </div>
    );
  };

  useEffect(() => {
    if (transformedData.length === 0) return;

    const root = am5.Root.new(chartId);
    rootRef.current = root;
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

    const xAxis = setupXAxis(root, chart, "name", transformedData.length);
    const yAxis = setupYAxis(root, chart, transformedData, seriesConfig);

    xAxis.data.setAll(transformedData);

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
        chartData: transformedData
      });
    });

    return () => {
      root.dispose();
      rootRef.current = null;
    };
  }, [transformedData, seriesConfig, chartId]);

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="chart-title">{title}</h3>
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <DownloadButton
            filename={title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
            getTarget={() => containerRef.current}
            canDownload={() => hasData}
          />
          <div className="flex gap-3 items-center flex-wrap">
            {seriesConfig.map((config) => (
              <LegendItem key={config.field} color={config.color} label={config.name} />
            ))}
          </div>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

// Disease severity chart
export const DiseaseSeverityChart = ({ filter }: { filter?: FilterState }) => {
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
      filter={filter}
      type="disease"
    />
  );
};

// Province severity chart
export const ProvinceSeverityChart = ({ filter }: { filter?: FilterState }) => {
  return (
    <SeverityChart
      title="Kasus Jangkauan Provinsi"
      categoryField="name"
      fetchData={severityApi.getProvinceSeverityStats}
      seriesConfig={[
        { field: "hospitalisasi", name: "Hospitalisasi", color: "#3cb371" },
        { field: "insiden", name: "Insiden", color: "#ffcd39" },
        { field: "mortalitas", name: "Mortalitas", color: "#e35d6a" },
      ]}
      filter={filter}
      type="province"
    />
  );
};

// City severity chart
export const CitySeverityChart = ({ filter }: { filter?: FilterState }) => {
  return (
    <SeverityChart
      title="Kasus Jangkauan Kota"
      categoryField="name"
      fetchData={severityApi.getCitySeverityStats}
      seriesConfig={[
        { field: "hospitalisasi", name: "Hospitalisasi", color: "#3cb371" },
        { field: "insiden", name: "Insiden", color: "#ffcd39" },
        { field: "mortalitas", name: "Mortalitas", color: "#e35d6a" },
      ]}
      filter={filter}
      type="city"
    />
  );
};

export default SeverityChart;
