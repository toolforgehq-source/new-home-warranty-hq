"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function PartnerLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-full px-4 py-2 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
    >
      Log out
    </button>
  );
}
