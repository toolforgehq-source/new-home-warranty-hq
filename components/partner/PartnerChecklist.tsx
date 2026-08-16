import { Check, Gift, User, Share2 } from "lucide-react";
import Link from "next/link";

export function PartnerChecklist({
  profileComplete,
  approved,
  hasGifts,
}: {
  profileComplete: boolean;
  approved: boolean;
  hasGifts: boolean;
}) {
  const steps = [
    { label: "Complete your profile", done: profileComplete, icon: User, href: "/partner/dashboard/edit" },
    { label: "Get approved by our team", done: approved, icon: Check, href: undefined },
    { label: "Send your first gift", done: hasGifts, icon: Gift, href: "/checkout?product=gift" },
    { label: "Share your co-branded page", done: approved && hasGifts, icon: Share2, href: "/partner/dashboard/edit" },
  ];

  return (
    <div className="rounded-2xl bg-navy p-6 text-white shadow-sm">
      <h3 className="font-semibold">Getting started</h3>
      <ul className="mt-4 space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <li key={step.label} className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${step.done ? "bg-green text-white" : "bg-white/10 text-white/70"}`}>
                {step.done ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
              </div>
              <span className={`text-sm ${step.done ? "text-white/90" : "text-white/70"}`}>
                {step.href && !step.done ? (
                  <Link href={step.href} className="underline hover:text-white">
                    {step.label}
                  </Link>
                ) : (
                  step.label
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
