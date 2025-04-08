'use client';

import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

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
          totalPoints += formattedData[level].length;
        });

        const dataCountEl = document.getElementById('dataCount');
        if (dataCountEl) {
          dataCountEl.innerHTML = `
            <img src="https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/emoji_u1f465.svg" alt="people" class="w-5 h-5 inline-block -translate-y-[3px]" />
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
    <div className="bg-white rounded-xl shadow-md p-4 w-full mx-auto"> {/* Reduced padding and border radius */}
      <div className="flex justify-between items-center mb-3"> {/* Reduced margin */}
        <div className="text-xl font-semibold text-[#0069CF]">Tingkatan Kasus</div> {/* Reduced font size */}
        <div id="dataCount" className="text-xl font-semibold text-[#0069CF]"></div> {/* Reduced font size */}
      </div>
      <div ref={chartRef} data-testid="chart-container" className="w-full h-[400px]" /> {/* Reduced height */}
    </div>
  );
}