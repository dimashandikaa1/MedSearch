import type { Metadata } from "next";
import JelajahKamus from "@/components/JelajahKamus";

export const metadata: Metadata = {
  title: "Kamus Istilah Medis",
  description: "Cari dan telusuri istilah medis dari A sampai Z dengan penjelasan bahasa awam.",
};

export default function HalamanKamus() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-aksen sm:text-sm">Kamus</p>
      <h1 className="mt-2 font-display text-[2.1rem] font-semibold leading-tight tracking-tight sm:text-5xl">
        Kamus istilah medis
      </h1>
      <p className="mt-2 text-base text-redup sm:text-lg">Semua entri di sini sudah dikurasi dan tidak dibuat oleh AI.</p>
      <JelajahKamus />
    </div>
  );
}
