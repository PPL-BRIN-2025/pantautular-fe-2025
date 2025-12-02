"use client";

/* eslint-disable sonarjs/cognitive-complexity */
import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import StatCard from "./_components/StatCard";
import RolePills from "./_components/RolePills";
import UserInfo from "./_components/UserInfo";
import { API_BASE, API_BASE_RAW } from '../../config';
import { getToken, authHeaders, pickMessage } from './testables';
import Footer from "../components/Footer";

const UsersIcon = (
  <svg className={styles.iconGlyph} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2.5c-3.33 0-6 1.34-6 3v.75c0 .41.34.75.75.75h10.5c.41 0 .75-.34.75-.75V17.5c0-1.66-2.67-3-6-3Z"
      fill="currentColor"
    />
  </svg>
);

const DatasetIcon = (
  <svg className={styles.iconGlyph} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6.5 4.25A1.25 1.25 0 0 1 7.75 3h6.63c.33 0 .65.13.88.37l3.37 3.37c.23.23.37.55.37.88V18.5A2.5 2.5 0 0 1 16.5 21h-8A2.5 2.5 0 0 1 6 18.5v-14Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M14 3.5V5.5c0 .55.45 1 1 1h2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 12h7M8.5 15h7M8.5 9H11"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const warnWhenApiBaseMissing = () => {
  const configured = typeof API_BASE_RAW === "string" && API_BASE_RAW.trim() !== "";
  if (!configured) {
    console.warn("NEXT_PUBLIC_API_URL is not set. Using demo defaults for stats.");
  }
};

warnWhenApiBaseMissing();

/** === Auth helpers (SAME STYLE AS FEATURE 1) === */
type HeadersMap = Record<string, string>;

// test helpers are extracted to `./testables` so they can be imported by
// tests without exporting test-only named exports from the Next.js page.

/** === Page === */
export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [datasets, setDatasets] = useState(0);
  const [roles, setRoles] = useState<string[]>(["Admin", "Expert", "Kurator", "Kontributor"]); // fallback
  const [usersMessage, setUsersMessage] = useState<string | undefined>();
  const [datasetsMessage, setDatasetsMessage] = useState<string | undefined>();
  const [blocked403Detail, setBlocked403Detail] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!API_BASE) {
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
        setDatasets(data?.datasets ?? data?.datasets_count ?? data?.dataset ?? 0);
        if (Array.isArray(data?.roles) && data.roles.length > 0) setRoles(data.roles);

        const msgs = data?.messages as Record<string, string> | undefined;

        setUsersMessage(pickMessage(data?.usersMessage, msgs?.usersMessage, msgs?.users));
        setDatasetsMessage(pickMessage(data?.datasetsMessage, msgs?.datasetsMessage, msgs?.datasets));
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
        <div className={`${styles.card} ${styles.alertCard}`} role="alert" aria-live="polite">
          <div className={styles.cardLabel}>Informasi Akses</div>
          <div className={styles.cardValue} style={{ fontSize: 24 }}>Akses Ditolak</div>
          <p className={styles.hint}>
            Anda tidak memiliki izin untuk mengakses halaman ini. Silakan kembali atau masuk sebagai admin.
          </p>
          {blocked403Detail !== "Akses Ditolak" && (
            <p className={styles.hint} style={{ marginTop: 6 }}>
              {blocked403Detail}
            </p>
          )}
          <div className={styles.actions} style={{ marginTop: 14 }}>
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
    <>
      <main className={styles.container}>
        <div className={styles.pageShell}>
          <header className={styles.headerCard}>
            <div className={styles.badge}>Dashboard Admin</div>
            <div className={styles.headerContent}>
              <div className={styles.headerText}>
                <h1 className={styles.title}>PantauTular Admin</h1>
                <p className={styles.subtitle}>Kelola akses dan pantau metrik utama platform.</p>
                <div className={styles.metaRow}>
                  <span className={styles.metaTag}>Realtime insight</span>
                  <span className={styles.metaTag}>Perlindungan data</span>
                </div>
              </div>
              <div className={styles.actions}>
                <Link href="/admin-user-log-menu/" className={styles.buttonSecondary}>
                  Lihat Log
                </Link>
                <Link href="/admin-role-management/" className={styles.buttonPrimary}>
                  Kelola Role
                </Link>
              </div>
            </div>
          </header>

          {/* Top stat cards */}
          <section className={styles.topGrid} aria-label="Metrik utama admin">
            <StatCard
              label={loading ? "Jumlah Pengguna (Memuat�)" : "Jumlah Pengguna"}
              value={totalUsers}
              icon={UsersIcon}
              hint={usersMessage}
            />
            <StatCard
              label={loading ? "Jumlah Dataset (Memuat�)" : "Jumlah Dataset"}
              value={datasets}
              icon={DatasetIcon}
              hint={datasetsMessage}
            />

            <div className={styles.card}>
              <div className={styles.cardLabel}>Roles</div>
              <div className={styles.roleCount}>{roles.length}</div>
              <RolePills roles={roles} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
