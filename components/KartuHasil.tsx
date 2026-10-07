"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Hasil } from "@/lib/types";

function keTeks(h: Hasil) {
  const isi = [
    `${h.istilah}: ${h.arti_awam}`,
    h.penjelasan,
    h.kegunaan ? `Kegunaan & aturan pakai: ${h.kegunaan}` : "",
    h.peringatan ? `Peringatan: ${h.peringatan}` : "",
  ].filter(Boolean);
  return `${isi.join("\n")}\n\n— Terjemah Medis Awam (bukan pengganti saran dokter/apoteker)`;
}

const LABEL_KEYAKINAN = { tinggi: "Keyakinan tinggi", sedang: "Keyakinan sedang", rendah: "Keyakinan rendah" };

export default function KartuHasil({ h }: { h: Hasil }) {
  const ref = useRef<HTMLElement>(null);
  const [pesan, setPesan] = useState("");
  const [bicara, setBicara] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function kabari(t: string) {
    setPesan(t);
    setTimeout(() => setPesan(""), 2200);
  }

  async function salin() {
    try {
      await navigator.clipboard.writeText(keTeks(h));
      kabari("Teks disalin");
    } catch {
      kabari("Gagal menyalin");
    }
  }

  async function bagikan() {
    const teks = keTeks(h);
    if (navigator.share) {
      try {
        await navigator.share({ title: h.istilah, text: teks });
      } catch {
        /* dibatalkan pengguna */
      }
    } else {
      await salin();
    }
  }

  async function simpanGambar() {
    if (!ref.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const latar = getComputedStyle(document.documentElement).getPropertyValue("--kartu-padat").trim() || "#ffffff";
      const url = await toPng(ref.current, {
        backgroundColor: latar,
        pixelRatio: 2,
        filter: (n) => !(n instanceof HTMLElement && n.dataset.abaikan === "ya"),
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${h.istilah.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      a.click();
      kabari("Gambar disimpan");
    } catch {
      kabari("Gagal membuat gambar");
    }
  }

  function bacakan() {
    const s = window.speechSynthesis;
    if (!s) return kabari("Browser tidak mendukung suara");
    if (bicara) {
      s.cancel();
      setBicara(false);
      return;
    }
    s.cancel();
    const u = new SpeechSynthesisUtterance(keTeks(h).split("\n— ")[0]);
    u.lang = "id-ID";
    u.rate = 0.92;
    const suaraId = s.getVoices().find((v) => v.lang.toLowerCase().startsWith("id"));
    if (suaraId) u.voice = suaraId;
    u.onend = () => setBicara(false);
    u.onerror = () => setBicara(false);
    setBicara(true);
    s.speak(u);
  }

  const tombol =
    "min-h-11 rounded-xl border border-garis px-3 py-2 text-sm font-medium transition-colors hover:border-tinta sm:min-h-0 sm:py-1.5";

  return (
    <article ref={ref} className="rounded-2xl border border-garis bg-kartu p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        {h.sumber === "kamus" ? (
          <span className="rounded-full bg-aksen-lembut px-2.5 py-1 text-aksen">✓ Dari kamus terverifikasi</span>
        ) : (
          <span className="rounded-full bg-ai-lembut px-2.5 py-1 text-ai">Penjelasan AI</span>
        )}
        {h.sumber === "ai" && (
          <span
            className={`rounded-full px-2.5 py-1 ${
              h.keyakinan === "rendah" ? "bg-bahaya-lembut text-bahaya" : "bg-ai-lembut text-ai"
            }`}
          >
            {LABEL_KEYAKINAN[h.keyakinan]}
          </span>
        )}
      </div>

      <h3 className="mt-3 break-words font-display text-2xl font-semibold leading-tight sm:text-[1.75rem]">{h.istilah}</h3>
      <p className="mt-2 text-lg leading-snug sm:text-xl">{h.arti_awam}</p>
      {h.penjelasan && <p className="mt-3 leading-relaxed text-redup">{h.penjelasan}</p>}

      {h.kegunaan && (
        <section className="mt-4">
          <h4 className="text-sm font-bold uppercase tracking-wide text-redup">Kegunaan & aturan pakai</h4>
          <p className="mt-1 leading-relaxed">{h.kegunaan}</p>
        </section>
      )}
      {h.peringatan && (
        <section className="mt-4 rounded-xl border-l-4 border-bahaya bg-bahaya-lembut p-3">
          <h4 className="text-sm font-bold text-bahaya">⚠ Efek samping & peringatan</h4>
          <p className="mt-1 leading-relaxed">{h.peringatan}</p>
        </section>
      )}
      {h.sumber === "ai" && (
        <p className="mt-4 text-sm text-redup">
          Dibuat oleh AI dan bisa keliru. Pastikan kembali ke dokter atau apoteker.
        </p>
      )}

      {/* HP: tombol 2×2 yang besar & mudah disentuh · desktop: satu baris */}
      <div data-abaikan="ya" className="mt-5 border-t border-garis pt-4">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button className={tombol} onClick={bacakan} aria-pressed={bicara}>
            {bicara ? "■ Berhenti" : "🔊 Bacakan"}
          </button>
          <button className={tombol} onClick={salin}>📋 Salin</button>
          <button className={tombol} onClick={bagikan}>↗ Bagikan</button>
          <button className={tombol} onClick={simpanGambar}>🖼 Simpan gambar</button>
          {h.slug && (
            <Link
              href={`/kamus/${h.slug}`}
              className="col-span-2 py-2 text-center text-sm font-medium text-utama underline-offset-4 hover:underline sm:ml-auto sm:py-0"
            >
              Buka di kamus →
            </Link>
          )}
        </div>
        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-center text-sm text-redup sm:text-left">
          {pesan}
        </p>
      </div>
    </article>
  );
}
