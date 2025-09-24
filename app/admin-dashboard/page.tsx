// app/admin-dashboard/page.tsx
/* eslint-disable sonarjs/cognitive-complexity */
import Link from "next/link";
import styles from "./page.module.css";
import StatCard from "./_components/StatCard";
import RolePills from "./_components/RolePills";
import UserInfo from "./_components/UserInfo";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  // Stats Binding → Connect FE components (numbers in cards) to backend API.
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  let totalUsers = 0;
  let datasets = 0;
  let failedLogins = 0;
  let roles: string[] = ["Admin", "Expert", "Kurator", "Contributor"]; // fallback
  let usersMessage: string | undefined;
  let datasetsMessage: string | undefined;
  let activityMessage: string | undefined;
  let blocked403Detail: string | undefined;

  if (API_BASE_URL) {
    try {
  // Forward incoming cookies to the backend (for httpOnly session/JWT cookies)
  const reqHeaders = await headers();
  const cookieHeader = reqHeaders.get("cookie") ?? undefined;

      const res = await fetch(`${API_BASE_URL}/admin-feature/stats/`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": String(API_KEY ?? ""),
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        credentials: "include",
      });

      if (res.status === 401) {
        // Unauthenticated → redirect to login
        redirect(`/login?next=/admin-dashboard`);
        // In Next.js, redirect throws and never returns. In tests, ensure short-circuit:
        throw new Error("REDIRECT:/login?next=/admin-dashboard");
      }

      if (res.status === 403) {
        // Authenticated but not admin → show akses ditolak message
        try {
          const blocked = await res.json();
          blocked403Detail = typeof blocked?.detail === "string" ? blocked.detail : "Akses Ditolak";
        } catch {
          blocked403Detail = "Akses Ditolak";
        }
      }

      if (res.ok) {
        const data = await res.json();
        // Support multiple possible shapes with safe fallbacks
        totalUsers =
          data?.totalUsers ?? data?.total_users ?? data?.users ?? totalUsers;
        datasets =
          data?.datasets ?? data?.datasets_count ?? data?.dataset ?? datasets;
        failedLogins =
          data?.failedLogins ?? data?.failed_logins ?? data?.failed ?? failedLogins;
        roles = Array.isArray(data?.roles) && data.roles.length > 0 ? data.roles : roles;

        // Zero-data UX messages support
        const msgs = data?.messages || {};
        usersMessage = data?.usersMessage || msgs?.users;
        datasetsMessage = data?.datasetsMessage || msgs?.datasets;
        activityMessage = data?.activityMessage || msgs?.activity;
      } else {
        let detail = "";
        try {
          detail = await res.text();
        } catch {}
        let msg = `Admin stats HTTP error: ${res.status}`;
        if (detail) msg += ` | ${detail}`;
        console.error(msg);
      }
    } catch (e) {
      console.error("Failed to fetch admin stats:", e);
    }
  } else {
    console.warn("NEXT_PUBLIC_API_URL is not set. Using demo defaults for stats.");
  }

  // If access is forbidden (403), render a friendly message
  if (blocked403Detail) {
    return (
      <main className={styles.container}>
        <div className={styles.card} role="alert" aria-live="polite">
          <div className={styles.cardLabel}>Informasi Akses</div>
          <div className={styles.cardValue} style={{ fontSize: 24 }}>{blocked403Detail}</div>
          <div className={styles.hint} style={{ marginTop: 8 }}>
            Anda tidak memiliki izin untuk mengakses halaman ini. Silakan kembali atau login sebagai admin.
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Link href="/" className={styles.buttonSecondary}>Kembali</Link>
            <Link href="/login?next=/admin-dashboard" className={styles.buttonPrimary}>Login</Link>
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
        <StatCard label="Total Users" value={totalUsers} icon={<span>👥</span>} hint={usersMessage} />
        <StatCard label="Datasets" value={datasets} icon={<span>📁</span>} hint={datasetsMessage} />

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
              <div className={styles.summaryValue}>{totalUsers}</div>
            </div>
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