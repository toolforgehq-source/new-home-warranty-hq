"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function DashboardHeader({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/issues", label: "Issues" },
    { href: "/dashboard/documents", label: "Documents" },
    { href: "/dashboard/reminders", label: "Reminders" },
    { href: "/dashboard/final-review", label: "Final Review" },
    { href: "/dashboard/export", label: "Export" },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const signOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-bold text-navy">
          NEW HOME WARRANTY <span className="text-green">HQ</span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden gap-6 text-sm font-medium text-navy md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(link.href) ? "text-green" : "hover:text-green"}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 sm:inline">{user.name || user.email}</span>
            <button
              onClick={signOut}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50 md:block"
            >
              Log out
            </button>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="rounded-lg p-2 text-navy hover:bg-gray-100 md:hidden"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <nav className="border-t border-gray-200 bg-white px-6 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 font-medium ${
                isActive(link.href) ? "bg-green-50 text-green-600" : "text-navy hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="mt-2 block w-full rounded-lg px-3 py-2.5 text-left font-medium text-navy hover:bg-gray-50"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
