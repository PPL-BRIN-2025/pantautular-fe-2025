"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type ContributionStatus = "APPROVED" | "REJECTED" | "WAITING FOR APPROVAL";

type Contribution = {
  id: string;
  title: string;
  status: ContributionStatus;
  username: string;
};

const DUMMY: Contribution[] = [
  { id: "ID1", title: "Bla Bla Bla", status: "APPROVED",            username: "KontributorA" },
  { id: "ID2", title: "Lorem Ipsum", status: "REJECTED",            username: "KontributorB" },
  { id: "ID3", title: "Dolor",        status: "WAITING FOR APPROVAL", username: "KontributorC" },
  { id: "ID4", title: "Sit",          status: "REJECTED",            username: "KontributorD" },
  { id: "ID5", title: "Amet",         status: "APPROVED",            username: "KontributorE" },
  { id: "ID6", title: "Lorem Ipsuuuuum", status: "WAITING FOR APPROVAL", username: "KontributorF" },
  { id: "ID7", title: "Dolor Sit Amet", status: "APPROVED",          username: "KontributorG" },
  { id: "ID8", title: "Blabla",       status: "WAITING FOR APPROVAL", username: "KontributorH" },
  { id: "ID9", title: "Penyakit Menular", status: "REJECTED",        username: "KontributorI" },
];

export default function ContributionManagementPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DUMMY.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q)
    );
  }, [search]);

  const goView = (id: string) => {
    router.push(`/contribution-management/view?id=${encodeURIComponent(id)}`);
  };

  return (
    <div className="min-h-screen bg-[#F3F7FB]">
      <Navbar />

      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        {/* Search Input */}
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            value={search}
            placeholder="Cari Judul / Nama Kontributor"
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2E8AF6] focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border shadow-sm bg-white overflow-hidden">
          <div className="min-w-[900px] max-h-[70vh] overflow-y-auto">
            {/* HEADER */}
            <div className="sticky top-0 bg-[#2E8AF6] text-white font-semibold grid grid-cols-[1fr_2fr_2fr_2fr_1fr] text-sm sm:text-base">
              <div className="px-4 py-3">ID Kontribusi</div>
              <div className="px-4 py-3 border-l border-white/40">Judul</div>
              <div className="px-4 py-3 border-l border-white/40">Status</div>
              <div className="px-4 py-3 border-l border-white/40">Username</div>
              <div className="px-4 py-3 border-l border-white/40 text-center">
                Action
              </div>
            </div>

            {/* BODY */}
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                Tidak ada data yang cocok.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filtered.map((c) => (
                  <li
                    key={c.id}
                    className="grid grid-cols-[1fr_2fr_2fr_2fr_1fr] items-center hover:bg-gray-50 text-sm sm:text-base"
                  >
                    <div className="px-4 py-3">{c.id}</div>
                    <div className="px-4 py-3">{c.title}</div>
                    <div className="px-4 py-3">{c.status}</div>
                    <div className="px-4 py-3">{c.username}</div>
                    <div className="px-4 py-3 flex justify-center">
                      <button
                        onClick={() => goView(c.id)}
                        className="bg-[#2E8AF6] text-white px-4 py-1 rounded-md hover:bg-[#256fd4] transition"
                      >
                        View
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
