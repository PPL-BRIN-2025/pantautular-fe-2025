// app/admin-dashboard/_components/RolePills.tsx
import styles from "../page.module.css";

export default function RolePills({ roles }: { roles: string[] }) {
  return (
    <div className={styles.pillsRow}>
      {roles.map((r) => (
        <span key={r} className={styles.pill}>
          {r}
        </span>
      ))}
    </div>
  );
}