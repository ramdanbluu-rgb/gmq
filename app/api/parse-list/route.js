import { supabase } from "@/lib/supabase";
import { fuzzyMatchName } from "@/lib/fuzzyMatch";

export async function POST(req) {
  try {
    const { text, tanggal } = await req.json();

    // Validasi input
    if (!text || typeof text !== "string") {
      return Response.json(
        { error: "Teks input tidak valid atau kosong" },
        { status: 400 }
      );
    }

    if (!tanggal || typeof tanggal !== "string") {
      return Response.json(
        { error: "Tanggal tidak valid atau kosong" },
        { status: 400 }
      );
    }

    // Step 1: Split teks per baris
    const lines = text.split("\n");

    // Step 2: Filter dan parse setiap baris
    const lineRegex = /^\d+/; // Hanya cek ada nomor di awal
    const validLines = lines.filter((line) => {
      const trimmed = line.trim();
      // Filter: minimal ada nomor, dan bukan baris kosong
      return lineRegex.test(trimmed) && trimmed.length > 2;
    });

    // Step 3: Parse setiap baris untuk mengekstrak nama siswa dan kelas
    const rawParsedStudents = [];

    validLines.forEach((line) => {
      const trimmedLine = line.trim();

      // Buang nomor di awal (e.g., "1.", "2", "3.Muhammad" -> "Muhammad")
      const withoutNumber = trimmedLine.replace(/^\d+[.\s]*/, "");

      // Cari posisi "X " atau "XI " (case-insensitive, diikuti spasi)
      const lowerLine = withoutNumber.toLowerCase();
      const xiMatch = lowerLine.match(/\bxi\s/);
      const xMatch = lowerLine.match(/\bx\s/);

      let kelas = null;
      let classIndex = -1;

      // Tentukan kelas berdasarkan mana yang ditemukan duluan
      if (xiMatch && xMatch) {
        // Jika kedua ada, ambil yang muncul duluan
        classIndex = Math.min(xiMatch.index, xMatch.index);
        kelas = xiMatch.index < xMatch.index ? "XI" : "X";
      } else if (xiMatch) {
        classIndex = xiMatch.index;
        kelas = "XI";
      } else if (xMatch) {
        classIndex = xMatch.index;
        kelas = "X";
      }

      // Jika kelas ditemukan, ekstrak nama dan jurusan
      if (kelas && classIndex > 0) {
        // Nama adalah text sebelum kelas
        const namaLengkap = withoutNumber.substring(0, classIndex).trim();

        // Sisa text setelah kelas
        const sisaText = withoutNumber.substring(classIndex + (kelas === "XI" ? 3 : 2)).trim();

        // Jurusan adalah text pertama sebelum surah/juz/emoji
        // Ambil sampai kata pertama yang lowercase atau emoji
        let jurusan = "";
        const jurusanMatch = sisaText.match(/^([A-Z0-9\s\-]+?)(?:\s[A-Z]|$|\d|📖|🕋|Q\.S|q\.s|juz|tasmi|tilawah)/i);
        if (jurusanMatch) {
          jurusan = jurusanMatch[1].trim();
        } else {
          // Fallback: ambil 2 kata pertama
          const words = sisaText.split(/\s+/);
          jurusan = words.slice(0, 2).join(" ");
        }

        // Validasi nama (minimal 2 karakter)
        if (namaLengkap.length > 1) {
          rawParsedStudents.push({
            namaLengkap,
            kelas,
            jurusan,
            rawLine: trimmedLine,
            statusMengisi: true,
          });
        }
      }
    });

    // Step 4: Query Supabase untuk setiap siswa yang di-parse dan INSERT jika cocok
    const successCount = [];
    const ambiguousRecords = [];
    const notFoundRecords = [];
    const errorRecords = [];

    for (const student of rawParsedStudents) {
      try {
        // Query siswa_master berdasarkan kelas saja dulu
        let query = supabase
          .from("siswa_master")
          .select("id, nama_lengkap, kelas, jurusan")
          .eq("kelas", student.kelas);

        const { data: candidates, error: queryError } = await query;

        if (queryError) {
          console.error("Query error:", queryError);
          errorRecords.push({
            namaInput: student.namaLengkap,
            kelas: student.kelas,
            error: queryError.message,
          });
          continue;
        }

        // Jika tidak ada kandidat dengan kelas ini, log untuk debug
        if (!candidates || candidates.length === 0) {
          console.warn(
            `No candidates found for: ${student.namaLengkap} - Kelas ${student.kelas}`
          );
          notFoundRecords.push({
            namaInput: student.namaLengkap,
            kelas: student.kelas,
            jurusan: student.jurusan,
            debugInfo: `Tidak ada siswa Kelas ${student.kelas} di database`,
          });
          continue;
        }

        // Filter kandidat berdasarkan jurusan jika ada
        let filteredCandidates = candidates;
        if (student.jurusan) {
          // Case-insensitive jurusan matching
          const cleanJurusan = student.jurusan.toLowerCase().trim();
          filteredCandidates = candidates.filter((c) =>
            c.jurusan.toLowerCase().includes(cleanJurusan) ||
            cleanJurusan.includes(c.jurusan.toLowerCase())
          );

          // Jika ada filter ketat tidak cocok, gunakan semua candidates
          if (filteredCandidates.length === 0) {
            console.warn(
              `No jurusan match for ${student.namaLengkap} - ${student.jurusan}, using all candidates`
            );
            filteredCandidates = candidates;
          }
        }

        // Melakukan fuzzy matching
        const matchResult = fuzzyMatchName(
          student.namaLengkap,
          filteredCandidates,
          0.75
        );

        if (matchResult.status === "EXACT" || matchResult.status === "MATCH") {
          // Otomatis cocokkan - INSERT ke rekap_gmq_harian
          const siswaId = matchResult.result.id;

          const { error: insertError } = await supabase
            .from("rekap_gmq_harian")
            .upsert(
              {
                tanggal: tanggal,
                siswa_id: siswaId,
                status_mengisi: true,
              },
              { onConflict: "tanggal,siswa_id" }
            );

          if (insertError) {
            console.error("Insert error:", insertError);
            errorRecords.push({
              namaInput: student.namaLengkap,
              siswaId: siswaId,
              error: "Gagal menyimpan ke database: " + insertError.message,
            });
          } else {
            successCount.push({
              namaInput: student.namaLengkap,
              namaSiswa: matchResult.result.nama_lengkap,
              siswaId: siswaId,
              confidence: matchResult.confidence || 1.0,
            });
          }
        } else if (matchResult.status === "AMBIGUOUS") {
          // Ada konflik, kembalikan untuk manual approval
          ambiguousRecords.push({
            namaInput: student.namaLengkap,
            kelas: student.kelas,
            jurusan: student.jurusan,
            rawLine: student.rawLine,
            tanggal: tanggal,
            candidates: matchResult.candidates.map((c) => ({
              id: c.id,
              nama_lengkap: c.nama_lengkap,
              kelas: c.kelas,
              jurusan: c.jurusan,
              similarity: (c.similarity * 100).toFixed(1),
            })),
          });
        } else {
          // Tidak ada kecocokan
          notFoundRecords.push({
            namaInput: student.namaLengkap,
            kelas: student.kelas,
            jurusan: student.jurusan,
          });
        }
      } catch (err) {
        console.error("Processing error for student:", student, err);
        errorRecords.push({
          namaInput: student.namaLengkap,
          error: err.message,
        });
      }
    }

    // Step 5: Return response JSON
    return Response.json({
      success: true,
      tanggal,
      totalInput: validLines.length,
      totalRawParsed: rawParsedStudents.length,
      summary: {
        success: successCount.length,
        ambiguous: ambiguousRecords.length,
        notFound: notFoundRecords.length,
        errors: errorRecords.length,
      },
      data: {
        success: successCount,
        ambiguous: ambiguousRecords,
        notFound: notFoundRecords,
        errors: errorRecords,
      },
    });
  } catch (error) {
    console.error("Parse list error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat memproses data: " + error.message },
      { status: 500 }
    );
  }
}
