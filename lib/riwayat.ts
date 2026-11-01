import type { EntriRiwayat } from "./types";

const KUNCI = "tma-riwayat";
const MAKS = 100;

export function ambilRiwayat(): EntriRiwayat[] {
  try {
    return JSON.parse(localStorage.getItem(KUNCI) || "[]");
  } catch {
    return [];
  }
}

function simpan(daftar: EntriRiwayat[]) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(daftar.slice(0, MAKS)));
  } catch {
    /* penyimpanan penuh atau diblokir */
  }
}

/** crypto.randomUUID hanya ada di HTTPS/localhost; sediakan cadangan untuk akses lewat IP lokal. */
function buatId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function tambahRiwayat(e: Omit<EntriRiwayat, "id" | "waktu">) {
  if (!e.hasil?.length) return;
  const baru: EntriRiwayat = { ...e, id: buatId(), waktu: Date.now() };
  simpan([baru, ...ambilRiwayat()]);
}

export function hapusRiwayat(id: string) {
  simpan(ambilRiwayat().filter((e) => e.id !== id));
}

export function kosongkanRiwayat() {
  simpan([]);
}
