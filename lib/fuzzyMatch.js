import { findBestMatch } from "string-similarity";

/**
 * Fungsi untuk mencari kecocokan nama siswa dengan fuzzy matching
 * @param {string} inputName - Nama dari input (WhatsApp list)
 * @param {Array} candidates - Array objek siswa dari database dengan struktur {id, nama_lengkap}
 * @param {number} threshold - Threshold similarity (default 0.75 = 75%)
 * @returns {Object} - {status: 'EXACT'|'MATCH'|'AMBIGUOUS'|'NO_MATCH', result: siswa|null, candidates: []}
 */
export function fuzzyMatchName(inputName, candidates = [], threshold = 0.75) {
  if (!candidates || candidates.length === 0) {
    return { status: "NO_MATCH", result: null, candidates: [] };
  }

  // Normalize input name untuk perbandingan
  const normalizedInput = inputName.toLowerCase().trim();

  // Cari kecocokan terbaik
  const candidateNames = candidates.map((c) => c.nama_lengkap.toLowerCase());
  const bestMatch = findBestMatch(normalizedInput, candidateNames);

  // Jika exact match (100%)
  if (bestMatch.bestMatch.rating === 1.0) {
    const exactMatch = candidates[bestMatch.bestMatchIndex];
    return {
      status: "EXACT",
      result: exactMatch,
      candidates: [],
    };
  }

  // Jika di atas threshold, cek apakah ada lebih dari 1 kandidat
  const matchesAboveThreshold = bestMatch.ratings
    .map((r, idx) => ({ rating: r.rating, index: idx }))
    .filter((r) => r.rating >= threshold)
    .sort((a, b) => b.rating - a.rating);

  if (matchesAboveThreshold.length === 0) {
    return { status: "NO_MATCH", result: null, candidates: [] };
  }

  // Jika hanya 1 kandidat di atas threshold, cocokkan otomatis
  if (matchesAboveThreshold.length === 1) {
    const matchedStudent = candidates[matchesAboveThreshold[0].index];
    return {
      status: "MATCH",
      result: matchedStudent,
      candidates: [],
      confidence: matchesAboveThreshold[0].rating,
    };
  }

  // Jika ada 2 atau lebih kandidat (ambigu), kembalikan semua pilihan
  const ambiguousCandidates = matchesAboveThreshold.map((m) => ({
    ...candidates[m.index],
    similarity: m.rating,
  }));

  return {
    status: "AMBIGUOUS",
    result: null,
    candidates: ambiguousCandidates,
  };
}
