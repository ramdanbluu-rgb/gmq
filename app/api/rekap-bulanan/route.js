import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tahun = searchParams.get("tahun") || new Date().getFullYear();
    const bulan = searchParams.get("bulan");

    if (!bulan) {
      return Response.json({ error: "Parameter bulan wajib diisi (1-12)" }, { status: 400 });
    }

    // 1. Hitung jumlah hari dalam bulan tersebut
    const jumlahHari = new Date(tahun, bulan, 0).getDate();

    // 2. Ambil seluruh data master siswa
    const { data: dataSiswa, error: errSiswa } = await supabase
      .from("siswa_master")
      .select("id, nama_lengkap, kelas, jurusan")
      .order("kelas", { ascending: true })
      .order("nama_lengkap", { ascending: true });

    if (errSiswa) throw new Error(errSiswa.message);

    // 3. Ambil data rekap harian pada rentang bulan terpilih
    const tanggalMulai = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const tanggalSelesai = `${tahun}-${String(bulan).padStart(2, "0")}-${jumlahHari}`;

    const { data: dataRekap, error: errRekap } = await supabase
      .from("rekap_gmq_harian")
      .select("siswa_id, tanggal, status_mengisi")
      .gte("tanggal", tanggalMulai)
      .lte("tanggal", tanggalSelesai);

    if (errRekap) throw new Error(errRekap.message);

    // 4. Petakan data rekap harian ke dalam Map
    const rekapMap = new Map();
    dataRekap.forEach((r) => {
      rekapMap.set(`${r.siswa_id}_${r.tanggal}`, r.status_mengisi);
    });

    // 5. Susun matriks laporan bulanan dan hitung sanksi per ayat
    const matriksRekap = dataSiswa.map((siswa) => {
      const kehadiranPerHari = {};
      let totalMengisi = 0;

      for (let h = 1; h <= jumlahHari; h++) {
        const tglStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(h).padStart(2, "0")}`;
        const status = rekapMap.get(`${siswa.id}_${tglStr}`) || false;
        
        kehadiranPerHari[h] = status;
        if (status) totalMengisi++;
      }

      // 🌟 LOGIKA SANKSI BARU: 1 Hari Alpa = 3 Ayat
      const hariAlpa = jumlahHari - totalMengisi;
      const totalSanksiAyat = hariAlpa * 3;

      return {
        id: siswa.id,
        nama: siswa.nama_lengkap,
        kelas: siswa.kelas,
        jurusan: siswa.jurusan,
        kehadiran: kehadiranPerHari,
        totalMengisi,
        totalSanksi: totalSanksiAyat // Mengembalikan total beban ayat sanksi
      };
    });

    return Response.json({
      success: true,
      info: { tahun, bulan, jumlahHari },
      data: matriksRekap
    });

  } catch (error) {
    console.error("API Rekap Bulanan Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}