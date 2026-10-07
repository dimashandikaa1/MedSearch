"use client";

import { useCallback, useRef, useState } from "react";
import KameraLangsung from "@/components/KameraLangsung";
import KartuHasil from "@/components/KartuHasil";
import { tambahRiwayat } from "@/lib/riwayat";
import type { Hasil } from "@/lib/types";

/** Perkecil foto di browser agar cepat diunggah dan aman dari batas ukuran Vercel. */
async function kompres(file: Blob, sisiMaks = 1600, mutu = 0.85): Promise<{ data: string; pratinjau: string }> {
  const bitmap = await createImageBitmap(file);
  const skala = Math.min(1, sisiMaks / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * skala);
  canvas.height = Math.round(bitmap.height * skala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const pratinjau = canvas.toDataURL("image/jpeg", mutu);
  return { data: pratinjau.split(",")[1], pratinjau };
}

export default function HalamanResep() {
  const kameraCadangan = useRef<HTMLInputElement>(null);
  const galeri = useRef<HTMLInputElement>(null);
  const [kameraBuka, setKameraBuka] = useState(false);
  const [pratinjau, setPratinjau] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [terbaca, setTerbaca] = useState("");
  const [hasil, setHasil] = useState<Hasil[]>([]);
  const areaHasil = useRef<HTMLElement>(null);

  async function proses(file?: Blob | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setGalat("File harus berupa gambar.");
    setGalat("");
    setHasil([]);
    setTerbaca("");
    setMemuat(true);
    // Di HP, gulir ke area hasil agar status proses langsung terlihat
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => areaHasil.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    try {
      const { data, pratinjau } = await kompres(file);
      setPratinjau(pratinjau);
      const res = await fetch("/api/resep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gambar: data, tipe: "image/jpeg" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membaca resep.");
      setTerbaca(json.teks_terbaca);
      setHasil(json.hasil);
      tambahRiwayat({ jenis: "resep", masukan: json.teks_terbaca || "Foto resep", hasil: json.hasil });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal membaca resep.");
    } finally {
      setMemuat(false);
      if (kameraCadangan.current) kameraCadangan.current.value = "";
      if (galeri.current) galeri.current.value = "";
    }
  }

  /**
   * Buka kamera langsung di halaman (laptop & HP).
   * Bila browser tidak mendukung / bukan HTTPS, pakai kamera bawaan HP lewat input file.
   */
  function bukaKamera() {
    setGalat("");
    if (typeof navigator.mediaDevices?.getUserMedia === "function" && window.isSecureContext) {
      setKameraBuka(true);
    } else {
      kameraCadangan.current?.click();
    }
  }

  // useCallback agar komponen kamera tidak memulai ulang kamera di setiap render
  const tutupKamera = useCallback(() => setKameraBuka(false), []);
  const kameraGagal = useCallback((pesan: string) => {
    setKameraBuka(false);
    setGalat(pesan);
  }, []);
  const hasilJepret = useCallback((foto: Blob) => {
    setKameraBuka(false);
    proses(foto);
  }, []);

  const kosong = !memuat && !galat && !terbaca && hasil.length === 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      {/* ===== Kolom kiri: judul, tombol, pratinjau ===== */}
      <section className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-widest text-aksen sm:text-sm">Foto resep</p>
        <h1 className="mt-2 font-display text-[2.1rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          Baca resep dari foto
        </h1>
        <p className="mt-3 text-base text-redup sm:text-lg">
          Foto resep atau label obat dengan cahaya terang dan tulisan tegak. Istilah yang terbaca akan dijelaskan satu
          per satu.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={bukaKamera}
            disabled={memuat}
            className="flex min-h-28 flex-col justify-between rounded-2xl bg-utama p-4 text-left font-semibold text-utama-teks disabled:opacity-50 sm:p-5"
          >
            <span aria-hidden className="text-2xl">📷</span>
            <span>
              Ambil foto
              <span className="block text-xs font-normal opacity-80 sm:text-sm">Kamera langsung terbuka</span>
            </span>
          </button>
          <button
            onClick={() => galeri.current?.click()}
            disabled={memuat}
            className="flex min-h-28 flex-col justify-between rounded-2xl border-2 border-garis bg-kartu p-4 text-left font-semibold disabled:opacity-50 sm:p-5"
          >
            <span aria-hidden className="text-2xl">🖼</span>
            <span>
              Unggah gambar
              <span className="block text-xs font-normal text-redup sm:text-sm">JPG, PNG, atau WEBP</span>
            </span>
          </button>

          {/* Cadangan untuk browser tanpa dukungan kamera langsung */}
          <input
            ref={kameraCadangan}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => proses(e.target.files?.[0])}
          />
          <input
            ref={galeri}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => proses(e.target.files?.[0])}
          />
        </div>

        {pratinjau && (
          <img
            src={pratinjau}
            alt="Foto resep yang diunggah"
            className="mt-5 max-h-64 w-full rounded-2xl border border-garis bg-kartu object-contain lg:max-h-[45vh]"
          />
        )}
      </section>

      {kameraBuka && <KameraLangsung onAmbil={hasilJepret} onTutup={tutupKamera} onGagal={kameraGagal} />}

      {/* ===== Kolom kanan: hasil ===== */}
      <section ref={areaHasil} aria-live="polite" className="scroll-mt-24 space-y-4">
        {kosong && (
          <div className="hidden min-h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-garis p-10 text-center lg:flex">
            <span aria-hidden className="text-5xl">💊</span>
            <p className="mt-4 font-display text-2xl font-semibold">Hasil pembacaan resep muncul di sini</p>
            <p className="mt-2 max-w-sm text-redup">
              Tips: letakkan resep di permukaan datar, hindari bayangan, dan pastikan seluruh tulisan masuk bingkai.
            </p>
          </div>
        )}
        {memuat && (
          <p className="animate-pulse rounded-xl bg-kartu p-4 text-redup">
            Membaca tulisan di resep… (bisa 5–15 detik)
          </p>
        )}
        {galat && (
          <p role="alert" className="rounded-xl bg-bahaya-lembut p-4 text-bahaya">
            {galat}
          </p>
        )}
        {terbaca && (
          <section className="rounded-2xl border border-garis bg-kartu p-4 sm:p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-redup">Tulisan yang terbaca</h2>
            <p className="mt-2 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">{terbaca}</p>
            <p className="mt-3 text-sm text-redup">
              Cocokkan dengan resep asli. Bila ada yang keliru, tanyakan langsung ke apoteker.
            </p>
          </section>
        )}
        {hasil.length > 0 && (
          <>
            <h2 className="pt-2 font-display text-xl font-semibold">Daftar istilah terdeteksi ({hasil.length})</h2>
            <ul className="flex flex-wrap gap-2">
              {hasil.map((h, i) => (
                <li key={i}>
                  <a
                    href={`#istilah-${i}`}
                    className="block rounded-full bg-aksen-lembut px-3 py-2 text-sm font-medium text-aksen"
                  >
                    {h.istilah}
                  </a>
                </li>
              ))}
            </ul>
            {hasil.map((h, i) => (
              <div key={i} id={`istilah-${i}`} className="scroll-mt-24">
                <KartuHasil h={h} />
              </div>
            ))}
          </>
        )}
        {!memuat && terbaca && hasil.length === 0 && (
          <p className="text-redup">Tidak ada istilah medis yang bisa dikenali dari foto ini.</p>
        )}
      </section>
    </div>
  );
}
