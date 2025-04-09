"use client";
import React, { useLayoutEffect} from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const useDonutChart = (
    chartRef: React.RefObject<HTMLDivElement | null>,
  priaValue: number,
  wanitaValue: number
) => {
  useLayoutEffect(() => {
    if (!chartRef.current) return;
    const root = am5.Root.new(chartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(50),
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "category",
        fillField: "color",
      })
    );

    series.data.setAll([
      {
        category: "Pria",
        value: priaValue,
        color: am5.color(0x3b82f6), 
      },
      {
        category: "Wanita",
        value: wanitaValue,
        color: am5.color(0xf472b6),
      },
    ]);

    series.labels.template.setAll({ forceHidden: true });
    series.ticks.template.setAll({ forceHidden: true });

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        y: am5.percent(90),
        centerY: am5.percent(90),
      })
    );
    legend.data.setAll(series.dataItems);

    legend.labels.template.setAll({
        fontSize: 12, 
      });
      legend.valueLabels.template.setAll({
        fontSize: 12, 
      });

    series.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [chartRef, priaValue, wanitaValue]);
};
export default useDonutChart