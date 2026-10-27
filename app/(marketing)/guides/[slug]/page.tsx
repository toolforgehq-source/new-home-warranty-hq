import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideCta } from "@/components/marketing/GuideCta";
import { Markdown } from "@/components/marketing/Markdown";
import { getGuide, getGuides } from "@/lib/guides";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: `${guide.title} — ${SITE_NAME}`,
    description: guide.description,
    alternates: { canonical: guide.path },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      mainEntityOfPage: `${SITE_URL}${guide.path}`,
      author: { "@type": "Organization", name: SITE_NAME },
      publisher: { "@type": "Organization", name: SITE_NAME },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 2, name: guide.title, item: `${SITE_URL}${guide.path}` },
      ],
    },
  ];

  return (
    <article className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <p className="text-sm">
          <Link href="/guides" className="font-medium text-green hover:underline">
            Guides
          </Link>
        </p>
        <div className="mt-4">
          <Markdown source={guide.body} />
        </div>
        <GuideCta />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </article>
  );
}
