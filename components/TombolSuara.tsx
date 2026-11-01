"use client";

import { useEffect, useRef, useState } from "react";

// Web Speech API belum punya tipe resmi di semua versi TypeScript,
// jadi tipe yang dipakai didefinisikan seperlunya di sini.
type AlternatifSuara = { transcript: string; confidence: number };
type HasilSuara = { isFinal: boolean; length: number; [i: number]: AlternatifSuara };
type EventHasil = { resultIndex: number; results: { length: number; [i: number]: HasilSuara } };
type EventGalat = { error: string };
type PengenalSuara = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: EventHasil) => void) | null;
  onerror: ((e: EventGalat) => void) | null;
  onend: (() => void) | null;
};
type KonstruktorPengenal = new () => PengenalSuara;

function ambilKonstruktor(): KonstruktorPengenal | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: KonstruktorPengenal;
    webkitSpeechRecognition?: KonstruktorPengenal;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const PESAN_GALAT: Record<string, string> = {
  "not-allowed": "Izin mikrofon ditolak. Klik ikon di kiri address bar → Microphone → Allow, lalu coba lagi.",
  "service-not-allowed": "Browser ini tidak mengizinkan pengenalan suara. Coba pakai Chrome atau Edge.",
  "no-speech": "Suara tidak terdengar. Tekan mikrofon lalu ucapkan istilahnya lebih dekat.",
  "audio-capture": "Mikrofon tidak ditemukan. Pastikan mikrofon terpasang dan tidak dipakai aplikasi lain.",
  network: "Pengenalan suara butuh koneksi internet. Periksa koneksi lalu coba lagi.",
};

type Props = {
  disabled?: boolean;
  /** Tampilan tombol besar untuk halaman Suara */
  besar?: boolean;
  /** Teks sementara saat pengguna masih bicara */
  onSementara: (teks: string) => void;
  /** Kalimat final; berisi beberapa kemungkinan, urut dari yang paling yakin */
  onSelesai: (alternatif: string[]) => void;
  onGalat: (pesan: string) => void;
};

export default function TombolSuara({ disabled, besar, onSementara, onSelesai, onGalat }: Props) {
  const [didukung, setDidukung] = useState(false);
  const [mendengar, setMendengar] = useState(false);
  const pengenal = useRef<PengenalSuara | null>(null);

  // Cek dukungan di browser saja (hindari hydration mismatch)
  useEffect(() => {
    setDidukung(ambilKonstruktor() !== null);
    return () => pengenal.current?.abort();
  }, []);

  function mulai() {
    const K = ambilKonstruktor();
    if (!K) return;

    const r = new K();
    r.lang = "id-ID";
    r.continuous = false; // berhenti otomatis setelah pengguna diam
    r.interimResults = true;
    r.maxAlternatives = 5; // kemungkinan lain dicocokkan ke kamus

    r.onresult = (e) => {
      let sementara = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const h = e.results[i];
        if (h.isFinal) {
          const alternatif: string[] = [];
          for (let j = 0; j < h.length; j++) {
            const t = h[j].transcript.trim().replace(/[.,!?]+$/, "");
            if (t && !alternatif.includes(t)) alternatif.push(t);
          }
          if (alternatif.length) onSelesai(alternatif);
        } else {
          sementara += h[0].transcript;
        }
      }
      if (sementara.trim()) onSementara(sementara.trim());
    };

    r.onerror = (e) => {
      if (e.error !== "aborted") onGalat(PESAN_GALAT[e.error] ?? "Suara gagal dikenali. Coba ucapkan sekali lagi.");
    };

    r.onend = () => {
      setMendengar(false);
      pengenal.current = null;
    };

    try {
      r.start();
      pengenal.current = r;
      setMendengar(true);
    } catch {
      onGalat("Mikrofon sedang dipakai. Tunggu sebentar lalu coba lagi.");
    }
  }

  function berhenti() {
    pengenal.current?.stop(); // stop() tetap mengirim hasil final
  }

  if (!didukung) return null;

  const ukuranTombol = besar ? "size-28 rounded-full sm:size-32" : "size-11 rounded-xl";
  const ukuranIkon = besar ? 44 : 20;

  return (
    <button
      type="button"
      onClick={mendengar ? berhenti : mulai}
      disabled={disabled && !mendengar}
      aria-pressed={mendengar}
      aria-label={mendengar ? "Berhenti mendengarkan" : "Ucapkan istilah medis"}
      title={mendengar ? "Berhenti mendengarkan" : "Ucapkan istilah medis"}
      className={`relative grid ${ukuranTombol} shrink-0 place-items-center border transition-colors disabled:opacity-40 ${
        mendengar
          ? "border-bahaya bg-bahaya-lembut text-bahaya"
          : "border-garis bg-kartu text-redup hover:border-utama hover:text-utama"
      }`}
    >
      {mendengar && (
        <span aria-hidden className={`absolute inset-0 bg-bahaya/25 motion-safe:animate-ping ${besar ? "rounded-full" : "rounded-xl"}`} />
      )}
      <svg
        viewBox="0 0 24 24"
        width={ukuranIkon}
        height={ukuranIkon}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="relative"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
        <path d="M12 18v4" />
      </svg>
    </button>
  );
}
