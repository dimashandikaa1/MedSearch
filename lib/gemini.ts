import type { Hasil, Istilah, Keyakinan } from "./types";

const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

/**
 * Model cadangan dipakai otomatis bila model utama sibuk (503), kena limit (429),
 * tidak ditemukan (404), atau terlalu lama. Bisa diatur lewat GEMINI_MODEL_CADANGAN
 * (dipisah koma). Model yang tidak tersedia di akunmu otomatis dilewati.
 */
const CADANGAN = (process.env.GEMINI_MODEL_CADANGAN || "gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-flash-latest")
  .split(",")
  .map((m: string) => m.trim())
  .filter(Boolean);
const DAFTAR_MODEL = [...new Set([MODEL, ...CADANGAN])];

const urlModel = (m: string) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

const BATAS_PER_MODEL = 10_000; // ms
const BATAS_TOTAL = 26_000; // ms, di bawah maxDuration Vercel

export const ATURAN_DASAR = `Kamu adalah penerjemah istilah medis ke bahasa Indonesia sehari-hari untuk orang awam.
Aturan wajib:
- Gunakan kalimat pendek dan kata yang mudah dipahami lulusan SMP. Hindari istilah medis lain tanpa penjelasan.
- JANGAN PERNAH menyebut dosis, angka miligram, atau frekuensi minum obat. Untuk aturan pakai, tulis "Ikuti petunjuk dokter atau apoteker."
- JANGAN mendiagnosis pengguna atau menyuruh mengganti/menghentikan obat.
- Bila istilah tidak dikenal, ambigu, atau tulisannya tidak jelas, isi keyakinan "rendah" dan katakan terus terang di penjelasan.
- Bila tersedia KONTEKS KAMUS, utamakan informasi dari konteks tersebut.
- "kegunaan" hanya diisi untuk obat atau tindakan; selain itu string kosong.
- "peringatan" berisi tanda bahaya yang perlu diwaspadai atau string kosong.
- Singkat: arti_awam 1 kalimat, penjelasan maksimal 2 kalimat, peringatan maksimal 2 kalimat.
- Balas HANYA dengan JSON sesuai skema, tanpa teks lain.`;

const SKEMA_ISTILAH = {
  type: "OBJECT",
  properties: {
    istilah: { type: "STRING" },
    arti_awam: { type: "STRING" },
    penjelasan: { type: "STRING" },
    kegunaan: { type: "STRING" },
    peringatan: { type: "STRING" },
    keyakinan: { type: "STRING", description: "tinggi, sedang, atau rendah" },
  },
  required: ["istilah", "arti_awam", "penjelasan", "kegunaan", "peringatan", "keyakinan"],
};

export const SKEMA_TERJEMAH = {
  type: "OBJECT",
  properties: { hasil: { type: "ARRAY", items: SKEMA_ISTILAH } },
  required: ["hasil"],
};

export const SKEMA_RESEP = {
  type: "OBJECT",
  properties: {
    teks_terbaca: { type: "STRING" },
    hasil: { type: "ARRAY", items: SKEMA_ISTILAH },
  },
  required: ["teks_terbaca", "hasil"],
};

export function konteksKamus(daftar: Istilah[]) {
  if (!daftar.length) return "KONTEKS KAMUS: (tidak ada entri yang mirip)";
  return (
    "KONTEKS KAMUS (data terverifikasi):\n" +
    daftar
      .map(
        (k) =>
          `- ${k.istilah} (${k.sinonim.join(", ")}): ${k.arti_awam} ${k.penjelasan} Peringatan: ${k.peringatan || "-"}`
      )
      .join("\n")
  );
}

type Bagian = { text: string } | { inlineData: { mimeType: string; data: string } };

export class GalatAI extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

/**
 * Matikan/kurangi "thinking" agar jawaban jauh lebih cepat.
 * - Gemini 2.5 Flash / Flash-Lite : thinkingBudget 0 (mati total)
 * - Gemini 3.x & alias "-latest"  : thinkingLevel "minimal" (paling cepat)
 * - Gemini Pro                    : biarkan default (tidak bisa dimatikan)
 * Bila model menolak pengaturan ini (400), panggilan diulang otomatis tanpa pengaturan.
 */
function konfigThinking(model: string) {
  const m = model.toLowerCase();
  if (m.includes("pro")) return {};
  if (/gemini-2\.5-flash/.test(m)) return { thinkingConfig: { thinkingBudget: 0 } };
  if (/gemini-[3-9]/.test(m) || m.endsWith("-latest")) return { thinkingConfig: { thinkingLevel: "minimal" } };
  return {};
}

type Respons = { status: number; detail: string; json?: unknown } | { status: "timeout" | "jaringan" };

async function kirim(
  key: string,
  model: string,
  bagian: Bagian[],
  skema: object | null,
  aman: boolean,
  batasMs: number
): Promise<Respons> {
  try {
    const res = await fetch(urlModel(model), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(batasMs),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: ATURAN_DASAR }] },
        contents: [{ role: "user", parts: bagian }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
          ...(skema ? { responseSchema: skema } : {}),
          // "aman" = percobaan ulang tanpa pengaturan tambahan bila model menolaknya
          ...(aman ? {} : konfigThinking(model)),
        },
      }),
    });
    if (res.ok) return { status: res.status, detail: "", json: await res.json() };
    return { status: res.status, detail: await res.text() };
  } catch (e) {
    const nama = (e as Error)?.name;
    return { status: nama === "TimeoutError" || nama === "AbortError" ? "timeout" : "jaringan" };
  }
}

function bacaGalat(status: number, detail: string, model: string): GalatAI {
  let pesan = "";
  let alasan = "";
  try {
    const j = JSON.parse(detail);
    pesan = j?.error?.message ?? "";
    alasan = JSON.stringify(j?.error?.details ?? "");
  } catch {
    pesan = detail.slice(0, 200);
  }
  const dev = process.env.NODE_ENV !== "production";
  const tambahan = dev && pesan ? ` (Detail: ${pesan})` : "";

  if (alasan.includes("API_KEY_INVALID") || /api key not valid/i.test(pesan))
    return new GalatAI("GEMINI_API_KEY tidak valid. Periksa kembali key di .env.local / Vercel.", 500);
  if (status === 401 || /ACCESS_TOKEN_TYPE_UNSUPPORTED/.test(alasan + pesan))
    return new GalatAI(
      "API key ditolak (401). Salin ulang key dengan tombol \"Copy key\" di AI Studio, atau buat key baru." + tambahan,
      500
    );
  if (status === 403)
    return new GalatAI("API key tidak punya akses ke Gemini API (403)." + tambahan, 500);
  if (status === 429)
    return new GalatAI("Batas pemakaian AI tercapai. Coba lagi sebentar lagi.", 429);
  if (status === 404)
    return new GalatAI(`Model "${model}" tidak ditemukan. Ubah GEMINI_MODEL.`, 500);
  if (/location is not supported|user location/i.test(pesan))
    return new GalatAI("Gemini API tidak tersedia dari lokasi/server ini." + tambahan, 500);
  if (status === 503 || status === 500)
    return new GalatAI("Server AI Google sedang penuh. Coba lagi beberapa saat lagi.", 503);
  return new GalatAI(`Layanan AI menolak permintaan (${status}).` + tambahan, 502);
}

/** Galat yang tidak akan beres dengan ganti model → langsung hentikan. */
function galatFatal(status: number, detail: string) {
  return status === 401 || status === 403 || /API_KEY_INVALID|api key not valid|location is not supported/i.test(detail);
}

function ambilTeks(json: unknown): string {
  const j = json as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
  const teks = j?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!teks) {
    const blok = j?.promptFeedback?.blockReason || j?.candidates?.[0]?.finishReason;
    console.error("Gemini tanpa teks", JSON.stringify(json).slice(0, 500));
    throw new GalatAI(blok ? `AI tidak menjawab (${blok}). Coba ulangi.` : "AI tidak memberikan jawaban. Coba ulangi.", 502);
  }
  return teks;
}

export async function panggilGemini<T>(bagian: Bagian[], skema: object): Promise<T> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new GalatAI("GEMINI_API_KEY belum diatur di server.", 500);

  const mulai = Date.now();
  let galatTerakhir: GalatAI = new GalatAI("Server AI Google sedang penuh. Coba lagi beberapa saat lagi.", 503);

  for (const model of DAFTAR_MODEL) {
    const sisa = BATAS_TOTAL - (Date.now() - mulai);
    if (sisa < 3_000) break;

    let r = await kirim(key, model, bagian, skema, false, Math.min(BATAS_PER_MODEL, sisa));

    // 400 (bukan masalah key) biasanya karena skema/thinking ditolak → ulangi model yang sama tanpa keduanya.
    if (r.status === 400 && !galatFatal(400, r.detail)) {
      console.warn(`Gemini [${model}] 400 → ulangi tanpa skema`, r.detail.slice(0, 200));
      const sisa2 = BATAS_TOTAL - (Date.now() - mulai);
      if (sisa2 > 3_000) r = await kirim(key, model, bagian, null, true, Math.min(BATAS_PER_MODEL, sisa2));
    }

    if (r.status === "timeout") {
      console.warn(`Gemini [${model}] terlalu lama → coba model cadangan`);
      galatTerakhir = new GalatAI("AI terlalu lama menjawab. Coba lagi sebentar lagi.", 504);
      continue;
    }
    if (r.status === "jaringan") {
      galatTerakhir = new GalatAI("Tidak bisa terhubung ke layanan AI. Periksa koneksi internet.", 502);
      continue;
    }
    if ("json" in r && r.json !== undefined) {
      if (model !== MODEL) console.info(`Gemini: dijawab oleh model cadangan ${model}`);
      const teks = ambilTeks(r.json);
      try {
        // Jaga-jaga bila model membungkus JSON dengan ```json ... ```
        const bersih = teks.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
        return JSON.parse(bersih) as T;
      } catch {
        console.error("JSON AI tidak valid", teks.slice(0, 500));
        throw new GalatAI("Format jawaban AI tidak valid. Coba ulangi.", 502);
      }
    }

    if (!("detail" in r)) continue;
    console.warn(`Gemini [${model}] ${r.status}`, r.detail.slice(0, 300));
    if (galatFatal(r.status, r.detail)) throw bacaGalat(r.status, r.detail, model);
    // 404 model tidak ada, 429 limit, 500/503 sibuk → lanjut ke model berikutnya
    galatTerakhir = bacaGalat(r.status, r.detail, model);
  }

  throw galatTerakhir;
}

type HasilMentah = Omit<Hasil, "sumber" | "slug">;

/** Rapikan keluaran AI agar aman ditampilkan. */
export function rapikan(daftar: HasilMentah[] = []): Hasil[] {
  const ok: Keyakinan[] = ["tinggi", "sedang", "rendah"];
  return daftar
    .filter((h) => h && h.istilah && h.arti_awam)
    .slice(0, 12)
    .map((h) => ({
      istilah: String(h.istilah).slice(0, 120),
      arti_awam: String(h.arti_awam),
      penjelasan: String(h.penjelasan ?? ""),
      kegunaan: String(h.kegunaan ?? ""),
      peringatan: String(h.peringatan ?? ""),
      keyakinan: ok.includes(h.keyakinan) ? h.keyakinan : "sedang",
      sumber: "ai" as const,
    }));
}
