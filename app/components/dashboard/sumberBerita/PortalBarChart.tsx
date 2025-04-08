"use client";
import React, { useEffect, useRef, useId } from 'react';

interface PortalData {
  portal: string;
  count: number;
}

interface PortalBarChartProps {
  title: string;
  data: PortalData[];
  index?: number; // Add index prop to ensure uniqueness
}

const PortalBarChart: React.FC<PortalBarChartProps> = ({ title, data, index = 0 }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId(); // Generate unique ID for each chart
  const chartId = `chart-${uniqueId}-${index}`;

  // Color palette for the charts
  const colors = ["#ec848c", "#feb272", "#fecba1", "#ffe69c", "#e3efe8"];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip chart initialization if there's no data
    if (data.length === 0) return;

    // Add a small delay based on index to prevent race conditions
    const delay = index * 100;

    const timer = setTimeout(() => {
      // Load AmCharts libraries
      const loadAmCharts = async () => {
        const am5 = (window as any).am5;
        const am5xy = (window as any).am5xy;
        const am5themes_Animated = (window as any).am5themes_Animated;

        // Make sure libraries are loaded
        if (!am5 || !am5xy || !am5themes_Animated) return;

        // Create root element - use a unique ID for each chart
        let root = am5.Root.new(chartRef.current);

        // Set themes
        root.setThemes([am5themes_Animated.new(root)]);

        // Create chart
        const chart = root.container.children.push(
          am5xy.XYChart.new(root, {
            panX: false,
            panY: false,
            wheelX: "none",
            wheelY: "none",
            layout: root.verticalLayout,
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
          })
        );

        // Get color for the data item
        const getItemColor = (index: number, am5: any) => {
          return am5.color(colors[index % colors.length]);
        };

        // Process and map the data with colors
        const chartData = data.map((item, idx) => ({
          source: item.portal,
          value: item.count,
          color: getItemColor(idx, am5)
        }));

        // Create Y-axis
        const yAxis = chart.yAxes.push(
          am5xy.CategoryAxis.new(root, {
            categoryField: "source",
            renderer: am5xy.AxisRendererY.new(root, {
              inversed: true,
              cellStartLocation: 0.02,
              cellEndLocation: 0.98,
              minGridDistance: 20,
            }),
          })
        );

        // Set smaller font size for Y-axis labels
        yAxis.get("renderer").labels.template.setAll({
          fontSize: 10,
          fontWeight: "400",
        });

        // Remove grid lines from Y-axis
        yAxis.get("renderer").grid.template.set("visible", false);

        yAxis.data.setAll(chartData);

        // Create X-axis
        const xAxis = chart.xAxes.push(
          am5xy.ValueAxis.new(root, {
            min: 0,
            renderer: am5xy.AxisRendererX.new(root, {
              minGridDistance: 30,
            }),
          })
        );

        // Set smaller font size for X-axis labels
        xAxis.get("renderer").labels.template.setAll({
          fontSize: 10,
          fontWeight: "400",
        });

        // Remove grid lines from X-axis
        xAxis.get("renderer").grid.template.set("visible", false);

        // Create series
        const series = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name: "Jumlah Berita",
            xAxis: xAxis,
            yAxis: yAxis,
            valueXField: "value",
            categoryYField: "source",
            sequencedInterpolation: true,
            clustered: false,
            tooltip: am5.Tooltip.new(root, {
              labelText: "{valueX} Artikel"
            })
          })
        );

        // Style the tooltip with our custom color
        if (series.get("tooltip")) {
          series.get("tooltip").label.setAll({
            fontSize: 9,
            fontWeight: "400",
            fill: am5.color("#333333")
          });
        }

        // Configure columns
        series.columns.template.setAll({
          cornerRadiusTR: 5,
          cornerRadiusBR: 5,
          cornerRadiusTL: 5,
          cornerRadiusBL: 5,
          tooltipText: "{valueX} Artikel",
          fillOpacity: 0.8,
          templateField: "columnSettings",
          height: am5.percent(70),
          strokeWidth: 0,
          stroke: null,
        });

        // Prepare data with column settings for colors
        const seriesData = chartData.map((item) => ({
          ...item,
          columnSettings: {
            fill: item.color,
          },
        }));
        
        // Set the prepared data to the series
        series.data.setAll(seriesData);

        // Add animations
        series.appear(1000);
        chart.appear(1000, 100);

        // Store the root in the ref for cleanup
        return root;
      };

      let root: any;
      loadAmCharts().then(r => {
        root = r;
      });

      // Cleanup function
      return () => {
        if (root) {
          root.dispose();
        }
      };
    }, delay);

    return () => clearTimeout(timer);
  }, [data, colors, index, uniqueId]);

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">{title}</h2>
        <button 
          className="bg-[#0069CF] text-white text-sm py-2 px-4 rounded-[10px] flex items-center font-medium"
          onClick={() => console.log(`View details for ${title}`)}
        >
          <span>Lihat Detail</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 ml-1.5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      </div>
      
      {data.length > 0 ? (
        <div ref={chartRef} className="w-full h-[250px]"></div>
      ) : (
        <div className="w-full h-[250px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-base font-medium">Tidak ada data yang sesuai</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalBarChart;