"use client";

import { useEffect, useMemo, useState } from "react";
import Select, { components, MultiValue } from "react-select";
import { IndonesiaMap } from "../IndonesiaMap";
import { useSpatialComparisons, SpatialComparisonRegion } from "../../../hooks/useSpatialComparisons";
import { FilterState, ProvinceData, SpatialComparisonItem } from "../../../types";
import { MapChartService } from "../../../services/mapChartService";

interface SpatialComparisonPanelProps {
  baseFilters: FilterState;
  refreshToken: number;
  onError: (message: string) => void;
  provinceHumidityData: ProvinceData[];
  provinceTemperatureData: ProvinceData[];
  provincePrecipitationData: ProvinceData[];
  provinceSeverityData: ProvinceData[];
  initialRegions?: SpatialComparisonRegion[];
  maxRegions?: number;
  overlayMode?: boolean;
  onClose?: () => void;
}

type MetricOption = "cases" | "precipitation" | "humidity" | "temperature" | "severity";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const Group = (props: any) => (
  <div>
    <components.Group {...props}>
      <div className="px-2 py-1 bg-gray-100 text-sm font-medium">
        {props.label}
      </div>
      {props.children}
    </components.Group>
  </div>
);

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("id-ID");
};

const ComparisonCard = ({
  comparison,
  index,
  provinceHumidityData,
  provinceTemperatureData,
  provincePrecipitationData,
  provinceSeverityData,
  onError,
  lastUpdated,
}: {
  comparison: SpatialComparisonItem;
  index: number;
  provinceHumidityData: ProvinceData[];
  provinceTemperatureData: ProvinceData[];
  provincePrecipitationData: ProvinceData[];
  provinceSeverityData: ProvinceData[];
  onError: (message: string) => void;
  lastUpdated: Date | null;
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricOption>("cases");
  const [mapService, setMapService] = useState<MapChartService | null>(null);

  const applyMetric = (metric: MetricOption, service?: MapChartService | null) => {
    if (!service) return;
    switch (metric) {
      case "precipitation":
        service.showPrecipitationLayer();
        break;
      case "humidity":
        service.showHumidityLayer();
        break;
      case "temperature":
        service.showTemperatureLayer();
        break;
      case "severity":
        service.showSeverityLayer();
        break;
      default:
        service.hideAllLayers();
    }
  };

  useEffect(() => {
    applyMetric(selectedMetric, mapService);
  }, [selectedMetric, mapService]);

  return (
    <div className="bg-white rounded-lg shadow-md p-3 space-y-3" data-testid="comparison-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">Wilayah {index + 1}</p>
          <h3 className="text-lg font-semibold text-gray-900">{comparison.label}</h3>
          <p className="text-sm text-gray-600">{comparison.count} titik kasus</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Terakhir diperbarui</p>
          <p className="font-semibold">{lastUpdated ? lastUpdated.toLocaleTimeString("id-ID") : "-"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-700">Layer metrik</label>
        <select
          className="border rounded px-2 py-1 text-sm flex-1"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as MetricOption)}
          data-testid="metric-select"
        >
          <option value="cases">Kasus</option>
          <option value="severity">Keparahan</option>
          <option value="temperature">Temperatur</option>
          <option value="humidity">Kelembaban</option>
          <option value="precipitation">Curah Hujan</option>
        </select>
      </div>
      <div className="h-80 rounded-md overflow-hidden border border-gray-200">
        <IndonesiaMap
          mapId={`comparison-map-${index}`}
          locations={comparison.locations}
          provinceHumidityData={provinceHumidityData}
          provincePrecipitationData={provincePrecipitationData}
          provinceTemperatureData={provinceTemperatureData}
          provinceSeverityData={provinceSeverityData}
          config={{ zoomLevel: 2, centerPoint: { longitude: 113.9213, latitude: 0.7893 } }}
          width="100%"
          height="320px"
          onError={onError}
          shareStore={false}
          syncStore={false}
          showMapChrome={false}
          onMapReady={(service) => {
            setMapService(service);
            applyMetric(selectedMetric, service);
          }}
        />
      </div>
    </div>
  );
};

export default function SpatialComparisonPanel({
  baseFilters,
  refreshToken,
  onError,
  provinceHumidityData,
  provinceTemperatureData,
  provincePrecipitationData,
  provinceSeverityData,
  initialRegions = [],
  maxRegions,
  overlayMode = false,
  onClose,
}: SpatialComparisonPanelProps) {
  const [regionOptions, setRegionOptions] = useState<SpatialComparisonRegion[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<SpatialComparisonRegion[]>(initialRegions);
  const [regionA, setRegionA] = useState<SpatialComparisonRegion | null>(initialRegions[0] || null);
  const [regionB, setRegionB] = useState<SpatialComparisonRegion | null>(initialRegions[1] || null);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRegions(initialRegions);
    setRegionA(initialRegions[0] || null);
    setRegionB(initialRegions[1] || null);
  }, [initialRegions]);

  const reconcileOption = (current: SpatialComparisonRegion | null) => {
    if (!current) return null;
    const found = regionOptions.find((opt) => opt.value === current.value);
    return found || current;
  };

  const findOption = (option: SpatialComparisonRegion | null) => {
    if (!option) return null;
    const existing = regionOptions.find((opt) => opt.value === option.value);
    return existing || option;
  };

  useEffect(() => {
    setRegionA((prev) => reconcileOption(prev));
    setRegionB((prev) => reconcileOption(prev));
  }, [regionOptions]);

  useEffect(() => {
    let isActive = true;
    const fetchOptions = async () => {
      setIsLoadingFilters(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/filters/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
        });

        if (!response.ok) {
          throw new Error("Gagal memuat daftar wilayah");
        }

        const payload = await response.json();
        if (!isActive) return;

        const normalizeOption = (item: any, scope: "province" | "city"): SpatialComparisonRegion => {
          const value = item?.value || item?.label || item?.name || "";
          const label = item?.label || item?.name || item?.value || value;
          return { value, label, scope };
        };

        const provinces: SpatialComparisonRegion[] = (payload.data?.locations?.provinces || [])
          .map((item: any) => normalizeOption(item, "province"))
          .filter((opt: SpatialComparisonRegion) => Boolean(opt.value));
        const cities: SpatialComparisonRegion[] = (payload.data?.locations?.cities || [])
          .map((item: any) => normalizeOption(item, "city"))
          .filter((opt: SpatialComparisonRegion) => Boolean(opt.value));
        setRegionOptions([...provinces, ...cities]);
        setFiltersError(null);
      } catch (err) {
        console.error("Failed to fetch spatial comparison filters", err);
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Gagal memuat daftar wilayah";
        setFiltersError(message);
        onError(message);
      } finally {
        if (isActive) {
          setIsLoadingFilters(false);
        }
      }
    };

    fetchOptions();

    return () => {
      isActive = false;
    };
  }, [onError]);

  const groupedOptions = useMemo(
    () => [
      {
        label: "Provinsi",
        options: regionOptions.filter((option) => option.scope === "province"),
      },
      {
        label: "Kota/Kabupaten",
        options: regionOptions.filter((option) => option.scope === "city"),
      },
    ],
    [regionOptions]
  );

  const {
    comparisons,
    isLoading,
    error: comparisonError,
    lastUpdated,
  } = useSpatialComparisons({
    regions: selectedRegions,
    baseFilters,
    refreshToken,
    enabled: selectedRegions.length >= 2,
  });

  const filterSummary = useMemo(() => {
    const summary: string[] = [];
    if (baseFilters.diseases.length) summary.push(`Penyakit: ${baseFilters.diseases.join(", ")}`);
    if (baseFilters.portals.length) summary.push(`Portal: ${baseFilters.portals.join(", ")}`);
    if (baseFilters.level_of_alertness) summary.push(`Kewaspadaan: ${baseFilters.level_of_alertness}`);
    const start = formatDate(baseFilters.start_date);
    const end = formatDate(baseFilters.end_date);
    if (start || end) summary.push(`Rentang: ${start || "-"} - ${end || "-"}`);
    if (baseFilters.batch) summary.push(`Batch: ${baseFilters.batch}`);
    return summary.length ? summary.join(" • ") : "Tidak ada filter tambahan";
  }, [baseFilters]);

  const handleApplySelection = () => {
    const regionsToApply = [regionA, regionB].filter((item): item is SpatialComparisonRegion => Boolean(item && item.value));
    const limited = maxRegions ? regionsToApply.slice(0, maxRegions) : regionsToApply;
    setSelectedRegions(limited);
  };
  const handleResetSelection = () => {
    setRegionA(null);
    setRegionB(null);
    setSelectedRegions([]);
  };

  const statusMessage = (() => {
    if (comparisonError) {
      return comparisonError.message;
    }
    if (filtersError) {
      return filtersError;
    }
    if (isLoadingFilters) {
      return "Memuat daftar wilayah...";
    }
    if (selectedRegions.length < 2) {
      return "Pilih minimal dua wilayah untuk membandingkan peta secara berdampingan.";
    }
    if (isLoading) {
      return "Menyiapkan perbandingan spasial...";
    }
    if (!comparisons.length) {
      return "Tidak ada data untuk filter yang dipilih.";
    }
    return null;
  })();

  return (
    <section className={`max-w-6xl ${overlayMode ? "" : "mx-auto"} space-y-4`} data-testid="spatial-comparison-panel">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Perbandingan Spasial</p>
          <h2 className="text-2xl font-bold text-gray-900">Render peta berdampingan</h2>
          <p className="text-sm text-gray-600">Filter global tersinkron otomatis ke seluruh peta.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600 bg-white shadow rounded-lg p-3">
            <p className="font-semibold text-gray-800">Ringkasan filter</p>
            <p>{filterSummary}</p>
          </div>
          {onClose ? (
            <button
              type="button"
              className="text-xs border rounded-md px-3 py-2 bg-white shadow"
              onClick={onClose}
              data-testid="close-spatial-panel"
            >
              Tutup
            </button>
          ) : null}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1 min-w-[260px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah 1</label>
            <Select
              isDisabled={isLoadingFilters}
              options={groupedOptions}
              value={findOption(regionA)}
              onChange={(val) => setRegionA(findOption(val as SpatialComparisonRegion))}
              className="text-sm"
              components={{ Group }}
              placeholder="Pilih provinsi atau kota"
              data-testid="region-a-select"
            />
          </div>
          <div className="flex-1 min-w-[260px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah 2</label>
            <Select
              isDisabled={isLoadingFilters}
              options={groupedOptions}
              value={findOption(regionB)}
              onChange={(val) => setRegionB(findOption(val as SpatialComparisonRegion))}
              className="text-sm"
              components={{ Group }}
              placeholder="Pilih provinsi atau kota"
              data-testid="region-b-select"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleResetSelection}
              data-testid="reset-region-selection"
            >
              Reset wilayah
            </button>
            <button
              type="button"
              className="bg-blue-600 text-white rounded-md px-3 py-2 text-sm hover:bg-blue-700"
              onClick={handleApplySelection}
              data-testid="refresh-comparison"
            >
              Sinkronkan filter
            </button>
          </div>
        </div>
        {statusMessage && (
          <div className="text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md p-3" data-testid="comparison-status">
            {statusMessage}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparisons.map((item, idx) => (
            <ComparisonCard
              key={`${item.label}-${idx}`}
              comparison={item}
              index={idx}
              provinceHumidityData={provinceHumidityData}
              provinceTemperatureData={provinceTemperatureData}
              provincePrecipitationData={provincePrecipitationData}
              provinceSeverityData={provinceSeverityData}
              onError={onError}
              lastUpdated={lastUpdated}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
