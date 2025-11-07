"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
// import AccessDeniedNotice from "../../components/AccessDenied2";
// note: when connected to backend uncomment
import { useAuth } from "../../auth/hooks/useAuth";

const normalizeRole = (r?: string | null) => (r ? r.trim().toUpperCase() : "");
type AccessState = "loading" | "redirect" | "forbidden" | "granted";

type Row = {
  data_id: string;
  gender: string;
  age: number;
  city: string;
  status: string;
  disease_id: string;
  location_id: string;
  severity: string;
};

type ExpertViewPageProps = {
  dataset?: Row[];
  fileName?: string;
};

function ExpertViewPageContent({ dataset, fileName }: ExpertViewPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // // RBAC guard
  // temporarily commented out while waiting for backend integration
  // --- access state ---
  // const [accessState, setAccessState] = useState<AccessState>("loading");
  // useEffect(() => {
  //   let resolved = user;
  //   if (!resolved && typeof window !== "undefined") {
  //     try {
  //       const stored = window.localStorage.getItem("user");
  //       if (stored) resolved = JSON.parse(stored);
  //     } catch {}
  //   }
  //   if (!resolved) {
  //     setAccessState("redirect");
  //     return;
  //   }
  //   const allowed = normalizeRole(resolved.role) === "EXP_USER";
  //   setAccessState(allowed ? "granted" : "forbidden");
  // }, [user]);

  // useEffect(() => {
  //   if (accessState !== "redirect") return;
  //   const nextParam = encodeURIComponent("/expert-data-management");
  //   router.replace(`/login?next=${nextParam}`);
  // }, [accessState, router]);

  // if (accessState === "loading" || accessState === "redirect") {
  //   return (
  //     <div className="min-h-screen bg-[#F3F7FB] flex items-center justify-center">
  //       <span className="text-sm text-gray-600">Memeriksa akses…</span>
  //     </div>
  //   );
  // }

  // if (accessState === "forbidden") {
  //   return (
  //     <div className="min-h-screen bg-[#F3F7FB] flex flex-col">
  //       <Navbar />
  //       <main className="flex-1">
  //         <AccessDeniedNotice />
  //       </main>
  //       <Footer />
  //     </div>
  //   );
  // }

  // Normal page
  const fileId = searchParams.get("id") || "UNKNOWN_ID";
  const qpFileName = searchParams.get("fileName") || undefined;
  const lastEdited = searchParams.get("lastEdited") || "";
  const submittedBy = searchParams.get("submittedBy") || "";
  const effectiveFileName = qpFileName || fileName || fileId;

  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (dataset) {
        setRows(dataset);
        return;
      }
      const dummy: Row[] = [
        { data_id: "ID1", gender: "perempuan", age: 14, city: "jakarta", status: "status a", disease_id: "ID A", location_id: "ID B", severity: "severity a" },
        { data_id: "ID2", gender: "laki-laki", age: 14, city: "jakarta", status: "status b", disease_id: "ID A", location_id: "ID B", severity: "severity b" },
        { data_id: "ID3", gender: "lainnya", age: 14, city: "jakarta", status: "status c", disease_id: "ID A", location_id: "ID B", severity: "severity c" },
      ];
      setRows(dummy);
    } catch {
      setError("Failed to load data");
    }
  }, [dataset]);

  if (error) {
    return <div className="text-center text-red-500 mt-6">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        <button
          onClick={() => router.back()}
          className="text-[#4A78E0] text-sm font-medium mb-2 hover:underline"
        >
          &lt; back
        </button>

        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          {effectiveFileName}
        </h1>

        <div className="text-gray-500 text-sm mb-4 space-y-0.5">
          <p>{rows.length ? `${rows.length} rows • 8 columns` : "No data available"}</p>
          {(lastEdited || submittedBy) && (
            <p>
              {lastEdited && <>Last edited: <span className="font-medium text-gray-600">{lastEdited}</span></>}
              {lastEdited && submittedBy && " • "}
              {submittedBy && <>Submitted by: <span className="font-medium text-gray-600">{submittedBy}</span></>}
            </p>
          )}
        </div>

        {rows.length ? (
          <div className="rounded-2xl border shadow-sm bg-white overflow-x-auto">
            <table className="min-w-full text-sm sm:text-base">
              <thead className="bg-[#4A78E0] text-white">
                <tr>
                  {[
                    "ID Data",
                    "Jenis Kelamin",
                    "Usia",
                    "Kota",
                    "STATUS",
                    "ID Penyakit",
                    "ID Lokasi",
                    "Tingkat Keparahan",
                  ].map((header) => (
                    <th key={header} className="px-4 py-3 font-semibold text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.data_id} className="border-t border-gray-200">
                    <td className="px-4 py-3">{r.data_id}</td>
                    <td className="px-4 py-3">{r.gender}</td>
                    <td className="px-4 py-3">{r.age}</td>
                    <td className="px-4 py-3">{r.city}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{r.disease_id}</td>
                    <td className="px-4 py-3">{r.location_id}</td>
                    <td className="px-4 py-3">{r.severity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 text-sm">No data available</div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ExpertViewPage(props: ExpertViewPageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading data…</div>}>
      <ExpertViewPageContent {...props} />
    </Suspense>
  );
}
