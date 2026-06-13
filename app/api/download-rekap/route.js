import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export async function GET(req) {
  try {
    // 1. Ambil parameter tanggal dari URL (misal: /api/download-rekap?tanggal=2026-06-12)
    const { searchParams } = new URL(req.url);
    const tanggal = searchParams.get("tanggal");

    if (!tanggal) {
      return Response.json({ error: "Parameter tanggal wajib diisi" }, { status: 400 });
    }

    // 2. Tarik data rekap harian berdasarkan tanggal, gabungkan dengan nama siswa dari siswa_master
    const { data: rekapData, error: queryError } = await supabase
      .from("rekap_gmq_harian")
      .select(`
        id,
        tanggal,
        status_mengisi,
        siswa_master (
          nama_lengkap,
          kelas,
          jurusan
        )
      `)
      .eq("tanggal", tanggal);

    if (queryError) {
      console.error("Supabase Error:", queryError);
      return Response.json({ error: queryError.message }, { status: 500 });
    }

    if (!rekapData || rekapData.length === 0) {
      return Response.json({ error: "Tidak ada data rekap pada tanggal tersebut" }, { status: 404 });
    }

    // 3. Rapikan struktur data agar menjadi kolom-kolom Excel yang cantik
    const excelRows = rekapData.map((row, index) => ({
      "No Urut": index + 1,
      "Tanggal Rekap": row.tanggal,
      "Nama Lengkap": row.siswa_master?.nama_lengkap || "Nama Tidak Diketahui",
      "Kelas": row.siswa_master?.kelas || "-",
      "Jurusan": row.siswa_master?.jurusan || "-",
      "Status Kehadiran GMQ": row.status_mengisi ? "✅ Sudah Mengisi" : "❌ Belum Mengisi"
    }));

    // 4. Proses pembuatan file Excel menggunakan SheetJS
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap GMQ");

    // Mengatur lebar kolom Excel otomatis agar rapi tidak terpotong
    const maxWords = [{ wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 25 }];
    worksheet["!cols"] = maxWords;

    // 5. Ubah workbook menjadi Buffer biner
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    // 6. Kembalikan respons berupa file unduhan Excel murni ke browser
    return new Response(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Rekap_GMQ_${tanggal}.xlsx`,
      },
    });

  } catch (error) {
    console.error("Global Download Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}