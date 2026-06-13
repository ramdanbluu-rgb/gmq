# Troubleshooting: Data Tidak Ditemukan

Jika sistem menampilkan "Data Tidak Ditemukan di Database", kemungkinannya adalah **table `siswa_master` belum ada data siswa**.

## Step 1: Verifikasi Database

Buka browser dan akses endpoint debug:
```
http://localhost:3000/api/debug/siswa-list
```

Ini akan menampilkan:
- Total baris data siswa di database
- Daftar siswa per kelas
- Summary Kelas X vs XI

**Jika menampilkan `totalRows: 0`** → Database masih kosong, lanjut ke Step 2.

## Step 2: Populate Data Siswa ke Database

### Opsi A: Melalui Supabase Dashboard (GUI)

1. Buka Supabase dashboard → Select project Anda
2. Klik **SQL Editor** di sidebar
3. Jalankan query berikut untuk insert data sampel:

```sql
INSERT INTO siswa_master (nama_lengkap, kelas, jurusan) VALUES
('Muhammad Fazri Apriyanto', 'X', 'MPLB 1'),
('Sifa Tasmi', 'X', 'PS2'),
('Afifah', 'X', 'AKL 2'),
('Aida', 'X', 'AKL 3'),
('Afif', 'X', 'PPLG 1'),
('Rahma', 'X', 'AKL 1'),
('Angghia', 'X', 'DKV 1'),
('Alif', 'XI', 'RPL 1'),
('Melati', 'XI', 'BR2'),
('Intan', 'X', 'MPLB 2'),
('Ihsan', 'XI', 'DKV 1');
```

4. Klik **Run** atau tekan `Ctrl+Enter`
5. Refresh aplikasi dan test parsing lagi

### Opsi B: Upload CSV/Excel (Jika Data Banyak)

1. Siapkan file CSV dengan format:
```
nama_lengkap,kelas,jurusan
Muhammad Fazri Apriyanto,X,MPLB 1
Sifa Tasmi,X,PS2
...
```

2. Di Supabase dashboard → Pilih table `siswa_master`
3. Klik tombol **Import data** → Pilih file CSV
4. Map columns dengan benar → Upload

## Step 3: Validasi Data di Database

Setelah insert, jalankan lagi endpoint debug:
```
http://localhost:3000/api/debug/siswa-list
```

Harusnya menampilkan daftar siswa yang sudah di-insert.

## Step 4: Test Parsing Lagi

1. Login ke dashboard
2. Copy-paste data siswa yang sama dengan yang ada di database
3. Klik "Proses & Rekap"
4. Data harusnya sekarang berhasil ditemukan ✅

## Tips Kecocokan Nama

Untuk hasil fuzzy matching yang optimal:

**✅ BAIK:**
```
Input: "Muhammad Fazri" → Database: "Muhammad Fazri Apriyanto" 
Match: 95% (Accepted!)
```

**❌ BURUK:**
```
Input: "Muh Fazri" → Database: "Muhammad Fazri Apriyanto"
Match: 60% (Not matched - terlalu singkat)
```

**REKOMENDASI:**
- Minimal gunakan nama depan + nama tengah/belakang
- Hindari singkatan terlalu banyak
- Jurusan bisa typo (sistem sudah case-insensitive)

## Query Manual di Supabase

Jika ingin lihat langsung apa ada di database:

1. Buka Supabase dashboard → **SQL Editor**
2. Jalankan:
```sql
SELECT * FROM siswa_master ORDER BY kelas, nama_lengkap;
```

Ini akan show semua siswa di database.

## Still Not Working?

- Pastikan environment variables `.env.local` sudah correct
- Cek Supabase project URL dan API key
- Buka browser console (`F12`) → tab **Network** untuk lihat API response
- Kirim screenshot error message
