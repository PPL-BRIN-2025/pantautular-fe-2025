// app/admin-dashboard/_components/AccessDenied.tsx
import Link from "next/link";
import styles from "../page.module.css";

export default function AccessDenied({ detail }: { detail?: string }) {
  const message = detail || "Akses Ditolak";
  return (
    <main className={styles.container}>
      <div className={styles.card} role="alert" aria-live="polite">
        <div className={styles.cardLabel}>Informasi Akses</div>
        <div className={styles.cardValue} style={{ fontSize: 24 }}>{message}</div>
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
