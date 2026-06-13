import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tahun = searchParams.get("tahun") || new Date().getFullYear();
    const bulan = searchParams.get("bulan");

    if (!bulan) {
      return Response.json({ error: "Parameter bulan wajib diisi" }, { status: 400 });
    }

    const jumlahHari = new Date(tahun, bulan, 0).getDate();

    // 1. Ambil seluruh data siswa master
    const { data: dataSiswa, error: errSiswa } = await supabase
      .from("siswa_master")
      .select("id, nama_lengkap, kelas, jurusan")
      .order("kelas", { ascending: true })
      .order("nama_lengkap", { ascending: true });

    if (errSiswa) throw new Error(errSiswa.message);

    // 2. Ambil data rekap harian pada rentang bulan tersebut
    const tanggalMulai = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const tanggalSelesai = `${tahun}-${String(bulan).padStart(2, "0")}-${jumlahHari}`;

    const { data: dataRekap, error: errRekap } = await supabase
      .from("rekap_gmq_harian")
      .select("siswa_id, tanggal, status_mengisi")
      .gte("tanggal", tanggalMulai)
      .lte("tanggal", tanggalSelesai);

    if (errRekap) throw new Error(errRekap.message);

    const rekapMap = new Map();
    dataRekap.forEach((r) => {
      rekapMap.set(`${r.siswa_id}_${r.tanggal}`, r.status_mengisi);
    });

    // 3. Transformasi data menjadi baris horizontal Excel
    const excelRows = dataSiswa.map((siswa, index) => {
      // Kolom utama di sebelah kiri
      const rowObject = {
        "No": index + 1,
        "Nama Lengkap": siswa.nama_lengkap,
        "Kelas": siswa.kelas,
        "Jurusan": siswa.jurusan || "-"
      };

      let totalHadir = 0;

      // Kolom dinamis tanggal 1 sampai 30/31
      for (let h = 1; h <= jumlahHari; h++) {
        const tglStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(h).padStart(2, "0")}`;
        const status = rekapMap.get(`${siswa.id}_${tglStr}`) || false;
        
        rowObject[`Tgl ${h}`] = status ? "✔" : "-";
        if (status) totalHadir++;
      }

      // Kolom summary sanksi di sebelah kanan
      const hariAlpa = jumlahHari - totalHadir;
      rowObject["Total Hadir"] = `${totalHadir} Hari`;
      rowObject["Sanksi (Ayat)"] = `${hariAlpa * 3} Ayat`;

      return rowObject;
    });

    // 4. Generate Workbook Excel
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap Bulan ${bulan}`);

    // Mengatur lebar kolom otomatis agar tulisan nama tidak terpotong
    const colWidths = [{ wch: 5 }, { wch: 30 }, { wch: 8 }, { wch: 15 }];
    for (let h = 1; h <= jumlahHari; h++) {
      colWidths.push({ wch: 6 }); // Lebar kolom tanggal dibuat ramping (6)
    }
    colWidths.push({ wch: 12 }, { wch: 15 }); // Lebar kolom summary
    worksheet["!cols"] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    const namaBulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ][parseInt(bulan) - 1];

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Jurnal_GMQ_${namaBulan}_${tahun}.xlsx`,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}