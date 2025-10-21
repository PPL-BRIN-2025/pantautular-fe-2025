// app/admin-dashboard/_components/StatCard.tsx
import styles from "../page.module.css";

type StatCardProps = Readonly<{
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
}>;

export default function StatCard({ label, value, icon, hint }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardRow}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.cardValue}>{value}</div>
      </div>
      {hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
}