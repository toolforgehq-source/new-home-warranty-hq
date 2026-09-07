"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
