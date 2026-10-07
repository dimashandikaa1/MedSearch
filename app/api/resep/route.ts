import { NextResponse } from "next/server";
import { KAMUS, utamakanKamus } from "@/lib/kamus";
import { GalatAI, SKEMA_RESEP, panggilGemini, rapikan } from "@/lib/gemini";
import type { Hasil } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 45;

const TIPE_OK = ["image/jpeg", "image/png", "image/webp"];
const MAKS_BASE64 = 4_000_000; // ~3 MB gambar, di bawah batas body Vercel (4,5 MB)

export async function POST(req: Request) {
  let gambar = "";
  let tipe = "";
  try {
    const body = await req.json();
    gambar = String(body?.gambar ?? "");
    tipe = String(body?.tipe ?? "");
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (!gambar || !TIPE_OK.includes(tipe)) {
    return NextResponse.json({ error: "Kirim foto berformat JPG, PNG, atau WEBP." }, { status: 400 });
  }
  if (gambar.length > MAKS_BASE64) {
    return NextResponse.json({ error: "Ukuran foto terlalu besar." }, { status: 413 });
  }

  // Daftar singkatan resep dari kamus sebagai konteks agar AI membaca konsisten.
  const singkatan = KAMUS.filter((k) => k.kategori === "Singkatan resep")
    .map((k) => `${k.istilah} = ${k.arti_awam}`)
    .join("\n");

  try {
    const data = await panggilGemini<{ teks_terbaca: string; hasil: Omit<Hasil, "sumber">[] }>(
      [
        { inlineData: { mimeType: tipe, data: gambar } },
        {
          text: `Ini foto resep atau dokumen medis.
1. Tulis ulang teks yang terbaca ke "teks_terbaca" (tandai bagian yang tidak terbaca dengan [?]).
2. Untuk setiap nama obat, singkatan aturan pakai, atau istilah medis yang terbaca, buat satu entri di "hasil".
3. Bila tulisan tidak jelas, beri keyakinan "rendah". Jangan menebak nama obat.
4. Jangan menuliskan dosis di bagian penjelasan; dosis yang tertulis di resep cukup ada di teks_terbaca.
Bila gambar bukan resep atau dokumen medis, kembalikan hasil kosong dan jelaskan di teks_terbaca.

Singkatan resep yang umum:
${singkatan}`,
        },
      ],
      SKEMA_RESEP
    );
    return NextResponse.json({
      teks_terbaca: String(data.teks_terbaca ?? ""),
      hasil: utamakanKamus(rapikan(data.hasil)),
    });
  } catch (e) {
    const g = e instanceof GalatAI ? e : new GalatAI("Terjadi kesalahan.", 500);
    return NextResponse.json({ error: g.message }, { status: g.status });
  }
}
