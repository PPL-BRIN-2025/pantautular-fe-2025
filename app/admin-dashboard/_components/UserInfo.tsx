"use client";

import React from "react";
import { useAuth } from "../../auth/hooks/useAuth";

export default function UserInfo() {
  const { user } = useAuth();
  const name = user?.name ?? "Admin";
  const role = user?.role ?? "—";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 8,
        background: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        color: "#0F172A",
        fontSize: 14,
        fontWeight: 500,
      }}
      aria-label="Logged in admin information"
    >
      <span style={{ fontSize: 18 }}>👤</span>
      <span>
        {name} | {role}
      </span>
    </div>
  );
}