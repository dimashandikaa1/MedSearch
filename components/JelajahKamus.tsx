"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KAMUS, cariSerupa } from "@/lib/kamus";
import type { Istilah } from "@/lib/types";

const HURUF = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function hurufAwal(k: Istilah) {
  const c = k.istilah.trim()[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(c) ? c : "#";
}

function Baris({ k }: { k: Istilah }) {
  return (
    <li>
      <Link
        href={`/kamus/${k.slug}`}
        className="flex h-full items-start justify-between gap-3 rounded-2xl border border-garis bg-kartu px-4 py-3.5 transition-colors hover:border-utama"
      >
        <span className="min-w-0">
          <strong className="font-semibold">{k.istilah}</strong>
          <span className="mt-0.5 block text-sm text-redup sm:text-base">{k.arti_awam}</span>
        </span>
        <span className="shrink-0 rounded-full bg-ai-lembut px-2 py-0.5 text-[11px] font-medium text-ai">{k.kategori}</span>
      </Link>
    </li>
  );
}

export default function JelajahKamus() {
  const [q, setQ] = useState("");
  const [huruf, setHuruf] = useState<string | null>(null);

  const ada = useMemo(() => new Set(KAMUS.map(hurufAwal)), []);
  const populer = useMemo(() => KAMUS.filter((k) => k.populer), []);
  const hasilCari = useMemo(() => (q.trim().length >= 2 ? cariSerupa(q, 20) : []), [q]);
  const daftar = huruf ? KAMUS.filter((k) => hurufAwal(k) === huruf) : KAMUS;

  return (
    <div className="mt-6">
      <label htmlFor="cari" className="sr-only">
        Cari istilah
      </label>
      <input
        id="cari"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari istilah, nama obat, atau sebutan sehari-hari…"
        className="w-full rounded-2xl border-2 border-garis bg-kartu px-4 py-3 text-lg outline-none focus:border-utama lg:max-w-2xl"
      />

      {q.trim().length >= 2 ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-redup">
            {hasilCari.length ? `${hasilCari.length} hasil` : "Tidak ditemukan. Coba fitur Terjemah untuk penjelasan AI."}
          </h2>
          <ul className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {hasilCari.map((k) => (
              <Baris key={k.slug} k={k} />
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Istilah populer</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {populer.map((k) => (
                <li key={k.slug}>
                  <Link
                    href={`/kamus/${k.slug}`}
                    className="block rounded-full bg-aksen-lembut px-3 py-2 text-sm font-medium text-aksen"
                  >
                    {k.istilah}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Telusuri A–Z</h2>
            {/* HP: satu baris yang bisa digeser · desktop: membungkus */}
            <div
              className="geser-x -mx-4 mt-3 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
              role="group"
              aria-label="Pilih huruf"
            >
              <button
                onClick={() => setHuruf(null)}
                aria-pressed={huruf === null}
                className={`h-10 shrink-0 rounded-xl border border-garis px-3 text-sm font-semibold sm:h-9 ${huruf === null ? "bg-utama text-utama-teks" : "bg-kartu"}`}
              >
                Semua
              </button>
              {HURUF.map((h) => (
                <button
                  key={h}
                  disabled={!ada.has(h)}
                  onClick={() => setHuruf(h)}
                  aria-pressed={huruf === h}
                  className={`h-10 w-10 shrink-0 rounded-xl border border-garis text-sm font-semibold disabled:opacity-25 sm:h-9 sm:w-9 ${
                    huruf === h ? "bg-utama text-utama-teks" : "bg-kartu"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <ul className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {daftar.map((k) => (
                <Baris key={k.slug} k={k} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
