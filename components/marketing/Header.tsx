"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const nav = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Why It Matters", href: "/#why-it-matters" },
  { label: "Pricing", href: "/#pricing" },
  { label: "For Partners", href: "/#for-partners" },
  { label: "FAQ", href: "/#faq" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-navy text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-7 w-auto text-white" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/90 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-white/90 hover:text-white"
          >
            Log In
          </Link>
          <Link
            href="/checkout?product=homeowner"
            className="rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
          >
            Protect My Home
          </Link>
        </div>

        <button
          className="p-2 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-navy px-6 py-6 lg:hidden">
          <nav className="flex flex-col gap-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-white/90 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-base font-medium text-white/90 hover:text-white"
            >
              Log In
            </Link>
            <Link
              href="/checkout?product=homeowner"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-green px-5 py-3 text-center text-base font-semibold text-white hover:bg-green-600"
            >
              Protect My Home
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
