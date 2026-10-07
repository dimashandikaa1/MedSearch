import Fuse from "fuse.js";
import data from "@/data/istilah.json";
import type { Hasil, Istilah } from "./types";

export const KAMUS = (data as unknown as Istilah[])
  .slice()
  .sort((a, b) => a.istilah.localeCompare(b.istilah, "id"));

export const fuse = new Fuse(KAMUS, {
  keys: [
    { name: "istilah", weight: 0.6 },
    { name: "sinonim", weight: 0.3 },
    { name: "arti_awam", weight: 0.1 },
  ],
  includeScore: true,
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

export function normalisasi(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Cocok persis dengan nama istilah atau salah satu sinonim. */
export function cariPersis(teks: string): Istilah | undefined {
  const q = normalisasi(teks);
  const qTanpaTitik = q.replace(/\./g, "");
  return KAMUS.find((k) => {
    const nama = [k.istilah, ...k.sinonim].map(normalisasi);
    return nama.some((n) => n === q || n.replace(/\./g, "") === qTanpaTitik);
  });
}

/** Istilah serupa (fuzzy), dipakai untuk saran dan sebagai konteks AI. */
export function cariSerupa(teks: string, batas = 5): Istilah[] {
  const q = teks.trim();
  if (q.length < 2) return [];
  return fuse.search(q, { limit: batas }).map((r) => r.item);
}

export function cariSlug(slug: string) {
  return KAMUS.find((k) => k.slug === slug);
}

export function keHasil(k: Istilah): Hasil {
  return {
    istilah: k.istilah,
    arti_awam: k.arti_awam,
    penjelasan: k.penjelasan,
    kegunaan: k.kegunaan,
    peringatan: k.peringatan,
    sumber: "kamus",
    keyakinan: "tinggi",
    slug: k.slug,
  };
}

/** Bila AI menemukan istilah yang ada di kamus, ganti dengan data kamus yang terverifikasi. */
export function utamakanKamus(daftar: Hasil[]): Hasil[] {
  return daftar.map((h) => {
    const k = cariPersis(h.istilah);
    return k ? keHasil(k) : h;
  });
}
