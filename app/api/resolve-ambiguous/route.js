import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { tanggal, siswaId, namaInput } = await req.json();

    // Validasi input
    if (!tanggal || !siswaId) {
      return Response.json(
        { error: "Tanggal dan siswa ID harus diisi" },
        { status: 400 }
      );
    }

    // INSERT ke rekap_gmq_harian
    const { data, error: insertError } = await supabase
      .from("rekap_gmq_harian")
      .upsert(
        {
          tanggal: tanggal,
          siswa_id: siswaId,
          status_mengisi: true,
        },
        { onConflict: "tanggal,siswa_id" }
      )
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return Response.json(
        { error: "Gagal menyimpan data: " + insertError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: `Data siswa berhasil disimpan untuk tanggal ${tanggal}`,
      data: data,
    });
  } catch (error) {
    console.error("Resolve ambiguous error:", error);
    return Response.json(
      { error: "Terjadi kesalahan: " + error.message },
      { status: 500 }
    );
  }
}
