"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function DashboardHeader({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null };
}) {
  const router = useRouter();

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
            <Link href="/dashboard" className="hover:text-green">Dashboard</Link>
            <Link href="/dashboard/issues" className="hover:text-green">Issues</Link>
            <Link href="/dashboard/documents" className="hover:text-green">Documents</Link>
            <Link href="/dashboard/reminders" className="hover:text-green">Reminders</Link>
            <Link href="/dashboard/final-review" className="hover:text-green">Final Review</Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="hover:text-green">Admin</Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 sm:inline">{user.name || user.email}</span>
            <button
              onClick={signOut}
              className="rounded-full px-4 py-2 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
