import { NextResponse } from "next/server";
import { cariPersis, cariSerupa, keHasil, utamakanKamus } from "@/lib/kamus";
import { GalatAI, SKEMA_TERJEMAH, konteksKamus, panggilGemini, rapikan } from "@/lib/gemini";
import type { Hasil } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

// Cache sederhana di memori server: istilah yang sama tidak perlu ditanyakan ulang ke AI.
const CACHE = new Map<string, Hasil[]>();
const MAKS_CACHE = 300;

export async function POST(req: Request) {
  let teks = "";
  try {
    const body = await req.json();
    teks = String(body?.teks ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (teks.length < 2) return NextResponse.json({ error: "Ketik minimal 2 huruf." }, { status: 400 });
  if (teks.length > 600) return NextResponse.json({ error: "Teks terlalu panjang (maks 600 karakter)." }, { status: 400 });

  // 1) Cocok persis di kamus → langsung jawab, tanpa AI.
  const persis = cariPersis(teks);
  if (persis) return NextResponse.json({ hasil: [keHasil(persis)] });

  // 2) Pernah ditanyakan sebelumnya → ambil dari cache.
  const kunci = teks.toLowerCase().replace(/\s+/g, " ");
  const tersimpan = CACHE.get(kunci);
  if (tersimpan) return NextResponse.json({ hasil: tersimpan, cache: true });

  // 3) Tidak ada di kamus → AI dengan konteks kamus yang mirip (RAG sederhana).
  try {
    const konteks = konteksKamus(cariSerupa(teks, 5));
    const data = await panggilGemini<{ hasil: Omit<Hasil, "sumber">[] }>(
      [
        {
          text: `${konteks}\n\nTEKS PENGGUNA:\n"""${teks}"""\n\nTemukan setiap istilah medis di teks pengguna (bisa satu istilah atau beberapa dalam satu kalimat) lalu terjemahkan masing-masing.`,
        },
      ],
      SKEMA_TERJEMAH
    );
    const hasil = utamakanKamus(rapikan(data.hasil));
    if (!hasil.length) {
      return NextResponse.json({ error: "Tidak ditemukan istilah medis pada teks tersebut." }, { status: 404 });
    }
    if (CACHE.size >= MAKS_CACHE) CACHE.delete(CACHE.keys().next().value!);
    CACHE.set(kunci, hasil);
    return NextResponse.json({ hasil });
  } catch (e) {
    const g = e instanceof GalatAI ? e : new GalatAI("Terjadi kesalahan.", 500);
    return NextResponse.json({ error: g.message }, { status: g.status });
  }
}
