"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import FilterSection from "../components/dashboard/FilterSection";
import InformationSection from "../components/dashboard/InformationSection";
import AccessDeniedNotice from "./_components/AccessDenied";
import { useAuth } from "../auth/hooks/useAuth";
import type { FilterState, FilterStateDashboard, User } from "@/types";

type AccessState = "loading" | "redirect" | "forbidden" | "granted";

const ALLOWED_ROLES = new Set(["ADMIN", "CURATOR"]);

const normalizeRole = (role?: string | null) => (role ? role.trim().toUpperCase() : "");

export default function CuratorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filterState, setFilterState] = useState<FilterState | undefined>(undefined);
  const [effectiveUser, setEffectiveUser] = useState<User | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessState, setAccessState] = useState<AccessState>("loading");

  useEffect(() => {
    // Attempt to recover persisted user data to avoid redirect flicker.
    let resolvedUser = user;
    if (!resolvedUser && typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("user");
        if (stored) {
          resolvedUser = JSON.parse(stored) as User;
        }
      } catch (error) {
        console.warn("Failed to parse stored user information", error);
      }
    }
    setEffectiveUser(resolvedUser ?? null);
    setIsCheckingAccess(false);
  }, [user]);

  useEffect(() => {
    if (isCheckingAccess) {
      return;
    }

    if (!effectiveUser) {
      setAccessState("redirect");
      return;
    }

    const role = normalizeRole(effectiveUser.role);
    if (!ALLOWED_ROLES.has(role)) {
      setAccessState("forbidden");
      return;
    }

    setAccessState("granted");
  }, [effectiveUser, isCheckingAccess]);

  useEffect(() => {
    if (accessState !== "redirect") {
      return;
    }

    const nextParam = encodeURIComponent("/curator-dashboard");
    router.replace(`/login?next=${nextParam}`);
  }, [accessState, router]);

  const handleFilterSubmit = (filters: FilterStateDashboard) => {
    const flatLocations = [
      ...(filters.locations.provinces ?? []),
      ...(filters.locations.cities ?? []),
    ];
    const converted: FilterState = {
      diseases: filters.diseases,
      locations: flatLocations,
      level_of_alertness: filters.level_of_alertness,
      portals: filters.portals,
      start_date: filters.start_date,
      end_date: filters.end_date,
    };
    setFilterState(converted);
  };

  const handleError = (message: string) => {
    console.error(message);
  };

  if (accessState === "loading" || accessState === "redirect") {
    return (
      <div className="min-h-screen bg-[#ebf3f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-4 pt-24">
          <span className="text-sm text-[#0f172a]">Memeriksa akses…</span>
        </div>
      </div>
    );
  }

  if (accessState === "forbidden") {
    return (
      <div className="min-h-screen bg-[#ebf3f5]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-4 pt-24">
          <AccessDeniedNotice />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ebf3f5]">
      <Navbar />
      <div className="h-full flex w-full gap-5 pt-24">
        <div className="w-2/5 bg-transparent">
          <FilterSection onSubmitFilterState={handleFilterSubmit} onError={handleError} />
        </div>
        <div className="w-3/5 bg-transparent">
          <InformationSection filterState={filterState} />
        </div>
      </div>
    </div>
  );
}
