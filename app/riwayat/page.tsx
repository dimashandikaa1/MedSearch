"use client";

import { useEffect, useMemo, useState } from "react";
import KartuHasil from "@/components/KartuHasil";
import { ambilRiwayat, hapusRiwayat, kosongkanRiwayat } from "@/lib/riwayat";
import type { EntriRiwayat } from "@/lib/types";

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export default function HalamanRiwayat() {
  const [daftar, setDaftar] = useState<EntriRiwayat[]>([]);
  const [siap, setSiap] = useState(false);
  const [q, setQ] = useState("");
  const [buka, setBuka] = useState<string | null>(null);

  useEffect(() => {
    setDaftar(ambilRiwayat());
    setSiap(true);
  }, []);

  const tersaring = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return daftar;
    return daftar.filter(
      (e) =>
        e.masukan.toLowerCase().includes(s) ||
        e.hasil.some((h) => h.istilah.toLowerCase().includes(s) || h.arti_awam.toLowerCase().includes(s))
    );
  }, [daftar, q]);

  function hapus(id: string) {
    hapusRiwayat(id);
    setDaftar(ambilRiwayat());
  }

  function kosongkan() {
    if (!confirm("Hapus semua riwayat di perangkat ini?")) return;
    kosongkanRiwayat();
    setDaftar([]);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-aksen sm:text-sm">Riwayat</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[2.1rem] font-semibold leading-tight tracking-tight sm:text-5xl">
          Riwayat terjemahan
        </h1>
        {daftar.length > 0 && (
          <button onClick={kosongkan} className="text-sm font-medium text-bahaya hover:underline">
            Hapus semua
          </button>
        )}
      </div>
      <p className="mt-2 text-redup">Tersimpan hanya di perangkat ini, tidak dikirim ke server.</p>

      {daftar.length > 0 && (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari di riwayat…"
          aria-label="Cari di riwayat"
          className="mt-6 w-full rounded-2xl border-2 border-garis bg-kartu px-4 py-3 text-base outline-none focus:border-utama"
        />
      )}

      {siap && daftar.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-garis p-8 text-center text-redup">
          Belum ada riwayat. Hasil terjemahan dan foto resep akan muncul di sini.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {tersaring.map((e) => (
          <li key={e.id} className="rounded-2xl border border-garis bg-kartu">
            <div className="flex items-start gap-3 p-4">
              <button
                className="flex-1 text-left"
                onClick={() => setBuka(buka === e.id ? null : e.id)}
                aria-expanded={buka === e.id}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-redup">
                  {e.jenis === "resep" ? "📷 Foto resep" : e.jenis === "suara" ? "🎤 Suara" : "⌨ Teks"} · {fmt.format(e.waktu)}
                </span>
                <span className="mt-1 line-clamp-2 block font-semibold">{e.masukan}</span>
                <span className="mt-1 block text-sm text-redup">
                  {e.hasil.map((h) => h.istilah).join(", ")}
                </span>
              </button>
              <button
                onClick={() => hapus(e.id)}
                aria-label="Hapus entri"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-redup hover:text-bahaya"
              >
                ✕
              </button>
            </div>
            {buka === e.id && (
              <div className="space-y-3 border-t border-garis p-2 sm:p-3">
                {e.hasil.map((h, i) => (
                  <KartuHasil key={i} h={h} />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      {siap && daftar.length > 0 && tersaring.length === 0 && <p className="mt-6 text-redup">Tidak ada yang cocok.</p>}
    </div>
  );
}
