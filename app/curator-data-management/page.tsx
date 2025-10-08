"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type CuratorRow = {
  id: string;
  title: string;
  lastEdited: string;
  submittedBy: string;
};

const dummyData: CuratorRow[] = [
  { id: "ID1", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORA" },
  { id: "ID2", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORA" },
  { id: "ID3", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORB" },
  { id: "ID4", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORA" },
  { id: "ID5", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORB" },
  { id: "ID6", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORC" },
  { id: "ID7", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORD" },
  { id: "ID8", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORA" },
  { id: "ID9", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORD" },
  { id: "ID10", title: "Penyakit", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORX" },
];

export default function CuratorDataManagementPage() {
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const start = (page - 1) * pageSize;
  const pageRows = dummyData.slice(start, start + pageSize);
  const pageCount = Math.max(1, Math.ceil(dummyData.length / pageSize));

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />

      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        {/* label */}
        <div className="text-gray-500 text-base font-medium mb-4">
          &lt; List Data
        </div>

        {/* Table container */}
        <div className="rounded-2xl border shadow-sm bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[980px] max-h-[70vh] overflow-y-auto rounded-2xl">
              {/* Sticky Header */}
              <div className="sticky top-0 z-20 bg-[#2E8AF6] text-white rounded-t-2xl">
                <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr] border-b border-white/30">
                  {["Data ID", "Title", "Last Edited", "Submitted by", "Action"].map(
                    (label, idx) => (
                      <div
                        key={label}
                        className={`px-4 py-3 text-sm sm:text-base font-semibold ${
                          idx !== 0 ? "border-l border-white/50" : ""
                        }`}
                      >
                        {label}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Table rows */}
              <ul className="divide-y divide-gray-200">
                {pageRows.map((r) => (
                  <li key={r.id} className="hover:bg-gray-50">
                    <div className="grid grid-cols-[1fr_1.6fr_1.6fr_1.6fr_1fr] items-center text-sm sm:text-base">
                      <div className="px-4 py-3">{r.id}</div>
                      <div className="px-4 py-3">{r.title}</div>
                      <div className="px-4 py-3">{r.lastEdited}</div>
                      <div className="px-4 py-3">{r.submittedBy}</div>
                      <div className="px-4 py-3 flex justify-center">
                        <button
                        disabled
                        className="rounded-md bg-[#2E8AF6] text-white px-4 py-1 text-sm font-medium opacity-80 cursor-default"
                        >
                        Ubah
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex items-center justify-between bg-white p-3 sm:p-4 sticky bottom-0 z-10 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Menampilkan{" "}
                  <span className="font-medium">{pageRows.length}</span> dari{" "}
                  <span className="font-medium">{dummyData.length}</span> data
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <div className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                    {page} / {pageCount}
                  </div>
                  <button
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    disabled={page >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional source label */}
        <p className="mt-4 text-xs text-gray-500">
          Sumber data: <code>/curator-feature/api/curator/data</code> (tabel{" "}
          <code>curator_feature_data</code>).
        </p>
      </main>

      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
}
