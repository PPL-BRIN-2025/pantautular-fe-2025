import React, { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface AgeData {
  age: string;
  value: number;
}

interface AgeStatisticCardProps {
  data?: AgeData[];
}

export default function AgeStatisticCard({ data = [
  { age: "<12 Tahun", value: 1900 },
  { age: "12-25 Tahun", value: 1882 },
  { age: "26-45 Tahun", value: 1809 },
  { age: ">45 Tahun", value: 1322 }
]}:Readonly<AgeStatisticCardProps>) {
  const chartRef = useRef<HTMLDivElement>(null);

  const totalCases = data.reduce((sum, item) => sum + item.value, 0);

  useLayoutEffect(() => {
    // Create root element
    const root = am5.Root.new(chartRef.current!);

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
      strokeOpacity: 0.1,
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
        name: "Series 1", 
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        sequencedInterpolation: true,
        categoryXField: "age",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueY}"
        })
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0,
      fill: am5.color("#f0848c")
    });

    // Set data
    xAxis.data.setAll(data);
    series.data.setAll(data);

    // Make stuff animate on load
    series.appear(1000);
    chart.appear(1000, 100);

    // Cleanup function
    return () => {
      root.dispose();
    };
  }, [data]); // Re-run if data changes

  return (
    <div className="w-full h-96 bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold text-[#0069CF]">Usia</h3>
        <div className="flex items-center gap-2">
          <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_801_121732)">
              <path d="M9.25 17.5C9.25 17.5 8 17.5 8 16.25C8 15 9.25 11.25 14.25 11.25C19.25 11.25 20.5 15 20.5 16.25C20.5 17.5 19.25 17.5 19.25 17.5H9.25ZM14.25 10C15.2446 10 16.1984 9.60491 16.9017 8.90165C17.6049 8.19839 18 7.24456 18 6.25C18 5.25544 17.6049 4.30161 16.9017 3.59835C16.1984 2.89509 15.2446 2.5 14.25 2.5C13.2554 2.5 12.3016 2.89509 11.5983 3.59835C10.8951 4.30161 10.5 5.25544 10.5 6.25C10.5 7.24456 10.8951 8.19839 11.5983 8.90165C12.3016 9.60491 13.2554 10 14.25 10Z" fill="#0069CF"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M7.02 17.5C6.83469 17.1098 6.74228 16.6819 6.75 16.25C6.75 14.5562 7.6 12.8125 9.17 11.6C8.38636 11.3585 7.56994 11.2405 6.75 11.25C1.75 11.25 0.5 15 0.5 16.25C0.5 17.5 1.75 17.5 1.75 17.5H7.02Z" fill="#0069CF"/>
              <path d="M6.125 10C6.9538 10 7.74866 9.67076 8.33471 9.08471C8.92076 8.49866 9.25 7.7038 9.25 6.875C9.25 6.0462 8.92076 5.25134 8.33471 4.66529C7.74866 4.07924 6.9538 3.75 6.125 3.75C5.2962 3.75 4.50134 4.07924 3.91529 4.66529C3.32924 5.25134 3 6.0462 3 6.875C3 7.7038 3.32924 8.49866 3.91529 9.08471C4.50134 9.67076 5.2962 10 6.125 10Z" fill="#0069CF"/>
            </g>
            <defs>
              <clipPath id="clip0_801_121732">
                <rect width="20" height="20" fill="white" transform="translate(0.5)"/>
              </clipPath>
            </defs>
          </svg>
          <span className="text-[#0069CF] font-medium text-lg">{new Intl.NumberFormat('de-DE').format(totalCases)}</span>
        </div>
      </div>
      <div ref={chartRef} data-testid="chart-container" className="w-full h-[85%]" />
    </div>
  );
}