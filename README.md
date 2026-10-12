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
- Admin:      https://<project>.vercel.app/
- Mahasiswa:  https://<project>.vercel.app/publik
