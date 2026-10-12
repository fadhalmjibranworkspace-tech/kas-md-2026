# Portal MD 2026

| Alamat | Isi |
|---|---|
| `/` | Portal: menu utama (SAKU MD, Academic Tools, Document Tools, MD Intelligence) |
| `/saku` | Aplikasi kas angkatan (admin, login) |
| `/publik` | Transparansi kas untuk mahasiswa (tanpa login), alamat tidak berubah |
| `/academic` `/document` `/ai` | Halaman daftar alat per kategori |
| `/tools/<nama>` | Satu alat = satu file di `public/tools/` |

## Menambah alat baru
1. Salin `public/tools/random-picker.html` sebagai dasar, ganti isinya.
2. Di `public/hub.js`, pada kategori yang sesuai (`HUB`), tambahkan `h:'/tools/nama-file'` ke alat tersebut.
   Alat tanpa `h` tampil sebagai "Segera" dan tidak bisa diklik. Tidak ada file lain yang perlu diubah.

---

# Saku Angkatan MD'26 — Vercel

Frontend jalan di Vercel (tanpa banner Google). Data & logika tetap di Google Sheets + Apps Script,
yang sekarang berfungsi sebagai API tersembunyi di belakang `/api/rpc`.

## 1. Update Apps Script
1. Buka project GAS, ganti isi `kas.gs` dengan `gas/kas.gs` (isinya sama + fungsi `doPost` di bagian bawah).
2. Project Settings (ikon roda gigi) > Script properties > Add: `RPC_SECRET` = string acak panjang (min. 32 karakter).
3. Deploy > Manage deployments > ikon pensil > Version: **New version** > Deploy.
   Pastikan: Execute as **Me**, Who has access **Anyone**. URL `/exec` tidak berubah.
4. Salin URL web app (`https://script.google.com/macros/s/.../exec`).

## 2. Deploy ke Vercel
1. Push folder ini ke GitHub (repo baru), lalu Vercel > Add New > Project > import repo itu.
   (Atau pakai CLI: `npm i -g vercel` lalu `vercel` di folder ini.)
2. Settings > Environment Variables:
   - `GAS_URL`    = URL `/exec` dari langkah 1.4
   - `GAS_SECRET` = nilai yang sama dengan `RPC_SECRET`
3. Deploy (atau Redeploy kalau env var diisi setelah deploy pertama).

## Hasil
- Admin:      https://<project>.vercel.app/saku
- Mahasiswa:  https://<project>.vercel.app/publik

## Export (PDF & teks)
Menu **Export** ada di Pengaturan, tombol Export di detail iuran, dan tombol Export riwayat. Popup-nya mengatur format (PDF / teks untuk disalin), data (ringkasan saldo, status iuran, riwayat), kelas, status lunas/belum lunas, jenis & metode transaksi, serta periode.

PDF dibuat di browser dengan jsPDF + AutoTable yang dimuat saat pertama kali dibutuhkan (dari `/vendor/` jika ada, lalu cdnjs, lalu jsDelivr). Agar bisa dipakai tanpa internet, taruh `jspdf.umd.min.js` (v2.5.1) dan `jspdf.plugin.autotable.min.js` (v3.8.2) di `public/vendor/`.
