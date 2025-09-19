// app/admin-dashboard/page.tsx
import Link from "next/link";
import styles from "./page.module.css";
import StatCard from "./_components/StatCard";
import RolePills from "./_components/RolePills";

export default function AdminDashboardPage() {
  /* Stats Binding → Connect FE components (numbers in cards) to backend API.
     NOTE: Commented out per request. Example skeleton:
     
     // Server component example:
     // const res = await fetch(`${process.env.NEXT_PUBLIC_API}/admin-feature/stats`, { cache: "no-store" });
     // const data = await res.json();
     // const totalUsers = data.totalUsers;
     // const datasets = data.datasets;
     // const failedLogins = data.failedLogins;

     // Or Client hook example:
     // const { data } = useSWR("/admin-feature/stats", fetcher);
     // const totalUsers = data?.totalUsers ?? 0;
  */

  // demo data – replace with API wiring above when ready
  const totalUsers = 124;
  const datasets = 50;
  const roles = ["Admin", "Expert", "Kurator", "Contributor"];

  return (
    <main className={styles.container}>
      {/* Top stat cards */}
      <section className={styles.topGrid}>
        <StatCard label="Total Users" value={totalUsers} icon={<span>👥</span>} />
        <StatCard label="Datasets" value={datasets} icon={<span>📁</span>} />

        <div className={styles.card}>
          <div className={styles.cardLabel}>Role Defined</div>
          <div className={styles.roleCount}>4</div>
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
              <div className={styles.summaryValue}>{totalUsers}</div>
            </div>
            <Link href="/admin-dashboard/logs" className={styles.linkSmall}>
              See on User Log Page
            </Link>
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