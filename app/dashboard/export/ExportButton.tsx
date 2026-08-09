"use client";

import { useState } from "react";

export function ExportButton({ homeId }: { homeId: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setStatus(null);
    setDownloadUrl(null);
    try {
      const res = await fetch(`/api/export?homeId=${homeId}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus(data.status);
        setDownloadUrl(data.downloadUrl ?? null);
      } else {
        setStatus(`Failed: ${data.error || data.status}`);
      }
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleExport}
        disabled={loading}
        className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
      >
        {loading ? "Preparing export..." : "Export full record (ZIP)"}
      </button>
      {status && <p className="text-sm text-navy">Status: {status}</p>}
      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full bg-white px-6 py-3 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
        >
          Download ZIP
        </a>
      )}
    </div>
  );
}
