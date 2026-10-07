"use client";

import { useEffect, useState } from "react";

type Teks = "normal" | "besar" | "sangat-besar";
type Akses = { teks: Teks; kontras: "normal" | "tinggi" };

const KUNCI = "tma-akses";
const URUTAN: Teks[] = ["normal", "besar", "sangat-besar"];

function terapkan(a: Akses) {
  const el = document.documentElement;
  el.dataset.teks = a.teks;
  el.dataset.kontras = a.kontras;
  try {
    localStorage.setItem(KUNCI, JSON.stringify(a));
  } catch {}
}

export default function Aksesibilitas() {
  const [a, setA] = useState<Akses>({ teks: "normal", kontras: "normal" });

  useEffect(() => {
    try {
      const simpanan = JSON.parse(localStorage.getItem(KUNCI) || "{}");
      setA({ teks: simpanan.teks ?? "normal", kontras: simpanan.kontras ?? "normal" });
    } catch {}
  }, []);

  function ubah(baru: Akses) {
    setA(baru);
    terapkan(baru);
  }

  const idx = URUTAN.indexOf(a.teks);
  const tombol =
    "h-10 min-w-10 rounded-xl border border-garis bg-kartu px-2 text-sm font-semibold disabled:opacity-40 sm:h-9 sm:min-w-9";

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-1.5" role="group" aria-label="Mode mudah dibaca">
      <button
        className={tombol}
        onClick={() => ubah({ ...a, teks: URUTAN[Math.max(0, idx - 1)] })}
        disabled={idx === 0}
        aria-label="Perkecil teks"
      >
        A−
      </button>
      <button
        className={tombol}
        onClick={() => ubah({ ...a, teks: URUTAN[Math.min(2, idx + 1)] })}
        disabled={idx === 2}
        aria-label="Perbesar teks"
      >
        A+
      </button>
      <button
        className={`${tombol} ${a.kontras === "tinggi" ? "bg-utama text-utama-teks" : ""}`}
        onClick={() => ubah({ ...a, kontras: a.kontras === "tinggi" ? "normal" : "tinggi" })}
        aria-pressed={a.kontras === "tinggi"}
        aria-label="Kontras tinggi"
        title="Kontras tinggi"
      >
        ◐
      </button>
    </div>
  );
}
