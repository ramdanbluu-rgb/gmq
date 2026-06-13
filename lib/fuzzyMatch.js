/**
 * FUZZY MATCHING STRATEGI KATA (SIMPLE & AMAN)
 */
export function fuzzyMatchName(inputName, candidates = [], inputKelas = null, inputJurusan = null, threshold = 0.20) {
  if (!candidates || candidates.length === 0) {
    return { status: "NO_MATCH", result: null };
  }

  const normalizedInput = inputName.toLowerCase().trim();
  let bestCandidate = null;
  let maxMatches = 0;

  for (const candidate of candidates) {
    if (!candidate.nama_lengkap) continue;
    
    const masterNameLower = candidate.nama_lengkap.toLowerCase().trim();
    const masterWords = masterNameLower.split(/\s+/).filter(w => w.length > 1);
    
    let matchCount = 0;
    masterWords.forEach(word => {
      if (normalizedInput.includes(word)) {
        matchCount++;
      }
    });

    // Cari yang jumlah katanya paling banyak terselip di teks WA
    if (matchCount > maxMatches && matchCount >= Math.min(2, masterWords.length)) {
      maxMatches = matchCount;
      bestCandidate = candidate;
    }
  }

  if (bestCandidate) {
    return {
      status: "MATCH",
      result: bestCandidate
    };
  }

  // Jika pencarian kata gagal, cari nama depan terdekat (Handle nama pendek seperti putri, sifa, afif)
  const firstWordInput = normalizedInput.split(/\s+/)[0];
  const exactFirstWord = candidates.find(c => c.nama_lengkap?.toLowerCase().startsWith(firstWordInput));
  
  if (exactFirstWord) {
    return {
      status: "MATCH",
      result: exactFirstWord
    };
  }

  return { status: "NO_MATCH", result: null };
}