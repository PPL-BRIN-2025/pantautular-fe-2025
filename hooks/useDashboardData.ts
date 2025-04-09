"use client";

import { useEffect, useState } from "react";
import { mapApi } from "../services/api";

export const useDashboardData = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await mapApi.getDashboardData();
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
};