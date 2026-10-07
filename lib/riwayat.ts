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

export function tambahRiwayat(e: Omit<EntriRiwayat, "id" | "waktu">) {
  if (!e.hasil.length) return;
  const baru: EntriRiwayat = { ...e, id: crypto.randomUUID(), waktu: Date.now() };
  simpan([baru, ...ambilRiwayat()]);
}

export function hapusRiwayat(id: string) {
  simpan(ambilRiwayat().filter((e) => e.id !== id));
}

export function kosongkanRiwayat() {
  simpan([]);
}
