# Terjemah Medis Awam

Web untuk menerjemahkan istilah medis, singkatan resep, dan foto resep menjadi bahasa sehari-hari.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Fuse.js · Gemini API · localStorage · Vercel

---

## Cara menjalankan (paling cepat)

### Windows
1. Pastikan **Node.js 20 atau lebih baru** sudah terpasang (https://nodejs.org, pilih versi LTS).
2. Ekstrak zip, lalu **klik dua kali `jalankan.bat`**.
3. Saat pertama kali, Notepad akan terbuka berisi `.env.local`. Ganti `isi_api_key_kamu_di_sini` dengan API key Gemini, simpan (Ctrl+S), lalu tutup Notepad.
4. Tunggu sampai muncul `Ready`, lalu buka **http://localhost:3000**.

### Manual (Windows / Mac / Linux)
```bash
npm install
cp .env.example .env.local      # Windows CMD: copy .env.example .env.local
# buka .env.local, isi GEMINI_API_KEY
npm run dev
```
Buka http://localhost:3000

API key gratis: https://aistudio.google.com/apikey (gunakan tombol **Copy key**).

---

## Environment variables

| Nama | Wajib | Contoh | Keterangan |
|---|---|---|---|
| `GEMINI_API_KEY` | Ya | (rahasia) | Kunci dari Google AI Studio |
| `GEMINI_MODEL` | Tidak | `gemini-3.5-flash-lite` | Model utama |
| `GEMINI_MODEL_CADANGAN` | Tidak | `gemini-flash-lite-latest,gemini-flash-latest` | Model cadangan bila model utama sibuk/tidak tersedia |

Daftar model yang tersedia untuk akunmu bisa dilihat di AI Studio, atau:
```powershell
(Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models" -Headers @{ "x-goog-api-key" = "KEY_KAMU" }).models | Select-Object name
```

---

## Fitur

| Fase | Fitur | Lokasi kode |
|---|---|---|
| 1 | Terjemah ketik langsung, saran istilah serupa | `app/page.tsx`, `lib/kamus.ts`, `app/api/terjemah` |
| 2 | Penjelasan awam, kegunaan, peringatan | `components/KartuHasil.tsx`, `data/istilah.json` |
| 2 | Foto resep: kamera langsung & unggah gambar | `app/resep/page.tsx`, `components/KameraLangsung.tsx`, `app/api/resep` |
| 2 | Suara: ucapkan istilah medis (halaman sendiri di menu) | `app/suara/page.tsx`, `components/TombolSuara.tsx` |
| 2 | Kamus: cari, A–Z, populer, halaman detail | `app/kamus`, `components/JelajahKamus.tsx` |
| 3 | Riwayat: daftar, buka ulang, cari, hapus | `app/riwayat/page.tsx`, `lib/riwayat.ts` |
| 4 | Bagikan, salin, simpan sebagai gambar | `components/KartuHasil.tsx` |
| 4 | Perbesar teks, kontras tinggi, bacakan suara | `components/Aksesibilitas.tsx`, `components/KartuHasil.tsx` |
| UI | Glassmorphism, mode gelap, responsif HP/desktop | `app/globals.css`, `components/Navigasi.tsx` |

### Alur terjemah
1. **Kamus**: teks cocok persis dengan istilah/sinonim → dijawab instan tanpa AI.
2. **Cache**: pernah dicari (di browser atau server) → dijawab instan.
3. **RAG + AI**: 5 entri kamus paling mirip dikirim sebagai konteks ke Gemini, jawaban berupa JSON terstruktur.
4. **Verifikasi**: istilah hasil AI yang ada di kamus diganti data kamus terverifikasi.
5. **Model cadangan**: bila model sibuk (503), limit (429), tidak ada (404), atau lambat → pindah ke model berikutnya.

AI dilarang menyebut dosis atau mendiagnosis; setiap hasil AI diberi label dan tingkat keyakinan.

---

## Deploy ke Vercel

1. Uji dulu: `npm run build` harus selesai tanpa error.
2. Push ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "Terjemah Medis Awam"
   git branch -M main
   git remote add origin https://github.com/USERNAME/terjemah-medis-awam.git
   git push -u origin main
   ```
3. Di https://vercel.com → **Add New → Project** → pilih repository → **Import**.
4. Isi **Environment Variables**: `GEMINI_API_KEY` dan `GEMINI_MODEL`.
5. Klik **Deploy**.

Perubahan berikutnya cukup `git add . && git commit -m "update" && git push`; Vercel deploy ulang otomatis.

> Kamera langsung hanya bisa di **HTTPS** atau **localhost**. Untuk uji kamera di HP, gunakan link Vercel.

---

## Mengubah konten

- **Judul pojok kiri atas:** `components/Navigasi.tsx`
- **Judul tab browser:** `app/layout.tsx` (bagian `metadata`)
- **Menambah istilah:** tambahkan objek baru di `data/istilah.json` (`slug` unik, huruf kecil, pakai tanda hubung)
- **Warna & tema:** variabel CSS di bagian atas `app/globals.css`

## Masalah umum

| Pesan | Solusi |
|---|---|
| GEMINI_API_KEY belum diatur | Isi `.env.local`, lalu hentikan (Ctrl+C) dan jalankan ulang `npm run dev` |
| API key tidak valid / ditolak (401) | Salin ulang dengan tombol **Copy key** atau buat key baru |
| Model tidak ditemukan | Ganti `GEMINI_MODEL` dengan model yang tersedia di akunmu |
| Server AI sedang penuh / terlalu lama | Sementara dari Google; tunggu sebentar, model cadangan dipakai otomatis |
| Izin kamera ditolak | Klik ikon di kiri address bar → Camera → Allow, lalu refresh |

---

Informasi bersifat edukasi dan bukan pengganti konsultasi dengan dokter atau apoteker.
