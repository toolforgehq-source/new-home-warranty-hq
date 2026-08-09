import Link from "next/link";

export function MobileStickyCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-3 md:hidden">
      <Link
        href="/checkout?product=homeowner"
        className="flex w-full items-center justify-center rounded-full bg-green py-3.5 text-base font-semibold text-white hover:bg-green-600"
      >
        Protect My Home — $189
      </Link>
    </div>
  );
}
