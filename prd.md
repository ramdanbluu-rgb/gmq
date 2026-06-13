1. Ringkasan Sistem
Sistem ini adalah aplikasi web berbasis Next.js 14.2 yang di-host di Vercel Free Tier dengan database Supabase (PostgreSQL). Sistem dirancang untuk membantu petugas merekap list harian GMQ (Gerakan Membaca Quran) sekolah secara semi-otomatis melalui metode salin-tempel (Smart Paste), melakukan pemetaan kelas otomatis, mendeteksi nama samar, serta menghitung sanksi ayat secara akumulatif di akhir bulan.

2. Alur Pengguna (User Journey)
1. Petugas menyalin (copy) teks list panjang dari grup WhatsApp.

2.Petugas membuka web, memilih tanggal, dan menempelkan (paste) teks tersebut ke kotak input, lalu klik "Proses & Rekap".

3.Sistem memotong teks, menyaring siswa Kelas X dan XI, serta mencocokkan nama dengan data master di database menggunakan algoritma kemiripan teks (Fuzzy Matching).

4.Jika ada nama samar yang membingungkan (ambigu), sistem menampilkan pop-up konfirmasi agar petugas tinggal klik nama yang benar.

5.Di akhir bulan, petugas tinggal klik tombol "Unduh Excel Bulanan" untuk mendapatkan file .xlsx yang sudah terbagi per sheet Kelas X & XI, lengkap dengan hitungan otomatis kolom Sanksi Ayat (Jumlah Absen × 3 Ayat).