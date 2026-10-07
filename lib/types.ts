export type Istilah = {
  slug: string;
  istilah: string;
  kategori: string;
  sinonim: string[];
  arti_awam: string;
  penjelasan: string;
  kegunaan: string;
  peringatan: string;
  populer: boolean;
};

export type Keyakinan = "tinggi" | "sedang" | "rendah";

/** Satu hasil terjemahan yang ditampilkan ke pengguna. */
export type Hasil = {
  istilah: string;
  arti_awam: string;
  penjelasan: string;
  kegunaan: string;
  peringatan: string;
  sumber: "kamus" | "ai";
  keyakinan: Keyakinan;
  slug?: string;
};

export type EntriRiwayat = {
  id: string;
  waktu: number;
  jenis: "teks" | "resep";
  masukan: string;
  hasil: Hasil[];
};
