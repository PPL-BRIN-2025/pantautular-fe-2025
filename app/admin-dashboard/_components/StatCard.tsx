// app/admin-dashboard/_components/StatCard.tsx
import styles from "../page.module.css";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
};

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardRow}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.cardValue}>{value}</div>
      </div>
    </div>
  );
}