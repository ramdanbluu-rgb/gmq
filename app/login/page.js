"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy load Supabase client
const supabasePromise = import("@/lib/supabase").then((m) => m.supabase);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      // Validasi input
      if (!email || !password) {
        setError("Email dan password harus diisi");
        setLoading(false);
        return;
      }

      // Load Supabase client
      const supabase = await supabasePromise;

      // Login menggunakan Supabase Auth
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (loginError) {
        setError(loginError.message || "Login gagal. Periksa email dan password.");
        setLoading(false);
        return;
      }

      if (data?.user) {
        setSuccessMessage("Login berhasil! Mengalihkan...");
        // Wait untuk Supabase cookies tersimpan, lalu refresh
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Terjadi kesalahan saat login");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-3xl border border-slate-700 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-3">
              <svg
                className="h-6 w-6 text-slate-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-100">GMQ Recap</h1>
            <p className="mt-2 text-sm text-slate-400">Sistem Rekap Hadir GMQ Sekolah</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                Email Petugas
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sekolah.com"
                disabled={loading}
                className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 disabled:opacity-50"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3">
                <p className="text-sm text-green-400">{successMessage}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 py-3 text-sm font-semibold text-slate-100 transition hover:from-slate-500 hover:to-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sedang login...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 space-y-2 rounded-xl border border-slate-700 bg-slate-700/30 p-3 text-center">
            <p className="text-xs text-slate-400">Untuk admin / petugas sekolah saja</p>
            <p className="text-xs text-slate-500">
              Hubungi administrator jika lupa password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
