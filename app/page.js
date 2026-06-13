"use client";

import { useState } from "react";

export default function Home() {
  const [tanggal, setTanggal] = useState("");
  const [rawText, setRawText] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Masukkan daftar GMQ WhatsApp dan pilih tanggal, lalu klik Proses & Rekap."
  );

  const handleProcess = () => {
    if (!tanggal) {
      setStatusMessage("Silakan pilih tanggal terlebih dahulu.");
      return;
    }
    if (!rawText.trim()) {
      setStatusMessage("Silakan tempelkan teks daftar siswa GMQ terlebih dahulu.");
      return;
    }

    setStatusMessage(
      "Data siap diproses. Langkah berikutnya: panggil API rekap jika sudah tersedia."
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm sm:p-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              GMQ Recap Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Rekap Hadir GMQ Harian
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Tempelkan daftar dari WhatsApp, pilih tanggal, dan proses rekap untuk
              menyiapkan data absensi. Step 1: UI utama halaman tanpa API.
            </p>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Total input
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {rawText ? rawText.split('\n').length : 0}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Status proses
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {tanggal ? "Tanggal dipilih" : "Belum dipilih"}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Pilih tanggal GMQ
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(event) => setTanggal(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Mode rekap
              </label>
              <div className="rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Proses & Rekap</p>
                <p className="mt-2 leading-6">
                  Sistem akan memfilter baris berawalan angka, mendeteksi kelas X / XI,
                  lalu mengirim data untuk diproses lebih lanjut pada server.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">Panduan singkat</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>1. Tempelkan daftar WhatsApp GMQ di textarea.</li>
                <li>2. Pilih tanggal rekap.</li>
                <li>3. Klik tombol Proses & Rekap.</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Input teks daftar GMQ
              </label>
              <textarea
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                rows={16}
                placeholder={`Contoh:
1. Aulia Fitri X MPLB 1
2. Budi Santoso XI RPL 1
3. Cahaya Putri X AKL 2
...`}
                className="min-h-[320px] w-full rounded-3xl border border-slate-300 bg-white px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Ringkasan</p>
                <p className="mt-2 text-sm text-slate-600">
                  {statusMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={handleProcess}
                className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Proses & Rekap
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
