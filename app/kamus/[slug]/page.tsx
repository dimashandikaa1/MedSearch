import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import KartuHasil from "@/components/KartuHasil";
import { KAMUS, cariSerupa, cariSlug, keHasil } from "@/lib/kamus";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return KAMUS.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const k = cariSlug(slug);
  if (!k) return {};
  return { title: `${k.istilah} artinya`, description: `${k.istilah}: ${k.arti_awam}` };
}

export default async function DetailIstilah({ params }: Props) {
  const { slug } = await params;
  const k = cariSlug(slug);
  if (!k) notFound();

  const terkait = cariSerupa(k.istilah, 6).filter((x) => x.slug !== k.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/kamus" className="text-sm font-medium text-utama hover:underline">
        ← Kembali ke kamus
      </Link>
      <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-aksen">{k.kategori}</p>
      {k.sinonim.length > 0 && (
        <p className="mt-1 text-redup">Disebut juga: {k.sinonim.join(", ")}</p>
      )}
      <div className="mt-4">
        <KartuHasil h={keHasil(k)} />
      </div>
      {terkait.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">Istilah terkait</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {terkait.map((t) => (
              <li key={t.slug}>
                <Link href={`/kamus/${t.slug}`} className="block rounded-full border border-garis bg-kartu px-3 py-2 text-sm">
                  {t.istilah}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
