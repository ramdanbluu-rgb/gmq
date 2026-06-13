import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    // Get all siswa_master data untuk debug
    const { data, error } = await supabase
      .from("siswa_master")
      .select("id, nama_lengkap, kelas, jurusan")
      .order("kelas,nama_lengkap");

    if (error) {
      return Response.json(
        { error: "Gagal query database: " + error.message },
        { status: 500 }
      );
    }

    return Response.json({
      totalRows: data?.length || 0,
      siswa: data || [],
      summary: {
        kelasX: data?.filter((s) => s.kelas === "X").length || 0,
        kelasXI: data?.filter((s) => s.kelas === "XI").length || 0,
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
    return Response.json(
      { error: "Terjadi kesalahan: " + error.message },
      { status: 500 }
    );
  }
}
