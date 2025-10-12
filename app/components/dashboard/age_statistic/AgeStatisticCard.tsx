import React, { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import PeopleIcon from "../../icons/PeopleIcon";
import DownloadButton from "../DownloadButton";

interface AgeData {
  under_12: number;
  "12_25": number;
  "26_45": number;
  above_45: number;
}

const AGE_LABELS: Record<keyof AgeData, string> = {
  under_12: "< 12 tahun",
  "12_25": "12-25 tahun",
  "26_45": "26-45 tahun",
  above_45: "> 45 tahun"
};

interface AgeStatisticCardProps {
  data?: AgeData;
}

export default function AgeStatisticCard({ data }: Readonly<AgeStatisticCardProps>) {
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* istanbul ignore next */
  const totalCases = data ? Object.values(data).reduce((sum, value) => sum + value, 0) : 0;

  useLayoutEffect(() => {
    /* istanbul ignore if */
    if (!data) return;
    // Transform data into format expected by AmCharts
    const chartData = Object.entries(data).map(([key, value]) => ({
      age: AGE_LABELS[key as keyof AgeData],
      value: value
    }));

    // Create root element
    const root = am5.Root.new(chartRef.current);

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        pinchZoomX: true,
        paddingLeft: 0,
        paddingRight: 1
      })
    );

    // Add cursor
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    // Create axes
    const xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 30,
      minorGridEnabled: true
    });

    xRenderer.labels.template.setAll({
      centerY: am5.p50,
      centerX: am5.p50,
      paddingTop: 10,
      fontSize: 10,
      textAlign: "center",
      maxWidth: 100
    });

    xRenderer.grid.template.set("visible", false);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0.3,
        categoryField: "age",
        renderer: xRenderer
      })
    );

    const yRenderer = am5xy.AxisRendererY.new(root, {
      strokeOpacity: 0.1
    });

    yRenderer.labels.template.setAll({
      fontSize: 11
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0.3,
        renderer: yRenderer
      })
    );

    // Create series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Kasus berdasarkan Usia",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        sequencedInterpolation: true,
        categoryXField: "age",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueY} kasus"
        })
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0,
      fill: am5.color("#f0848c"),
      width: am5.percent(70),
      tooltipY: 0
    });

    // Set data
    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    // Make stuff animate on load
    series.appear(1000);
    chart.appear(1000, 100);

    // Cleanup function
    return () => {
      root.dispose();
    };
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-96 bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
        <h3 className="text-xl font-semibold text-[#0069CF]">Usia</h3>
        <div className="flex items-center gap-3">
          <DownloadButton
            filename="distribusi-usia"
            getTarget={() => containerRef.current}
          />
          <div className="flex items-center text-[#0069CF] text-xl font-bold">
            <PeopleIcon className="w-6 h-6 mr-2" />
            {totalCases ? new Intl.NumberFormat('de-DE').format(totalCases) : 0}
          </div>
        </div>
      </div>
      <div ref={chartRef} data-testid="chart-container" className="w-full h-[85%]" />
    </div>
  );
}
