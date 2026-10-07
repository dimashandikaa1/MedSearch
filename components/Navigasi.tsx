"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Aksesibilitas from "./Aksesibilitas";

/* Ikon sederhana (SVG) agar tidak perlu library tambahan */
const Ikon = {
  terjemah: (
    <path d="M4 5h9M8.5 3v2m3.5 0c-1 4-4 7-8 9m2.5-6c1 2 3 4 6 5M13 21l4-9 4 9m-6.8-3h5.6" />
  ),
  resep: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  kamus: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6" />
    </>
  ),
  riwayat: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
};

const MENU = [
  { href: "/", label: "Terjemah", ikon: Ikon.terjemah },
  { href: "/resep", label: "Foto Resep", ikon: Ikon.resep },
  { href: "/kamus", label: "Kamus", ikon: Ikon.kamus },
  { href: "/riwayat", label: "Riwayat", ikon: Ikon.riwayat },
];

function SvgIkon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export default function Navigasi() {
  const path = usePathname();
  const aktif = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      {/* ===== Header (semua ukuran layar) ===== */}
      <header className="sticky top-0 z-30 border-b border-garis">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 font-display font-semibold tracking-tight">
            <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-utama text-lg text-utama-teks">
              ✚
            </span>
            <span className="truncate text-base sm:text-lg">
              
              MedSearch<span className="hidden min-[400px]:inline"></span>
            </span>
          </Link>

          {/* Menu desktop/tablet */}
          <nav aria-label="Menu utama" className="hidden md:block">
            <ul className="flex items-center gap-1 rounded-2xl border border-garis bg-kartu p-1">
              {MENU.map((m) => (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    aria-current={aktif(m.href) ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                      aktif(m.href) ? "bg-utama text-utama-teks" : "text-redup hover:text-tinta"
                    }`}
                  >
                    <SvgIkon className="h-4 w-4">{m.ikon}</SvgIkon>
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Aksesibilitas />
        </div>
      </header>

      {/* ===== Navigasi bawah (khusus HP) ===== */}
      <nav aria-label="Menu utama" className="nav-bawah fixed inset-x-0 bottom-0 z-30 border-t border-garis md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
          {MENU.map((m) => {
            const a = aktif(m.href);
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  aria-current={a ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium ${
                    a ? "text-utama" : "text-redup"
                  }`}
                >
                  <span
                    className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${
                      a ? "bg-aksen-lembut text-aksen" : ""
                    }`}
                  >
                    <SvgIkon className="h-5 w-5">{m.ikon}</SvgIkon>
                  </span>
                  {m.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
