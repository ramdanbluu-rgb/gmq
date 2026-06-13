"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [tanggal, setTanggal] = useState("");
  const [rawText, setRawText] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Masukkan daftar GMQ WhatsApp dan pilih tanggal, lalu klik Proses & Rekap."
  );
  const [loading, setLoading] = useState(false);
  const [parseResults, setParseResults] = useState(null);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [ambiguousModal, setAmbiguousModal] = useState(null);
  const [resolvingAmbiguous, setResolvingAmbiguous] = useState(false);

  // Get user email from session
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const supabase = await import("@/lib/supabase").then((m) => m.supabase);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || "Petugas");
        }
      } catch (err) {
        console.error("Get user error:", err);
      }
    };
    getUserEmail();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = await import("@/lib/supabase").then((m) => m.supabase);
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleResolveAmbiguous = async (record, siswaId, siswaNama) => {
    setResolvingAmbiguous(true);
    try {
      const response = await fetch("/api/resolve-ambiguous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tanggal: record.tanggal,
          siswaId: siswaId,
          namaInput: record.namaInput,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menyimpan data");
      }

      // Success - remove from ambiguous and update results
      const updatedAmbiguous = parseResults.data.ambiguous.filter(
        (r) => r.namaInput !== record.namaInput
      );

      setParseResults({
        ...parseResults,
        data: {
          ...parseResults.data,
          ambiguous: updatedAmbiguous,
        },
        summary: {
          ...parseResults.summary,
          ambiguous: updatedAmbiguous.length,
          success: parseResults.summary.success + 1,
        },
      });

      setAmbiguousModal(null);
      setStatusMessage(
        `✅ Berhasil menyimpan data untuk ${siswaNama}. Teruskan dengan yang lain.`
      );
    } catch (err) {
      setError(`Gagal menyimpan: ${err.message}`);
    } finally {
      setResolvingAmbiguous(false);
    }
  };

  const handleProcess = async () => {
    setError("");
    setParseResults(null);
    setAmbiguousModal(null);

    if (!tanggal) {
      setStatusMessage("Silakan pilih tanggal terlebih dahulu.");
      return;
    }
    if (!rawText.trim()) {
      setStatusMessage("Silakan tempelkan teks daftar siswa GMQ terlebih dahulu.");
      return;
    }

    setLoading(true);
    setStatusMessage("Loading... Memproses data...");

    try {
      const response = await fetch("/api/parse-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: rawText,
          tanggal: tanggal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memproses data");
      }

      const data = await response.json();
      setParseResults(data);

      // Status message
      const msgs = [];
      msgs.push(`✅ ${data.summary.success} data berhasil disimpan`);
      if (data.summary.ambiguous > 0) {
        msgs.push(`⚠️ ${data.summary.ambiguous} data perlu konfirmasi manual`);
      }
      if (data.summary.notFound > 0) {
        msgs.push(`❌ ${data.summary.notFound} data tidak ditemukan di database`);
      }

      setStatusMessage(msgs.join(" | "));

      // Jika ada ambiguous, buka modal otomatis untuk yang pertama
      if (data.data.ambiguous && data.data.ambiguous.length > 0) {
        setAmbiguousModal(data.data.ambiguous[0]);
      }
    } catch (err) {
      setError(err.message);
      setStatusMessage("❌ Terjadi kesalahan saat memproses data.");
    } finally {
      setLoading(false);
    }
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
              menyiapkan data absensi.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 sm:items-end">
            {/* User Info & Logout */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-right">
                <p className="text-xs text-slate-500">Login sebagai</p>
                <p className="text-sm font-semibold text-slate-900">{userEmail || "Petugas"}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                {loggingOut ? "Logout..." : "Logout"}
              </button>
            </div>

            {/* Stats */}
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
                disabled={loading}
                className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Proses & Rekap"}
              </button>
            </div>

            {error && (
              <div className="rounded-3xl border border-red-300 bg-red-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-red-700">Terjadi Kesalahan</p>
                <p className="mt-2 text-sm text-red-600">{error}</p>
              </div>
            )}

            {parseResults && (
              <div className="space-y-4">
                {/* Summary Statistics */}
                <div className="grid grid-cols-2 gap-3 rounded-3xl bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-blue-700">Berhasil</p>
                    <p className="mt-1 text-2xl font-semibold text-blue-900">
                      {parseResults.summary.success}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-700">Perlu Konfirmasi</p>
                    <p className="mt-1 text-2xl font-semibold text-orange-900">
                      {parseResults.summary.ambiguous}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-yellow-700">Tidak Ditemukan</p>
                    <p className="mt-1 text-2xl font-semibold text-yellow-900">
                      {parseResults.summary.notFound}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-red-700">Error</p>
                    <p className="mt-1 text-2xl font-semibold text-red-900">
                      {parseResults.summary.errors}
                    </p>
                  </div>
                </div>

                {/* Success Results */}
                {parseResults.data.success && parseResults.data.success.length > 0 && (
                  <div className="rounded-3xl border border-green-300 bg-green-50 p-6">
                    <p className="mb-3 text-sm font-semibold text-green-900">
                      ✅ Data Berhasil Disimpan ({parseResults.data.success.length})
                    </p>
                    <div className="space-y-2">
                      {parseResults.data.success.map((item, idx) => (
                        <div key={idx} className="rounded-lg bg-green-100 p-2 text-xs text-green-900">
                          {item.namaInput} → {item.namaSiswa}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ambiguous Pending */}
                {parseResults.data.ambiguous && parseResults.data.ambiguous.length > 0 && (
                  <div className="rounded-3xl border border-orange-300 bg-orange-50 p-6">
                    <p className="mb-3 text-sm font-semibold text-orange-900">
                      ⚠️ Perlu Konfirmasi Manual ({parseResults.data.ambiguous.length})
                    </p>
                    <div className="space-y-2">
                      {parseResults.data.ambiguous.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setAmbiguousModal(item)}
                          className="w-full rounded-lg bg-orange-100 p-3 text-left text-xs text-orange-900 transition hover:bg-orange-200"
                        >
                          <p className="font-semibold">{item.namaInput}</p>
                          <p className="mt-1 text-orange-700">
                            Klik untuk memilih dari {item.candidates.length} opsi
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Found */}
                {parseResults.data.notFound && parseResults.data.notFound.length > 0 && (
                  <div className="rounded-3xl border border-yellow-300 bg-yellow-50 p-6">
                    <p className="mb-3 text-sm font-semibold text-yellow-900">
                      ❌ Tidak Ditemukan di Database ({parseResults.data.notFound.length})
                    </p>
                    <div className="space-y-2">
                      {parseResults.data.notFound.map((item, idx) => (
                        <div key={idx} className="rounded-lg bg-yellow-100 p-2 text-xs text-yellow-900">
                          {item.namaInput} - {item.kelas} {item.jurusan}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Ambiguous */}
            {ambiguousModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
                <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
                  <h2 className="text-lg font-bold text-slate-900">
                    Nama Rancu - Pilih yang Benar
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Nama "{ambiguousModal.namaInput}" dari input WhatsApp mirip dengan beberapa data di database. 
                    Silakan pilih nama siswa yang paling sesuai:
                  </p>

                  {/* Candidates List */}
                  <div className="mt-6 space-y-3">
                    {ambiguousModal.candidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() =>
                          handleResolveAmbiguous(ambiguousModal, candidate.id, candidate.nama_lengkap)
                        }
                        disabled={resolvingAmbiguous}
                        className="w-full rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 text-left transition hover:border-slate-500 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {candidate.nama_lengkap}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {candidate.kelas} • {candidate.jurusan} • Kecocokan: {candidate.similarity}%
                            </p>
                          </div>
                          {resolvingAmbiguous ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                          ) : (
                            <div className="text-lg">→</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setAmbiguousModal(null)}
                    disabled={resolvingAmbiguous}
                    className="mt-6 w-full rounded-xl border border-slate-300 bg-slate-100 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
