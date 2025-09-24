"use client";

/* eslint-disable sonarjs/cognitive-complexity */
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import StatCard from "./_components/StatCard";
import RolePills from "./_components/RolePills";
import UserInfo from "./_components/UserInfo";

/** === Auth helpers (SAME STYLE AS FEATURE 1) === */
type HeadersMap = Record<string, string>;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  // Try multiple common keys
  const keys = ["access_token", "token", "accessToken", "jwt"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }

  // Fallback: read from cookie named access_token
  const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);

  return null;
}

function authHeaders(): HeadersMap {
  const h: HeadersMap = { Accept: "application/json", "Content-Type": "application/json" };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/** === Page === */
export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [datasets, setDatasets] = useState(0);
  const [failedLogins, setFailedLogins] = useState(0);
  const [roles, setRoles] = useState<string[]>(["Admin", "Expert", "Kurator", "Contributor"]); // fallback
  const [usersMessage, setUsersMessage] = useState<string | undefined>();
  const [datasetsMessage, setDatasetsMessage] = useState<string | undefined>();
  const [activityMessage, setActivityMessage] = useState<string | undefined>();
  const [blocked403Detail, setBlocked403Detail] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!API_BASE) {
        console.warn("NEXT_PUBLIC_API_URL is not set. Using demo defaults for stats.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setBlocked403Detail(undefined);

        const res = await fetch(`${API_BASE}/admin-feature/stats`, {
          method: "GET",
          headers: authHeaders(),
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          // Unauthenticated → redirect to login (client-side, same UX as Feature 1 pages)
          const next = encodeURIComponent("/admin-dashboard");
          window.location.href = `/login?next=${next}`;
          return;
        }

        if (res.status === 403) {
          try {
            const blocked = await res.json();
            setBlocked403Detail(typeof blocked?.detail === "string" ? blocked.detail : "Akses Ditolak");
          } catch {
            setBlocked403Detail("Akses Ditolak");
          }
          return;
        }

        if (!res.ok) {
          let detail = "";
          try {
            detail = await res.text();
          } catch {}
          console.error(`Admin stats HTTP error: ${res.status}${detail ? " | " + detail : ""}`);
          return;
        }

        const data = await res.json();

        setTotalUsers(data?.totalUsers ?? data?.total_users ?? data?.users ?? 0);
        setActiveUsers(data?.activeUsers ?? data?.active_users ?? 0);
        setDatasets(data?.datasets ?? data?.datasets_count ?? data?.dataset ?? 0);
        setFailedLogins(data?.failedLogins ?? data?.failed_logins ?? data?.failed ?? 0);
        if (Array.isArray(data?.roles) && data.roles.length > 0) setRoles(data.roles);

        const msgs = data?.messages || {};
        setUsersMessage(data?.usersMessage || msgs?.usersMessage || msgs?.users);
        setDatasetsMessage(data?.datasetsMessage || msgs?.datasetsMessage || msgs?.datasets);
        setActivityMessage(data?.activityMessage || msgs?.activityMessage || msgs?.activity);
      } catch (e) {
        console.error("Failed to fetch admin stats:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (blocked403Detail) {
    return (
      <main className={styles.container}>
        <div className={styles.card} role="alert" aria-live="polite">
          <div className={styles.cardLabel}>Informasi Akses</div>
          <div className={styles.cardValue} style={{ fontSize: 24 }}>
            {blocked403Detail}
          </div>
          <div className={styles.hint} style={{ marginTop: 8 }}>
            Anda tidak memiliki izin untuk mengakses halaman ini. Silakan kembali atau login sebagai admin.
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Link href="/" className={styles.buttonSecondary}>
              Kembali
            </Link>
            <Link href="/login?next=/admin-dashboard" className={styles.buttonPrimary}>
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      {/* User Info Component → Display logged-in admin’s name & role */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <UserInfo />
      </div>

      {/* Top stat cards */}
      <section className={styles.topGrid}>
        <StatCard
          label={loading ? "Total Users (loading…)" : "Total Users"}
          value={totalUsers}
          icon={<span>👥</span>}
          hint={usersMessage}
        />
        <StatCard
          label={loading ? "Datasets (loading…)" : "Datasets"}
          value={datasets}
          icon={<span>📁</span>}
          hint={datasetsMessage}
        />

        <div className={styles.card}>
          <div className={styles.cardLabel}>Role Defined</div>
          <div className={styles.roleCount}>{roles.length}</div>
          <RolePills roles={roles} />
        </div>
      </section>

      {/* Summary row with actions */}
      <section className={styles.summaryWrapper}>
        <div className={styles.summaryHeader}>
          <div className={styles.summaryTitle}>Ringkasan Sistem</div>
          <div className={styles.actions}>
            <Link href="/admin-dashboard/logs" className={styles.buttonSecondary}>
              See Log
            </Link>
            <Link href="/admin-dashboard/roles" className={styles.buttonPrimary}>
              Manage Role
            </Link>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardLabel}>Total Active Users</div>
            <div className={styles.summaryRow}>
              <div className={styles.iconLarge}>👥</div>
              <div className={styles.summaryValue}>{activeUsers}</div>
            </div>
            {/* Keep your test hint line if needed */}
            <div className={styles.summaryNote}>Estimasi, demo stat.</div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryCardLabel}>Failed Login</div>
            <div className={styles.summaryRow}>
              <div className={styles.iconLarge}>👥</div>
              <div className={styles.summaryValue}>{failedLogins}</div>
            </div>
            {activityMessage ? (
              <div className={styles.hint}>{activityMessage}</div>
            ) : (
              <Link href="/admin-dashboard/logs" className={styles.linkSmall}>
                See on User Log Page
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Bottom navigation shortcuts */}
      <nav className={styles.bottomNav}>
        <span>Navigation: </span>
        <Link href="/admin-dashboard/roles" className={styles.navLink}>
          Role Management
        </Link>
        <span className={styles.dot}>•</span>
        <Link href="/admin-dashboard/logs" className={styles.navLink}>
          User Log
        </Link>
      </nav>
    </main>
  );
}
