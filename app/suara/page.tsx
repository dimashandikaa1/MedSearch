"use client";

import { useEffect, useRef, useState } from "react";
import KartuHasil from "@/components/KartuHasil";
import TombolSuara from "@/components/TombolSuara";
import { cariPersis, keHasil } from "@/lib/kamus";
import { ambilRiwayat, tambahRiwayat } from "@/lib/riwayat";
import type { Hasil } from "@/lib/types";

const CONTOH = ["Hipertensi", "Dispepsia", "Takikardia", "Amlodipine"];

export default function HalamanSuara() {
  const [sementara, setSementara] = useState("");
  const [terdengar, setTerdengar] = useState("");
  const [alternatif, setAlternatif] = useState<string[]>([]);
  const [hasil, setHasil] = useState<Hasil[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [detik, setDetik] = useState(0);
  const areaHasil = useRef<HTMLElement>(null);

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

  async function terjemahkan(q: string) {
    q = q.trim();
    if (q.length < 2 || memuat) return;
    setGalat("");
    setHasil([]);
    setTerdengar(q);

    const persis = cariPersis(q);
    if (persis) {
      const h = [keHasil(persis)];
      setHasil(h);
      tambahRiwayat({ jenis: "suara", masukan: q, hasil: h });
      gulirKeHasil();
      return;
    }

    const kunci = q.toLowerCase().replace(/\s+/g, " ");
    const lama = ambilRiwayat().find(
      (e) => e.jenis !== "resep" && e.masukan.toLowerCase().replace(/\s+/g, " ") === kunci
    );
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
      tambahRiwayat({ jenis: "suara", masukan: q, hasil: data.hasil });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal menerjemahkan.");
    } finally {
      setMemuat(false);
    }
  }

  // Suara bisa salah dengar istilah Latin, jadi semua kemungkinan dicek ke kamus dulu
  function dariSuara(daftar: string[]) {
    setSementara("");
    setAlternatif(daftar);
    terjemahkan(daftar.find((a) => cariPersis(a)) ?? daftar[0]);
  }

  const kosong = !memuat && !galat && hasil.length === 0;
  const lainnya = alternatif.filter((a) => a !== terdengar);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      {/* ===== Kolom kiri: judul + mikrofon ===== */}
      <section className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-widest text-aksen sm:text-sm">Suara</p>
        <h1 className="mt-2 font-display text-[2.1rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          Ucapkan, kami
          <br />
          terjemahkan.
        </h1>
        <p className="mt-3 text-base text-redup sm:text-lg">
          Tekan mikrofon lalu sebutkan istilah medis atau nama obat. Cocok bila sulit mengetik atau tidak tahu
          cara menulisnya.
        </p>

        <div className="mt-8 flex flex-col items-center rounded-3xl border-2 border-garis bg-kartu p-6 text-center">
          <TombolSuara
            besar
            disabled={memuat}
            onSementara={(t) => {
              setGalat("");
              setSementara(t);
            }}
            onSelesai={dariSuara}
            onGalat={(p) => {
              setSementara("");
              setGalat(p);
            }}
          />
          <p className="mt-4 min-h-7 text-lg font-medium" aria-live="polite">
            {sementara ? (
              <span className="text-redup">“{sementara}”</span>
            ) : terdengar ? (
              <>
                Terdengar: <strong>“{terdengar}”</strong>
              </>
            ) : (
              <span className="text-redup">Tekan mikrofon untuk mulai bicara</span>
            )}
          </p>
          <p className="mt-1 text-sm text-redup">Bahasa Indonesia · butuh izin mikrofon dan koneksi internet</p>
        </div>

        {lainnya.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-redup">Bukan itu maksudnya? Coba kemungkinan lain:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {lainnya.map((a) => (
                <li key={a} className="max-w-full">
                  <button
                    onClick={() => terjemahkan(a)}
                    disabled={memuat}
                    className="max-w-full truncate rounded-full border border-garis bg-kartu px-3 py-2 text-sm hover:border-utama disabled:opacity-40"
                  >
                    {a}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm text-redup">Contoh yang bisa diucapkan:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CONTOH.map((c) => (
              <span key={c} className="rounded-full bg-aksen-lembut px-3 py-2 text-sm text-aksen">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Kolom kanan: hasil ===== */}
      <section ref={areaHasil} aria-live="polite" className="scroll-mt-24 space-y-4">
        {kosong && (
          <div className="hidden h-full min-h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-garis p-10 text-center lg:flex">
            <span aria-hidden className="text-5xl">🎤</span>
            <p className="mt-4 font-display text-2xl font-semibold">Hasil terjemahan suara muncul di sini</p>
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
