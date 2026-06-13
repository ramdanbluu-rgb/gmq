"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LaporanBulananPage() {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [rekapMata, setRekapData] = useState([]);
  const [jumlahHari, setJumlahHari] = useState(31);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const muatLaporanBulanan = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rekap-bulanan?bulan=${bulan}&tahun=${tahun}`);
      const hasil = await res.json();
      if (hasil.success) {
        setRekapData(hasil.data);
        setJumlahHari(hasil.info.jumlahHari);
      } else {
        setError(hasil.error || "Gagal memuat laporan bulanan.");
      }
    } catch (err) {
      setError("Gangguan jaringan, gagal tersambung ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatLaporanBulanan();
  }, [bulan, tahun]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 sm:p-10">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-6">
        
        {/* Header Kontrol */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <Link href="/dashboard" className="text-xs font-bold text-blue-600 hover:underline">
              ← Kembali ke Dashboard Input
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1"> Jurnal Laporan Rekap Bulanan</h1>
            <p className="text-xs text-slate-500">Rekapitulasi otomatis absensi GMQ beserta kalkulasi sanksi bulanan.</p>
          </div>

          {/* Filter Bulan & Tahun */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <select
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none font-medium text-slate-700"
            >
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none font-medium text-slate-700"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-sm text-red-600 rounded-2xl">{error}</div>
        )}

        {/* Kotak Tabel Absen Horizontal */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
          {loading ? (
            <div className="p-20 text-center text-sm text-slate-500 font-medium animate-pulse">
              Sedang mengalkulasi data rekapitulasi seluruh siswa...
            </div>
          ) : rekapMata.length > 0 ? (
            <div className="overflow-x-auto max-w-full">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-800 text-white font-bold sticky top-0">
                  <tr>
                    <th className="px-4 py-3.5 w-10 text-center sticky left-0 bg-slate-800 z-10">No</th>
                    <th className="px-6 py-3.5 w-56 sticky left-10 bg-slate-800 z-10 border-r border-slate-700">Nama Siswa</th>
                    <th className="px-3 py-3.5 text-center border-r border-slate-700">Kelas</th>
                    
                    {/* Render dinamis kolom nomor hari tanggal 1 - 30/31 */}
                    {Array.from({ length: jumlahHari }, (_, i) => i + 1).map((hari) => (
                      <th key={hari} className="px-2 py-3.5 text-center min-w-[28px] border-r border-slate-700">
                        {hari}
                      </th>
                    ))}
                    
                    <th className="px-4 py-3.5 text-center bg-orange-700 text-white font-bold">Hadir</th>
                    <th className="px-4 py-3.5 text-center bg-red-700 text-white font-bold rounded-tr-2xl">⚠️ Sanksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {rekapMata.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 text-center font-medium text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50">{idx + 1}</td>
                      <td className="px-6 py-3 font-semibold text-slate-900 sticky left-10 bg-white group-hover:bg-slate-50 border-r border-slate-200">
                        {row.nama}
                      </td>
                      <td className="px-3 py-3 text-center font-medium border-r border-slate-100">{row.kelas}</td>
                      
                      {/* Sel-sel Checklist kehadiran harian */}
                      {Array.from({ length: jumlahHari }, (_, i) => i + 1).map((hari) => {
                        const isHadir = row.kehadiran[hari];
                        return (
                          <td 
                            key={hari} 
                            className={`px-1 py-3 text-center font-bold border-r border-slate-100 text-[11px] ${
                              isHadir ? "text-emerald-600 bg-emerald-50/30" : "text-red-400 bg-red-50/20"
                            }`}
                          >
                            {isHadir ? "✔" : "-"}
                          </td>
                        );
                      })}
                      
                      <td className="px-4 py-3 text-center font-bold text-slate-600 bg-slate-50">{row.totalMengisi} d</td>
                      
                      {/* Kolom Indikator Total Sanksi Mengisi */}
                      <td className={`px-4 py-3 text-center font-extrabold ${
                        row.totalSanksi > 5 ? "bg-red-100 text-red-700" : "bg-red-50 text-red-600"
                      }`}>
                        {row.totalSanksi} ayat
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400">Tidak ada data master siswa ditemukan.</div>
          )}
        </div>
      </div>
    </div>
  );
}