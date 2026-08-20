"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, RefreshCcw } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const product = searchParams.get("product") ?? "homeowner";
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product === "gift" && !isPending && !session) {
      router.push("/login");
    }
  }, [product, isPending, session, router]);

  const startCheckout = async (extra?: object) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, ...extra }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Checkout failed.");
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("No checkout URL returned.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (product === "gift" && isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  if (product === "gift" && !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <Link href="/" className="mb-8">
        <span className="text-2xl font-bold text-navy">
          NEW HOME WARRANTY <span className="text-green">HQ</span>
        </span>
      </Link>

      {product === "homeowner" && (
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-navy">Protect My Home</h1>
          <p className="mt-2 text-gray-600">$189 one-time payment. No subscription.</p>
          <ul className="mt-6 space-y-2 text-sm text-gray-600">
            <li>Document issues with photos and dates</li>
            <li>Generate professional warranty requests</li>
            <li>Track builder responses and repairs</li>
            <li>Export your complete record</li>
          </ul>
          <button
            onClick={() => startCheckout()}
            disabled={loading}
            className="mt-8 w-full rounded-full bg-green py-4 text-lg font-semibold text-white hover:bg-green-600 disabled:opacity-70"
          >
            {loading ? "Redirecting..." : "Continue to Payment — $189"}
          </button>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> Secure checkout
            </span>
            <span className="flex items-center gap-1">
              <RefreshCcw className="h-3.5 w-3.5" /> 30-day guarantee
            </span>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            By checking out you agree to our{" "}
            <Link href="/terms" className="text-green hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/refund" className="text-green hover:underline">
              Refund Policy
            </Link>
            .
          </p>
        </div>
      )}

      {product === "gift" && (
        <GiftCheckoutForm onSubmit={startCheckout} loading={loading} />
      )}

      {error && (
        <p className="mt-6 max-w-md rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function GiftCheckoutForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: object) => Promise<void>;
  loading: boolean;
}) {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    recipientName: searchParams.get("recipientName") ?? "",
    recipientEmail: searchParams.get("recipientEmail") ?? "",
    propertyAddress: searchParams.get("propertyAddress") ?? "",
    giftMessage: searchParams.get("giftMessage") ?? "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
    >
      <h1 className="text-2xl font-bold text-navy">Gift It to a Buyer</h1>
      <p className="mt-2 text-gray-600">$124 one-time payment. No subscription.</p>
      <div className="mt-6 space-y-4">
        <input
          type="text"
          required
          placeholder="Buyer name"
          value={form.recipientName}
          onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        <input
          type="email"
          required
          placeholder="Buyer email"
          value={form.recipientEmail}
          onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        <input
          type="text"
          placeholder="Property address (optional)"
          value={form.propertyAddress}
          onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        <textarea
          placeholder="Gift message (optional)"
          value={form.giftMessage}
          onChange={(e) => setForm({ ...form, giftMessage: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-8 w-full rounded-full bg-navy py-4 text-lg font-semibold text-white hover:bg-navy-700 disabled:opacity-70"
      >
        {loading ? "Redirecting..." : "Continue to Payment — $124"}
      </button>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Lock className="h-3.5 w-3.5" /> Secure checkout
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" /> Buyer privacy protected
        </span>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        By checking out you agree to our{" "}
        <Link href="/terms" className="text-green hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/refund" className="text-green hover:underline">
          Refund Policy
        </Link>
        .
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
