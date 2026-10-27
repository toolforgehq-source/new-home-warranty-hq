import Link from "next/link";
import { GuideCta } from "@/components/marketing/GuideCta";
import { getGuides } from "@/lib/guides";

export const metadata = {
  title: "Guides — New Home Warranty HQ",
  description:
    "Plain-English guides for new-construction homeowners on builder warranties, the 11-month inspection, written requests, and coverage deadlines. Not legal advice.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndexPage() {
  const guides = getGuides();

  return (
    <div className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-navy lg:text-4xl">Guides</h1>
        <p className="mt-4 leading-relaxed text-gray-700">
          Plain-English guides for new-construction homeowners. Informational only; not legal advice.
          Your warranty document controls.
        </p>
        <ul className="mt-10 space-y-4">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={guide.path}
                className="block rounded-2xl border border-gray-200 p-6 hover:border-green"
              >
                <h2 className="text-lg font-semibold text-navy">{guide.title}</h2>
                <p className="mt-2 leading-relaxed text-gray-600">{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
        <GuideCta />
      </div>
    </div>
  );
}
