"use client";

import React, { useMemo, useRef } from "react";
import DownloadButton from "./DownloadButton";
import type { StatisticsData } from "@/types";

interface ExcelVisualizationCardProps {
  data: StatisticsData;
}

type TableRow = Array<string | number>;

const toCell = (value: string | number) => {
  const stringValue = typeof value === "number" ? value.toString() : value;
  if (stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  if (/[,\n]/.test(stringValue)) {
    return `"${stringValue}"`;
  }
  return stringValue;
};

const buildCsvSection = (title: string, headers: string[], rows: TableRow[]) => {
  const csvRows = [[title], headers, ...rows];
  return csvRows.map((row) => row.map(toCell).join(",")).join("\n");
};

const buildCsvContent = (data: StatisticsData) => {
  const sections: string[] = [];

  sections.push(
    buildCsvSection(
      "Ringkasan",
      ["Metode", "Nilai"],
      [
        ["Prevalensi", data.prevalence_statistics.prevalence],
        ["Tahun Populasi", data.prevalence_statistics.year],
        ["Jumlah Populasi", data.prevalence_statistics.population],
        ["Total Kasus", data.severity_statistics.total_cases],
      ]
    )
  );

  const severityRows = Object.entries(data.severity_statistics.severity_counts || {}).map(
    ([severity, value]) => [severity, value ?? 0]
  );
  sections.push(buildCsvSection("Distribusi Tingkat Keparahan", ["Kategori", "Jumlah"], severityRows));

  sections.push(
    buildCsvSection("Distribusi Usia", ["Kelompok Usia", "Jumlah"], [
      ["<12", data.age_statistics.under_12],
      ["12-25", data.age_statistics["12_25"]],
      ["26-45", data.age_statistics["26_45"]],
      [">45", data.age_statistics.above_45],
    ])
  );

  sections.push(
    buildCsvSection("Distribusi Gender", ["Jenis Kelamin", "Jumlah"], [
      ["Laki-laki", data.gender_statistics.male],
      ["Perempuan", data.gender_statistics.female],
    ])
  );

  const buildNewsSection = (
    title: string,
    rows: Array<{ portal: string; news_count?: number; disease_count?: number; count?: number }>
  ) => {
    if (!rows.length) return;
    sections.push(
      buildCsvSection(
        title,
        ["Portal", "Jumlah Berita", "Jumlah Penyakit"],
        rows.map((item) => [
          item.portal,
          item.news_count ?? item.count ?? 0,
          item.disease_count ?? 0,
        ])
      )
    );
  };

  buildNewsSection("Sumber Berita (Nasional)", data.national_news_statistics.all_national);
  buildNewsSection("Sumber Berita (Lokal)", data.local_portal_statistics.all_local);
  buildNewsSection("Sumber Berita (Kesehatan)", data.healthcare_news_statistics.all_healthcare);

  return sections.join("\n\n");
};

const ExcelVisualizationCard: React.FC<ExcelVisualizationCardProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const csvContent = useMemo(() => buildCsvContent(data), [data]);
  const hasData = useMemo(() => csvContent.trim().length > 0, [csvContent]);

  const severityRows = Object.entries(data.severity_statistics.severity_counts || {}).map(
    ([key, value]) => (
      <tr key={key} className="odd:bg-[#f9fbff]">
        <td className="border border-slate-200 px-3 py-2 font-medium capitalize text-slate-700">
          {key}
        </td>
        <td className="border border-slate-200 px-3 py-2 text-right text-slate-900">
          {value ?? 0}
        </td>
      </tr>
    )
  );

  const renderNewsTable = (
    title: string,
    rows: Array<{ portal: string; news_count?: number; disease_count?: number; count?: number }>
  ) => {
    if (!rows.length) {
      return (
        <p className="text-sm text-slate-500">
          Tidak ada data berita yang tersedia untuk kategori ini.
        </p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                Portal
              </th>
              <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                Jumlah Berita
              </th>
              <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                Jumlah Penyakit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row) => (
              <tr key={`${title}-${row.portal}`} className="odd:bg-[#f9fbff]">
                <td className="px-3 py-2 font-medium text-slate-800">{row.portal}</td>
                <td className="px-3 py-2 text-right text-slate-700">
                  {row.news_count ?? row.count ?? 0}
                </td>
                <td className="px-3 py-2 text-right text-slate-700">
                  {row.disease_count ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="relative w-full pt-8">
      <div className="absolute right-0 top-0 flex gap-2">
        <DownloadButton
          filename="excel-visualization"
          csvFilename="excel-visualization.csv"
          getTarget={() => containerRef.current}
          canDownload={() => hasData && Boolean(containerRef.current)}
          canDownloadCsv={() => hasData}
          csvExporter={() => csvContent}
        />
      </div>
      <div ref={containerRef} className="w-full rounded-lg bg-white p-4 shadow">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-[#0069CF]">Visualisasi Excel</h3>
          <p className="text-sm text-slate-600">
            Ringkasan data dalam format tabular yang dapat diunduh sebagai CSV maupun gambar.
          </p>
        </div>

        <div className="grid gap-6">
          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Ringkasan Utama
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                      Metode
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                      Nilai
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr className="odd:bg-[#f9fbff]">
                    <td className="px-3 py-2 font-medium text-slate-800">Prevalensi</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {data.prevalence_statistics.prevalence}
                    </td>
                  </tr>
                  <tr className="odd:bg-[#f9fbff]">
                    <td className="px-3 py-2 font-medium text-slate-800">Tahun Populasi</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {data.prevalence_statistics.year}
                    </td>
                  </tr>
                  <tr className="odd:bg-[#f9fbff]">
                    <td className="px-3 py-2 font-medium text-slate-800">Jumlah Populasi</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {data.prevalence_statistics.population}
                    </td>
                  </tr>
                  <tr className="odd:bg-[#f9fbff]">
                    <td className="px-3 py-2 font-medium text-slate-800">Total Kasus</td>
                    <td className="px-3 py-2 text-right text-slate-700">{data.severity_statistics.total_cases}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Tingkat Keparahan
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                      Kategori
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">{severityRows}</tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Distribusi Usia
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                        Kelompok Usia
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                        Jumlah
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="odd:bg-[#f9fbff]">
                      <td className="px-3 py-2 font-medium text-slate-800">&lt;12</td>
                      <td className="px-3 py-2 text-right text-slate-700">{data.age_statistics.under_12}</td>
                    </tr>
                    <tr className="odd:bg-[#f9fbff]">
                      <td className="px-3 py-2 font-medium text-slate-800">12-25</td>
                      <td className="px-3 py-2 text-right text-slate-700">{data.age_statistics["12_25"]}</td>
                    </tr>
                    <tr className="odd:bg-[#f9fbff]">
                      <td className="px-3 py-2 font-medium text-slate-800">26-45</td>
                      <td className="px-3 py-2 text-right text-slate-700">{data.age_statistics["26_45"]}</td>
                    </tr>
                    <tr className="odd:bg-[#f9fbff]">
                      <td className="px-3 py-2 font-medium text-slate-800">&gt;45</td>
                      <td className="px-3 py-2 text-right text-slate-700">{data.age_statistics.above_45}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Distribusi Gender
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                        Jenis Kelamin
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold tracking-wide">
                        Jumlah
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="odd:bg-[#f9fbff]">
                      <td className="px-3 py-2 font-medium text-slate-800">Laki-laki</td>
                      <td className="px-3 py-2 text-right text-slate-700">{data.gender_statistics.male}</td>
                    </tr>
                    <tr className="odd:bg-[#f9fbff]">
                      <td className="px-3 py-2 font-medium text-slate-800">Perempuan</td>
                      <td className="px-3 py-2 text-right text-slate-700">{data.gender_statistics.female}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Distribusi Sumber Berita
            </h4>
            <div className="grid gap-4">
              <div>
                <h5 className="mb-1 text-sm font-semibold text-slate-600">
                  Nasional
                </h5>
                {renderNewsTable(
                  "Nasional",
                  data.national_news_statistics.all_national
                )}
              </div>
              <div>
                <h5 className="mb-1 text-sm font-semibold text-slate-600">
                  Lokal
                </h5>
                {renderNewsTable(
                  "Lokal",
                  data.local_portal_statistics.all_local
                )}
              </div>
              <div>
                <h5 className="mb-1 text-sm font-semibold text-slate-600">
                  Bidang Kesehatan
                </h5>
                {renderNewsTable(
                  "Kesehatan",
                  data.healthcare_news_statistics.all_healthcare
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ExcelVisualizationCard;
