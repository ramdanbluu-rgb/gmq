import { supabase } from "@/lib/supabase";

/**
 * POST endpoint untuk seed data siswa ke database
 * Body: { siswaList: [{ nama_lengkap, kelas, jurusan }, ...] }
 */
export async function POST(req) {
  try {
    const { siswaList } = await req.json();

    if (!siswaList || !Array.isArray(siswaList) || siswaList.length === 0) {
      return Response.json(
        { error: "siswaList harus berupa array yang tidak kosong" },
        { status: 400 }
      );
    }

    // Validasi setiap siswa
    for (const siswa of siswaList) {
      if (!siswa.nama_lengkap || !siswa.kelas) {
        return Response.json(
          {
            error: `Setiap siswa harus punya: nama_lengkap, kelas. Invalid: ${JSON.stringify(
              siswa
            )}`,
          },
          { status: 400 }
        );
      }
      // Set jurusan ke empty string jika undefined/null
      siswa.jurusan = siswa.jurusan || "";
    }

    // Insert ke database
    const { data, error } = await supabase
      .from("siswa_master")
      .insert(siswaList);

    if (error) {
      console.error("Insert error:", error);
      return Response.json(
        { error: "Gagal insert data: " + error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: `${siswaList.length} siswa berhasil di-insert ke database`,
      inserted: siswaList.length,
    });
  } catch (err) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint untuk clear semua data (untuk development)
 * Query: ?confirm=true
 */
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const confirm = searchParams.get("confirm");

  if (confirm !== "true") {
    return Response.json(
      { error: "Harus set ?confirm=true untuk delete semua data" },
      { status: 400 }
    );
  }

  try {
    // Delete dari rekap_gmq_harian dulu (FK constraint)
    const { error: deleteRekapError } = await supabase
      .from("rekap_gmq_harian")
      .delete()
      .neq("id", 0); // Delete all

    if (deleteRekapError) {
      console.error("Delete rekap error:", deleteRekapError);
      return Response.json(
        { error: "Gagal delete rekap: " + deleteRekapError.message },
        { status: 500 }
      );
    }

    // Delete siswa_master
    const { error: deleteSiswaError } = await supabase
      .from("siswa_master")
      .delete()
      .neq("id", 0); // Delete all

    if (deleteSiswaError) {
      console.error("Delete siswa error:", deleteSiswaError);
      return Response.json(
        { error: "Gagal delete siswa: " + deleteSiswaError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Semua data siswa dan rekap sudah di-delete",
    });
  } catch (err) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
