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

    // Step 2: Filter hanya baris yang diawali dengan angka dan dot/space
    const lineRegex = /^\d+[.\s]/;
    const validLines = lines.filter((line) => lineRegex.test(line.trim()));

    // Step 3: Parse setiap baris untuk mengekstrak nama siswa dan kelas
    const parsedStudents = [];

    validLines.forEach((line) => {
      const trimmedLine = line.trim();

      // Deteksi kelas (case-insensitive)
      const lowerLine = trimmedLine.toLowerCase();
      let kelas = null;

      // Rule: Kelas XI jika line mengandung substring "xi"
      if (lowerLine.includes("xi")) {
        kelas = "XI";
      }
      // Rule: Kelas X jika line mengandung "x " (x diikuti space) dan TIDAK mengandung "i" setelahnya
      else if (lowerLine.includes("x ") && !lowerLine.includes("xi")) {
        kelas = "X";
      }

      // Jika kelas terdeteksi, ekstrak nama siswa
      if (kelas) {
        // Buang angka dan dot/space di awal
        const withoutNumber = trimmedLine.replace(/^\d+[.\s]/, "");

        // Ekstrak nama siswa (ambil text sebelum kelas ditulis)
        // Cari posisi kelas dalam teks
        const indexX = withoutNumber.toLowerCase().indexOf("x");

        let namaLengkap = "";
        if (indexX > 0) {
          namaLengkap = withoutNumber.substring(0, indexX).trim();
        } else {
          // Jika tidak ada kelas yang jelas, ambil seluruh text
          namaLengkap = withoutNumber.trim();
        }

        // Filter nama yang valid (minimal harus ada)
        if (namaLengkap) {
          parsedStudents.push({
            namaLengkap,
            kelas,
            rawLine: trimmedLine,
            statusMengisi: true, // Setiap siswa yang berhasil di-parse dianggap hadir
          });
        }
      }
    });

    // Step 4: Return response JSON
    return Response.json({
      success: true,
      tanggal,
      totalInput: validLines.length,
      totalParsed: parsedStudents.length,
      students: parsedStudents,
    });
  } catch (error) {
    console.error("Parse list error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat memproses data: " + error.message },
      { status: 500 }
    );
  }
}
