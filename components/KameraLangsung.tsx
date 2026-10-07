"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  /** Dipanggil dengan hasil jepretan (JPEG). */
  onAmbil: (foto: Blob) => void;
  onTutup: () => void;
  /** Dipanggil bila kamera tidak bisa dibuka. */
  onGagal: (pesan: string) => void;
};

/**
 * Kamera langsung di dalam halaman (getUserMedia).
 * Butuh HTTPS atau localhost. Vercel sudah HTTPS.
 */
export default function KameraLangsung({ onAmbil, onTutup, onGagal }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [hadap, setHadap] = useState<"environment" | "user">("environment");
  const [siap, setSiap] = useState(false);
  const [bisaGanti, setBisaGanti] = useState(false);
  const [kilat, setKilat] = useState(false);

  const hentikan = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  useEffect(() => {
    let batal = false;

    async function mulai() {
      setSiap(false);
      hentikan();
      if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
        onGagal("Browser ini tidak mendukung kamera langsung. Silakan unggah gambar.");
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: hadap },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (batal) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => {});
        }
        const perangkat = await navigator.mediaDevices.enumerateDevices();
        setBisaGanti(perangkat.filter((d) => d.kind === "videoinput").length > 1);
        setSiap(true);
      } catch (e) {
        const nama = (e as Error)?.name;
        onGagal(
          nama === "NotAllowedError"
            ? "Izin kamera ditolak. Izinkan kamera lewat ikon di address bar browser, atau unggah gambar."
            : nama === "NotFoundError"
              ? "Kamera tidak ditemukan di perangkat ini. Silakan unggah gambar."
              : "Kamera tidak bisa dibuka. Pastikan kamera tidak sedang dipakai aplikasi lain (Zoom, Meet, dll)."
        );
      }
    }

    mulai();
    return () => {
      batal = true;
      hentikan();
    };
  }, [hadap, hentikan, onGagal]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onTutup]);

  function jepret() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    if (hadap === "user") {
      // kamera depan tampil seperti cermin; balik agar tulisan tidak terbalik
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    setKilat(true);
    setTimeout(() => setKilat(false), 150);
    c.toBlob(
      (b) => {
        if (!b) return;
        hentikan();
        onAmbil(b);
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kamera"
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md"
    >
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={video}
          playsInline
          muted
          autoPlay
          className={`h-full w-full object-contain ${hadap === "user" ? "-scale-x-100" : ""}`}
        />

        {/* Bingkai panduan */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="aspect-[3/4] h-[78%] max-w-full rounded-3xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
        <p className="pointer-events-none absolute inset-x-0 top-4 text-center text-sm text-white/90">
          {siap ? "Posisikan resep di dalam bingkai" : "Membuka kamera…"}
        </p>
        {kilat && <div className="absolute inset-0 bg-white/80" />}
      </div>

      <div className="flex items-center justify-between gap-4 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button
          onClick={onTutup}
          className="h-12 min-w-20 rounded-full border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur"
        >
          Batal
        </button>

        <button
          onClick={jepret}
          disabled={!siap}
          aria-label="Ambil foto"
          className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
        >
          <span className="h-14 w-14 rounded-full bg-white" />
        </button>

        <button
          onClick={() => setHadap((h) => (h === "environment" ? "user" : "environment"))}
          disabled={!bisaGanti}
          aria-label="Ganti kamera depan/belakang"
          className="h-12 min-w-20 rounded-full border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur disabled:opacity-30"
        >
          ⟲ Balik
        </button>
      </div>
    </div>
  );
}
