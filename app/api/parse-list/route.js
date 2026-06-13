import { supabase } from "@/lib/supabase";
import { fuzzyMatchName } from "@/lib/fuzzyMatch";

export async function POST(req) {
  try {
    const { text, tanggal } = await req.json();

    if (!text || !tanggal) {
      return Response.json({ error: "Input atau tanggal kosong" }, { status: 400 });
    }

    // Step 1: Potong teks per baris
    const lines = text.split("\n");
    
    // Step 2: KEMBALIKAN LOGIKA KETAT - Wajib diawali angka nomor urut (e.g., "1.", "2)", "3 ")
    const lineRegex = /^\d+/;
    const validLines = lines.filter((line) => {
      const trimmed = line.trim();
      // Baris harus diawali angka dan minimal punya panjang teks lebih dari 5 karakter (menghindari baris nomor kosong)
      return lineRegex.test(trimmed) && trimmed.length > 5;
    });

    const successCount = [];
    const notFoundRecords = [];

    // Tarik seluruh data master siswa sekaligus dari Supabase
    const { data: allCandidates, error: queryError } = await supabase
      .from("siswa_master")
      .select("id, nama_lengkap, kelas, jurusan");

    if (queryError) {
      console.error("Supabase Error:", queryError);
      return Response.json({ error: queryError.message }, { status: 500 });
    }

    // Step 3: Proses baris yang benar-benar valid mengisi list saja
    for (const line of validLines) {
      const trimmedLine = line.trim();
      
      // Bersihkan nomor di depan baris agar tersisa teks nama dan keterangannya saja
      const cleanLineText = trimmedLine.replace(/^\d+[.\s\)]*/, "").trim();

      // Jaring pengaman ekstra: Jika setelah dibuang nomornya teksnya kosong atau hanya strip saja, lewati!
      if (cleanLineText.length <= 2 || cleanLineText === "-" || cleanLineText === "🔄" || cleanLineText === "☑️") {
        continue;
      }

      // Jalankan fungsi pencocokan kata cerdas
      const matchResult = fuzzyMatchName(cleanLineText, allCandidates);

      if (matchResult && matchResult.status === "MATCH" && matchResult.result) {
        const siswaId = matchResult.result.id;

        // Lakukan UPSERT aman ke database harian
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

        if (!insertError) {
          successCount.push({
            namaInput: cleanLineText,
            namaSiswa: matchResult.result.nama_lengkap,
          });
          continue;
        }
      }

      // Jika benar-benar tidak ada nama yang cocok di database master
      notFoundRecords.push({ namaInput: cleanLineText });
    }

    // Step 4: Kembalikan hasil rekap yang bersih tanpa duplikasi hantu
    return Response.json({
      success: true,
      tanggal,
      totalInput: validLines.length,
      summary: {
        success: successCount.length,
        ambiguous: 0,
        notFound: notFoundRecords.length,
        errors: 0,
      },
      data: {
        success: successCount,
        ambiguous: [],
        notFound: notFoundRecords,
        errors: [],
      }
    });

  } catch (error) {
    console.error("Global Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}