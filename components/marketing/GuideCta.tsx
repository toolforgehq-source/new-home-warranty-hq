import Link from "next/link";

export function GuideCta() {
  return (
    <aside className="mt-12 rounded-2xl bg-gray-50 px-6 py-8">
      <h2 className="text-xl font-semibold text-navy">
        Document it. Report it. Track it until it&apos;s fixed.
      </h2>
      <p className="mt-3 leading-relaxed text-gray-700">
        New Home Warranty HQ is a homeowner-controlled system for managing builder-warranty issues.
        It is a software tool, not a warranty provider, insurer, or law firm.
      </p>
      <Link
        href="/checkout?product=homeowner"
        className="mt-6 inline-block rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
      >
        Start My Warranty HQ
      </Link>
    </aside>
  );
}
