// hooks/useDashboardData.ts
"use client";
import { useEffect, useState } from "react";
import { FilterState } from "../types";
import { mapApi } from "../services/api";

export const useDashboardData = (filters?: FilterState) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // pass the filters (or undefined) to getDashboardData
        const result = await mapApi.getDashboardData(filters);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, isLoading, error };
};
