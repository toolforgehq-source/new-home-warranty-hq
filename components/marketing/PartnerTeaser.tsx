import Link from "next/link";
import { Gift } from "lucide-react";

export function PartnerTeaser() {
  return (
    <section id="for-partners" className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-gray-50 px-8 py-8 md:flex-row">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green text-white">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green">
                Title companies, lenders, realtors &amp; inspectors
              </p>
              <h2 className="mt-1 text-xl font-bold text-navy">
                Give your buyers a closing gift they&apos;ll actually use &mdash; $124
              </h2>
            </div>
          </div>
          <Link
            href="/partners"
            className="shrink-0 rounded-full bg-navy px-6 py-3 font-semibold text-white hover:bg-navy-700"
          >
            Learn about gifting &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
