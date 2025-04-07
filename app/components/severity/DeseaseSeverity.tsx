import React, { useEffect, useState } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import { diseaseApi } from "../../../services/api";

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
  xAxis: am5xy.CategoryAxis;
  yAxis: am5xy.ValueAxis;
  field: string;
  name: string;
  color: string;
  categoryField: string;
  chartData: ChartData[];
}

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
    <span
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor: color,
        display: "inline-block",
      }}
    ></span>
    <span style={{ fontSize: "14px", fontWeight: "500" }}>{label}</span>
  </div>
);

const createTooltip = (root: am5.Root) => {
  const tooltip = am5.Tooltip.new(root, {
    getFillFromSprite: false,
    background: am5.RoundedRectangle.new(root, {
      fill: am5.color("#c4d9ed"),
      stroke: am5.color("#666666"),
      strokeWidth: 1,
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      cornerRadiusBL: 5,
      cornerRadiusBR: 5
    })
  });

  tooltip.label.setAll({
    fontSize: 8,
    fill: am5.color("#ffffff")
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
  return chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {}),
      min: 0,
      max: Math.max(...chartData.map(item =>
        seriesConfig.reduce((sum, config) => sum + (item[config.field] || 0), 0)
      )) * 1.1,
      extraMax: 0.1,
      numberFormat: "#,###",
    })
  );
};

const createSeries = (config: SeriesConfig) => {
  const { root, chart, xAxis, yAxis, field, name, color, categoryField, chartData } = config;
  
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

  series.columns.template.adapters.add("tooltipText", (text, target) => {
    const dataItem = target.dataItem;
    if (dataItem) {
      const categoryValue = dataItem.get("categoryX" as any);
      const data = chartData.find(item => item[categoryField] === categoryValue);
      if (data) {
        return `[fontSize: 8px][bold]${categoryValue}[/]\nTotal Kasus: ${data.total_cases}\nHospitalisasi: ${data.hospitalisasi}\nInsiden: ${data.insiden}\nMortalitas: ${data.mortalitas}`;
      }
    }
    return "";
  });

  series.columns.template.states.create("hover", {
    strokeWidth: 2,
    stroke: am5.color(color)
  });

  series.data.setAll(chartData);
  return series;
};

const SeverityChart = ({ title, categoryField, fetchData, seriesConfig }: SeverityChartProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData();
      setChartData(data as ChartData[]);
    };

    loadData();
  }, [fetchData]);

  useEffect(() => {
    if (chartData.length === 0) return;

    const root = am5.Root.new("chartdiv");
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        layout: root.verticalLayout,
        paddingTop: 50,
        paddingBottom: 20,
      })
    );

    const tooltip = createTooltip(root);
    chart.set("tooltip", tooltip);

    const xAxis = setupXAxis(root, chart, categoryField);
    const yAxis = setupYAxis(root, chart, chartData, seriesConfig);

    xAxis.data.setAll(chartData);

    seriesConfig.forEach(config => {
      createSeries({
        root,
        chart,
        xAxis,
        yAxis,
        field: config.field,
        name: config.name,
        color: config.color,
        categoryField,
        chartData
      });
    });

    return () => root.dispose();
  }, [chartData, categoryField, seriesConfig]);

  return (
    <div className="flex flex-col w-full">
      <h2 className="chart-title">{title}</h2>
      <div className="chart-container">
        <div id="chartdiv" className="chart-wrapper"></div>
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: "15px",
            padding: "10px",
          }}
        >
          {seriesConfig.map((config) => (
            <LegendItem key={config.field} color={config.color} label={config.name} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const DiseaseSeverityChart = () => {
  return (
    <SeverityChart
      title="Kasus Jenis Penyakit"
      categoryField="name"
      fetchData={diseaseApi.getSeverityStats}
      seriesConfig={[
        { field: "hospitalisasi", name: "Hospitalisasi", color: "#3cb371" },
        { field: "insiden", name: "Insiden", color: "#ffcd39" },
        { field: "mortalitas", name: "Mortalitas", color: "#e35d6a" },
      ]}
    />
  );
};

export default SeverityChart;
