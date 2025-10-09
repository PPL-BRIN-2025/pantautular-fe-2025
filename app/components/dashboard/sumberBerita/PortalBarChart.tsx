/*istanbul ignore file */
"use client";
import { DistributionData } from '@/types';
import React, { useEffect, useRef, useId, useContext } from 'react';
import { exportChartAndLog } from "../../../../curator-feature/export/exporter";
import { toast } from "../../../../curator-feature/ui/ToastCenter";
import { AuthContext } from "../../../auth/context";

interface PortalData {
  portal: string;
  count: number;
}

interface PortalBarChartProps {
  title: string;
  data: PortalData[];
  detailData?: DistributionData[]; // Add detailed data (all_national, all_local, etc.)
  onViewDetails?: (title: string, detailData: DistributionData[]) => void; // Callback for the button
  index?: number; // Add index prop to ensure uniqueness
}

// Utility functions moved outside of the component
// Get color for a data item based on index
const getItemColor = (index: number, colors: string[], am5: any) => {
  return am5.color(colors[index % colors.length]);
};

// Process and map the data with colors
const prepareChartData = (data: PortalData[], colors: string[], am5: any) => {
  return data.map((item, idx) => ({
    source: item.portal,
    value: item.count,
    color: getItemColor(idx, colors, am5)
  }));
};

// Prepare data with column settings for colors
const prepareSeriesData = (chartData: any[]) => {
  return chartData.map((item) => ({
    ...item,
    columnSettings: {
      fill: item.color,
    },
  }));
};

// X-axis label visibility adapter - only show integer values
// Moved outside to reduce nesting
export const labelVisibilityAdapter = (visible: boolean, target: any) => {
  const value = target.dataItem?.get("value") ?? 0;
  // Only show label if it's an integer
  return visible && Math.abs(value - Math.round(value)) < 0.01;
};

// Grid line visibility adapter - only show at integer values and zero
// Moved outside to reduce nesting
export const gridVisibilityAdapter = (visible: boolean, target: any) => {
  const value = target.dataItem?.get("value") ?? 0;

  // Always show the first grid line (at 0)
  if (Math.abs(value) < 0.01) {
    return true;
  }

  // For other values, only show grid lines at integer values
  return visible && Math.abs(value - Math.round(value)) < 0.01;
};

// Grid line stroke style adapter - different styles based on position
// Moved outside to reduce nesting
export const gridStrokeAdapter = (strokeDasharray: number[], target: any) => {
  if (!target.dataItem) return [2, 2];
  const value = target.dataItem?.get("value") ?? 0;

  // Make the first grid line (at 0) solid
  if (Math.abs(value) < 0.01) {
    return [];
  }

  // Make other integer grid lines dashed
  return [2, 2];
};

const PortalBarChart: React.FC<PortalBarChartProps> = ({ 
  title, 
  data, 
  detailData = [],  // Default to empty array if not provided
  onViewDetails,
  index = 0 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId(); // Generate unique ID for each chart
  const auth = useContext(AuthContext);

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

        // Process data using the utility functions
        const chartData = prepareChartData(data, colors, am5);

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

        // Create X-axis with integer values only
        const xAxis = chart.xAxes.push(
          am5xy.ValueAxis.new(root, {
            min: 0,
            maxDeviation: 0,
            renderer: am5xy.AxisRendererX.new(root, {
              minGridDistance: 40,
            }),
          })
        );

        // Properly format X-axis to only show integer values
        xAxis.set("numberFormat", "#");

        // Configure axis to only show integer labels
        const renderer = xAxis.get("renderer");
        
        // Apply adapters to the renderer - using externally defined functions
        renderer.labels.template.adapters.add("visible", labelVisibilityAdapter);
        renderer.grid.template.adapters.add("visible", gridVisibilityAdapter);
        renderer.grid.template.adapters.add("strokeDasharray", gridStrokeAdapter);

        // Set base style for X-axis grid lines
        renderer.grid.template.setAll({
          visible: true,
          stroke: am5.color("#e0e0e0"),
          strokeOpacity: 1,
          strokeWidth: 1
        });

        // Set smaller font size for X-axis labels
        xAxis.get("renderer").labels.template.setAll({
          fontSize: 10,
          fontWeight: "400",
        });

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
            fontSize: 12,
            fontWeight: "400",
            fill: am5.color("#333333")
          });
        }

        // Make bars narrower when fewer data points
        let barHeight;
        if (data.length <= 3) {
          barHeight = am5.percent(40);
        } else if (data.length <= 5) {
          barHeight = am5.percent(60);
        } else {
          barHeight = am5.percent(70);
        }

        // Configure columns - ensure no stroke/border and set width based on data count
        series.columns.template.setAll({
          cornerRadiusTR: 5,
          cornerRadiusBR: 5,
          cornerRadiusTL: 5,
          cornerRadiusBL: 5,
          tooltipText: "{valueX} Artikel",
          fillOpacity: 0.8,
          templateField: "columnSettings",
          height: barHeight,
          strokeOpacity: 0,
          strokeWidth: 0, 
          stroke: null
        });

        // Prepare series data using the utility function
        const seriesData = prepareSeriesData(chartData);

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

  // Calculate chart height based on data items - maintain minimum height
  const chartHeight = data.length > 0 
    ? `${Math.max(250, 50 * data.length)}px` 
    : "250px";

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-semibold text-[#0069CF]">{title}</h3>
        <div className="flex gap-2">
          <button 
            className="bg-[#0069CF] text-white text-sm py-2 px-4 rounded-[10px] flex items-center font-medium"
            onClick={() => onViewDetails ? onViewDetails(title, detailData) : console.log(`View details for ${title}`)}
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
          <button 
            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-sm py-2 px-4 rounded-[10px] font-medium"
            aria-label="Download chart image"
            onClick={async () => {
              const el = chartRef.current;
              const am5 = (window as any).am5;
              const root = am5?.Root?.new ? am5.Root.new(el) : null;
              await exportChartAndLog({
                element: el!,
                chartType: "portal-bar",
                fileName: title.replace(/\s+/g, "_"),
                imageType: "png",
                hasData: data.length > 0,
                getRoot: () => root,
                username: auth?.user?.name ?? null,
                notify: (t, m) => toast(t, m),
              });
            }}
          >
            Download
          </button>
        </div>
      </div>
      
      {data.length > 0 ? (
        <div ref={chartRef} className="w-full" style={{ height: chartHeight }}></div>
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
