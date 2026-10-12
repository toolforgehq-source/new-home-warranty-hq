import Image from "next/image";
import { Gift } from "lucide-react";

export function GiftFrom({
  name,
  company,
  logoUrl,
  message,
  compact = false,
  className = "",
}: {
  name: string;
  company?: string | null;
  logoUrl?: string | null;
  message?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const badge = logoUrl ? (
    <Image
      src={logoUrl}
      alt={company || name}
      width={compact ? 28 : 40}
      height={compact ? 28 : 40}
      unoptimized
      className={`${compact ? "h-7 w-7" : "h-10 w-10"} shrink-0 rounded-lg bg-white object-contain ring-1 ring-gray-200`}
    />
  ) : (
    <span
      className={`${compact ? "h-7 w-7" : "h-10 w-10"} flex shrink-0 items-center justify-center rounded-lg bg-green-50 text-green`}
    >
      <Gift className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden />
    </span>
  );

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        {badge}
        <span>
          Gift from <span className="font-semibold text-navy">{name}</span>
          {company && <> &middot; {company}</>}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-green-100 bg-green-50/60 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        {badge}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-green">A gift for your new home</p>
          <p className="font-semibold text-navy">
            From {name}
            {company && <span className="font-normal text-gray-600"> at {company}</span>}
          </p>
        </div>
      </div>
      {message && (
        <blockquote className="mt-3 border-l-2 border-green pl-3 text-sm italic text-gray-700 whitespace-pre-line">
          {message}
        </blockquote>
      )}
    </div>
  );
}
