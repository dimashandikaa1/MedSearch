"use client";

import { useEffect, useRef, useState } from "react";
import KartuHasil from "@/components/KartuHasil";
import TombolSuara from "@/components/TombolSuara";
import { cariPersis, cariSerupa, keHasil } from "@/lib/kamus";
import { ambilRiwayat, tambahRiwayat } from "@/lib/riwayat";
import type { Hasil, Istilah } from "@/lib/types";

const CONTOH = ["Hipertensi", "3 dd 1 p.c.", "Pasien mengalami dispepsia dan febris", "Takikardia"];

export default function HalamanTerjemah() {
  const [teks, setTeks] = useState("");
  const [saran, setSaran] = useState<Istilah[]>([]);
  const [hasil, setHasil] = useState<Hasil[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [detik, setDetik] = useState(0);
  const areaHasil = useRef<HTMLElement>(null);

  // Di HP, hasil muncul di bawah form → gulir otomatis agar langsung terlihat
  function gulirKeHasil() {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => areaHasil.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  // Hitung lama menunggu agar pengguna tahu proses masih berjalan
  useEffect(() => {
    if (!memuat) return setDetik(0);
    const t = setInterval(() => setDetik((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [memuat]);

  // Saran istilah serupa (debounce 250 ms)
  useEffect(() => {
    const t = setTimeout(() => setSaran(teks.length >= 2 ? cariSerupa(teks, 5) : []), 250);
    return () => clearTimeout(t);
  }, [teks]);

  async function terjemahkan(masukan = teks) {
    const q = masukan.trim();
    if (q.length < 2 || memuat) return;
    setGalat("");
    setHasil([]);

    const persis = cariPersis(q);
    if (persis) {
      const h = [keHasil(persis)];
      setHasil(h);
      tambahRiwayat({ jenis: "teks", masukan: q, hasil: h });
      gulirKeHasil();
      return;
    }

    // Pernah dicari di perangkat ini → tampilkan langsung dari riwayat
    const kunci = q.toLowerCase().replace(/\s+/g, " ");
    const lama = ambilRiwayat().find((e) => e.jenis === "teks" && e.masukan.toLowerCase().replace(/\s+/g, " ") === kunci);
    if (lama) {
      setHasil(lama.hasil);
      gulirKeHasil();
      return;
    }

    setMemuat(true);
    gulirKeHasil();
    try {
      const res = await fetch("/api/terjemah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teks: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menerjemahkan.");
      setHasil(data.hasil);
      tambahRiwayat({ jenis: "teks", masukan: q, hasil: data.hasil });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal menerjemahkan.");
    } finally {
      setMemuat(false);
    }
  }

  function pilih(s: string) {
    setTeks(s);
    terjemahkan(s);
  }

  // Suara bisa salah dengar istilah Latin, jadi semua kemungkinan dicek ke kamus dulu
  function dariSuara(alternatif: string[]) {
    const terbaik = alternatif.find((a) => cariPersis(a)) ?? alternatif[0];
    pilih(terbaik);
  }

  const kosong = !memuat && !galat && hasil.length === 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      {/* ===== Kolom kiri: judul + form (menempel saat digulir di desktop) ===== */}
      <section className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-widest text-aksen sm:text-sm">Terjemah istilah</p>
        <h1 className="mt-2 font-display text-[2.1rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          Bahasa dokter,
          <br />
          jadi bahasa kita.
        </h1>
        <p className="mt-3 text-base text-redup sm:text-lg">
          Ketik, tempel, atau ucapkan istilah medis, kalimat dari hasil pemeriksaan, atau singkatan di resep.
        </p>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            terjemahkan();
          }}
        >
          <label htmlFor="masukan" className="sr-only">
            Istilah medis
          </label>
          <div className="rounded-2xl border-2 border-garis bg-kartu p-2 focus-within:border-utama">
            <textarea
              id="masukan"
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  terjemahkan();
                }
              }}
              rows={3}
              maxLength={600}
              enterKeyHint="search"
              autoCapitalize="none"
              placeholder="Contoh: dispepsia, amlodipine, 3 dd 1 a.c."
              className="w-full resize-none bg-transparent px-3 py-2 text-lg outline-none placeholder:text-redup/70"
            />
            <div className="flex items-center justify-between gap-2 px-2 pb-1">
              <div className="flex items-center gap-3">
                <TombolSuara
                  disabled={memuat}
                  onSementara={(t) => {
                    setGalat("");
                    setTeks(t);
                  }}
                  onSelesai={dariSuara}
                  onGalat={setGalat}
                />
                <span className="text-xs text-redup">{teks.length}/600</span>
              </div>
              <button
                type="submit"
                disabled={memuat || teks.trim().length < 2}
                className="min-h-11 rounded-xl bg-utama px-5 py-2.5 font-semibold text-utama-teks disabled:opacity-40"
              >
                {memuat ? "Menerjemahkan…" : "Terjemahkan"}
              </button>
            </div>
          </div>
        </form>

        {saran.length > 0 && hasil.length === 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-redup">Istilah serupa di kamus:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {saran.map((s) => (
                <li key={s.slug} className="max-w-full">
                  <button
                    onClick={() => pilih(s.istilah)}
                    className="max-w-full truncate rounded-full border border-garis bg-kartu px-3 py-2 text-left text-sm hover:border-utama"
                  >
                    <strong>{s.istilah}</strong> <span className="text-redup">· {s.arti_awam.split(/[.;]/)[0]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!teks && hasil.length === 0 && (
          <div className="mt-5">
            <p className="text-sm text-redup">Coba contoh:</p>
            {/* HP: geser ke samping · desktop: membungkus */}
            <div className="geser-x -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {CONTOH.map((c) => (
                <button
                  key={c}
                  onClick={() => pilih(c)}
                  className="shrink-0 rounded-full bg-aksen-lembut px-3 py-2 text-sm text-aksen"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== Kolom kanan: hasil ===== */}
      <section ref={areaHasil} aria-live="polite" className="scroll-mt-24 space-y-4">
        {kosong && (
          <div className="hidden h-full min-h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-garis p-10 text-center lg:flex">
            <span aria-hidden className="text-5xl">🩺</span>
            <p className="mt-4 font-display text-2xl font-semibold">Hasil terjemahan muncul di sini</p>
            <p className="mt-2 max-w-sm text-redup">
              Istilah dari kamus tampil instan. Istilah lain dijelaskan oleh AI dalam beberapa detik.
            </p>
          </div>
        )}
        {memuat && (
          <div className="animate-pulse rounded-2xl border border-garis bg-kartu p-5 sm:p-6">
            <p className="mb-4 text-sm text-redup">
              {detik < 3
                ? "Tidak ada di kamus, menanyakan ke AI…"
                : detik < 10
                  ? `AI sedang menyusun penjelasan… (${detik} dtk)`
                  : `Masih diproses, mohon tunggu… (${detik} dtk)`}
            </p>
            <div className="h-6 w-1/3 rounded bg-garis" />
            <div className="mt-3 h-5 w-2/3 rounded bg-garis" />
            <div className="mt-2 h-4 w-full rounded bg-garis" />
          </div>
        )}
        {galat && (
          <p role="alert" className="rounded-xl bg-bahaya-lembut p-4 text-bahaya">
            {galat}
          </p>
        )}
        {hasil.map((h, i) => (
          <KartuHasil key={`${h.istilah}-${i}`} h={h} />
        ))}
      </section>
    </div>
  );
}
