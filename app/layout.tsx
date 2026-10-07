import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import Navigasi from "@/components/Navigasi";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: { default: "Terjemah Medis Awam", template: "%s · Terjemah Medis Awam" },
  description: "Ubah istilah medis dan tulisan resep menjadi bahasa sehari-hari yang mudah dipahami.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Terapkan pengaturan aksesibilitas sebelum halaman tampil agar tidak berkedip.
const skripAwal = `try{var a=JSON.parse(localStorage.getItem("tma-akses")||"{}");if(a.teks)document.documentElement.dataset.teks=a.teks;if(a.kontras)document.documentElement.dataset.kontras=a.kontras;}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${jakarta.variable} ${fraunces.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: skripAwal }} />
      </head>
      <body className="min-h-dvh font-sans">
        <Navigasi />
        <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-6xl border-t border-garis px-4 pb-28 pt-6 text-sm text-redup sm:px-6 md:pb-8 lg:px-8">
          Informasi di sini bersifat edukasi dan <strong>bukan pengganti</strong> konsultasi dengan dokter atau
          apoteker. Dalam keadaan darurat, segera hubungi 119 atau datangi IGD terdekat.
        </footer>
      </body>
    </html>
  );
}
