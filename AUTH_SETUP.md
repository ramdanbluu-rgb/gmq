# Supabase Authentication Setup

Untuk mengaktifkan login/logout di aplikasi GMQ Recap System, ikuti langkah berikut:

## 1. Enable Email/Password Auth di Supabase

Di dashboard Supabase project Anda:
1. Buka menu **Authentication** → **Providers**
2. Pastikan **Email** provider sudah di-enable
3. Di tab **Settings**, pastikan:
   - Email confirmations **OFF** (untuk development)
   - Redirect URL sudah di-set ke `http://localhost:3000` (development)

## 2. Buat Pengguna Admin

Di Supabase Authentication dashboard:
1. Klik tombol **Create User**
2. Masukkan:
   - Email: `admin@sekolah.com`
   - Password: `password-aman-di-sini`
3. Klik **Create User**

## 3. Hak Akses Database (RLS)

Untuk production, aktifkan Row Level Security (RLS) pada tabel:
- `siswa_master` - Hanya bisa dibaca oleh authenticated users
- `rekap_gmq_harian` - Hanya bisa diakses oleh authenticated users

## 4. Environment Variables

Pastikan file `.env.local` sudah berisi:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Testing

1. Start dev server: `npm run dev`
2. Kamu akan otomatis diarahkan ke halaman `/login`
3. Login menggunakan email dan password yang sudah dibuat
4. Setelah login, kamu akan masuk ke halaman utama `/`
5. Klik tombol **Logout** di pojok kanan atas untuk logout
6. Setelah logout, kamu akan diarahkan kembali ke `/login`

## Fitur Auth yang Sudah Diimplementasikan

✅ **Login dengan Email & Password**
- Form login di halaman `/login`
- Client-side authentication menggunakan Supabase Auth
- Loading state saat proses login
- Error handling jika login gagal

✅ **Middleware Protection**
- Otomatis redirect ke `/login` jika akses `/` tanpa login
- Otomatis redirect ke `/` jika sudah login tapi akses `/login`

✅ **Logout**
- Tombol logout di pojok kanan atas
- Menampilkan email pengguna yang login
- Redirect ke `/login` setelah logout

## Troubleshooting

### Login tidak berhasil
- Pastikan email sudah terdaftar di Supabase
- Pastikan password benar
- Periksa console browser untuk error message

### Middleware tidak bekerja
- Pastikan file `middleware.js` berada di root folder (bukan di dalam app folder)
- Restart dev server setelah membuat/mengubah middleware.js

### User info tidak muncul
- Periksa apakah `@supabase/supabase-js` sudah terinstall
- Pastikan environment variables sudah di-set dengan benar
