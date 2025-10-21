// app/admin-dashboard/layout.tsx
import React from "react";
// Navbar is at app/components/Navbar.tsx (sibling of admin-dashboard)
import Navbar from "../components/Navbar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {/* light blue page background like your mock */}
      <div style={{ background: "#eaf3f6", minHeight: "100vh" }}>{children}</div>
    </>
  );
}