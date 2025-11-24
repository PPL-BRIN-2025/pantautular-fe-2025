import { useEffect, useMemo, useState } from "react";
import { mapApi } from "../services/api";
import { FilterState, MapLocation, SpatialComparisonItem, SpatialComparisonRegion } from "../types";

interface UseSpatialComparisonsParams {
  regions: SpatialComparisonRegion[];
  baseFilters: FilterState;
  enabled?: boolean;
  refreshToken?: number;
}

const normalizeDate = (value: FilterState["start_date"]) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
};

const normalizeFilter = (filters: FilterState) => ({
  ...filters,
  start_date: normalizeDate(filters.start_date),
  end_date: normalizeDate(filters.end_date),
  batch: filters.batch ?? null,
});

export const useSpatialComparisons = ({
  regions,
  baseFilters,
  enabled = true,
  refreshToken = 0,
}: UseSpatialComparisonsParams) => {
  const [comparisons, setComparisons] = useState<SpatialComparisonItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const normalizedFilter = useMemo(() => normalizeFilter(baseFilters), [baseFilters]);
  const filterSignature = useMemo(
    () => JSON.stringify(normalizedFilter),
    [normalizedFilter]
  );
  const regionSignature = useMemo(
    () => JSON.stringify(regions.map((region) => ({
      value: region.value,
      label: region.label,
      scope: region.scope || null,
    }))),
    [regions]
  );
  const isActive = enabled && regions.length > 0;

  useEffect(() => {
    if (!isActive) {
      setComparisons([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const payload = {
      regions: regions.map((region, index) => ({
        label: region.label || region.value || `Region ${index + 1}`,
        filters: {
          ...normalizedFilter,
          locations: {
            provinces: [region.value],
            cities: [region.value],
          },
        },
      })),
    };

    mapApi
      .getSpatialComparisons(payload)
      .then((response) => {
        if (cancelled) return;
        const payloadComparisons: SpatialComparisonItem[] = response?.comparisons || [];
        setComparisons(payloadComparisons);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to fetch spatial comparisons"));
        setComparisons([]);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filterSignature, regionSignature, refreshToken, isActive, normalizedFilter, regions]);

  return {
    comparisons,
    isLoading,
    error,
    lastUpdated,
  };
};

export type { SpatialComparisonRegion, SpatialComparisonItem, MapLocation };
