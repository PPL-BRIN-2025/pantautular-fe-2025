"use client";

import { useEffect, useRef } from "react";
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import DownloadButton from "./DownloadButton";

interface AmChartTingkatanKasusProps {
  jsonData: {
    data: {
      [key: string]: Array<{
        date: string;
        count: number;
      }>;
    };
  };
}

export default function AmChartTingkatanKasus ({ jsonData }: Readonly<AmChartTingkatanKasusProps>) {
  const chartRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!jsonData?.data || !chartRef.current) return;

    try {
      const root = am5.Root.new(chartRef.current);

      const myTheme = am5.Theme.new(root);
      myTheme.rule('AxisLabel', ['minor']).setAll({ dy: 1 });
      myTheme.rule('Grid', ['x']).setAll({ strokeOpacity: 0.05 });
      myTheme.rule('Grid', ['x', 'minor']).setAll({ strokeOpacity: 0.05 });

      root.setThemes([am5themes_Animated.new(root), myTheme]);

      const chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        maxTooltipDistance: 0,
        pinchZoomX: true,
        layout: root.verticalLayout
      }));

      const severityLevels = Object.keys(jsonData.data);
      const formattedData: { [key: string]: { date: number; count: number }[] } = {};
      severityLevels.forEach(level => {
        formattedData[level] = jsonData.data[level].map(item => ({
          date: new Date(item.date).getTime(),
          count: item.count
        }));
      });

      const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
        maxDeviation: 0.2,
        baseInterval: { timeUnit: 'day', count: 1 },
        groupData: true,
        groupCount: 100,
        renderer: am5xy.AxisRendererX.new(root, { minorGridEnabled: true }),
        tooltip: am5.Tooltip.new(root, {})
      }));

      const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      }));

      const colorList = [
        0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728,
        0x9467bd, 0x8c564b, 0xe377c2, 0x7f7f7f,
        0xbcbd22, 0x17becf, 0xaec7e8, 0xffbb78,
        0x98df8a, 0xff9896, 0xc5b0d5
      ];
      const colorArray = colorList.map(hex => am5.color(hex));

      severityLevels.forEach((level, i) => {
        const color = colorArray[i % colorArray.length];
        const series = chart.series.push(am5xy.LineSeries.new(root, {
          name: level,
          xAxis,
          yAxis,
          valueYField: 'count',
          valueXField: 'date',
          tooltip: am5.Tooltip.new(root, {
            pointerOrientation: 'horizontal',
            labelText: '{valueY}'
          }),
          stroke: color,
          fill: color,
        }));

        series.data.setAll(formattedData[level]);
        series.appear();
      });

      const cursor = chart.set('cursor', am5xy.XYCursor.new(root, {
        behavior: 'none'
      }));
      cursor.lineY.set('visible', false);

      chart.set('scrollbarX', am5.Scrollbar.new(root, { orientation: 'horizontal' }));
      chart.set('scrollbarY', am5.Scrollbar.new(root, { orientation: 'vertical' }));

      const legend = chart.rightAxesContainer.children.push(am5.Legend.new(root, {
        width: 150,
        paddingLeft: 10,
        height: am5.percent(100)
      }));

      legend.itemContainers.template.events.on('pointerover', function (e) {
        const series = e.target.dataItem?.dataContext;
        if (!series) return;
        
        chart.series.each(s => {
          if (s !== series) {
            s.strokes.template.setAll({ strokeOpacity: 0.15, stroke: am5.color(0x000000) });
          } else {
            s.strokes.template.setAll({ strokeWidth: 3 });
          }
        });
      });

      legend.itemContainers.template.events.on('pointerout', function () {
        chart.series.each(s => {
          s.strokes.template.setAll({
            strokeOpacity: 1,
            strokeWidth: 1,
            stroke: s.get('fill')
          });
        });
      });

      legend.itemContainers.template.set('width', am5.p100);
      legend.valueLabels.template.setAll({ width: am5.p100, textAlign: 'right' });

      legend.data.setAll(chart.series.values);

      const updateTotalDataCount = () => {
        let totalPoints = 0;
        severityLevels.forEach(level => {
          formattedData[level].forEach(item => {
            totalPoints += item.count;
          });
        });

      const dataCountEl = document.getElementById('dataCount');
      if (dataCountEl) {
        dataCountEl.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mr-2 inline-block -translate-y-[2px]">
            <g clip-path="url(#clip0_801_121732)">
              <path d="M9.25 17.5C9.25 17.5 8 17.5 8 16.25C8 15 9.25 11.25 14.25 11.25C19.25 11.25 20.5 15 20.5 16.25C20.5 17.5 19.25 17.5 19.25 17.5H9.25ZM14.25 10C15.2446 10 16.1984 9.60491 16.9017 8.90165C17.6049 8.19839 18 7.24456 18 6.25C18 5.25544 17.6049 4.30161 16.9017 3.59835C16.1984 2.89509 15.2446 2.5 14.25 2.5C13.2554 2.5 12.3016 2.89509 11.5983 3.59835C10.8951 4.30161 10.5 5.25544 10.5 6.25C10.5 7.24456 10.8951 8.19839 11.5983 8.90165C12.3016 9.60491 13.2554 10 14.25 10Z" fill="#0069CF"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M7.02 17.5C6.83469 17.1098 6.74228 16.6819 6.75 16.25C6.75 14.5562 7.6 12.8125 9.17 11.6C8.38636 11.3585 7.56994 11.2405 6.75 11.25C1.75 11.25 0.5 15 0.5 16.25C0.5 17.5 1.75 17.5 1.75 17.5H7.02Z" fill="#0069CF"/>
              <path d="M6.125 10C6.9538 10 7.74866 9.67076 8.33471 9.08471C8.92076 8.49866 9.25 7.7038 9.25 6.875C9.25 6.0462 8.92076 5.25134 8.33471 4.66529C7.74866 4.07924 6.9538 3.75 6.125 3.75C5.2962 3.75 4.50134 4.07924 3.91529 4.66529C3.32924 5.25134 3 6.0462 3 6.875C3 7.7038 3.32924 8.49866 3.91529 9.08471C4.50134 9.67076 5.2962 10 6.125 10Z" fill="#0069CF"/>
            </g>
            <defs>
              <clipPath id="clip0_801_121732">
                <rect width="20" height="20" fill="white" transform="translate(0.5)"/>
              </clipPath>
            </defs>
          </svg>
          ${totalPoints} Kasus
        `;
      }
      };

      updateTotalDataCount();
      chart.appear(1000, 100);

      return () => root.dispose();
    } catch (error) {
      console.error('Error initializing AmCharts:', error);
      // In test environment, we can silently fail
      return undefined;
    }
  }, [jsonData]);

  return (
    <div ref={containerRef} className="bg-white rounded-xl shadow-md p-4 w-full mx-auto"> {/* Reduced padding and border radius */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3"> {/* Reduced margin */}
        <div className="text-xl font-semibold text-[#0069CF]">Tingkatan Kasus</div> {/* Reduced font size */}
        <div className="flex items-center gap-3">
          <DownloadButton
            filename="tingkatan-kasus"
            getTarget={() => containerRef.current}
          />
          <div id="dataCount" className="text-xl font-semibold text-[#0069CF]"></div> {/* Reduced font size */}
        </div>
      </div>
      <div ref={chartRef} data-testid="chart-container" className="w-full h-[400px]" /> {/* Reduced height */}
    </div>
  );
}
