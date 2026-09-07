"use client";

import { useActionState, useState } from "react";
import { uploadDocument } from "@/lib/actions/document";

const documentTypes = [
  { value: "BUILDER_WARRANTY", label: "Builder warranty" },
  { value: "HOMEOWNER_MANUAL", label: "Homeowner manual" },
  { value: "PURCHASE_AGREEMENT", label: "Purchase agreement" },
  { value: "ADDENDUM", label: "Addendum" },
  { value: "WORKMANSHIP_STANDARDS", label: "Workmanship standards" },
  { value: "INSPECTION_REPORT", label: "Inspection report" },
  { value: "PUNCH_LIST", label: "Punch list" },
  { value: "THIRD_PARTY_WARRANTY", label: "Third-party warranty" },
  { value: "BUILDER_INSTRUCTIONS", label: "Builder instructions" },
  { value: "OTHER", label: "Other" },
];

const MAX_SIZE = 10 * 1024 * 1024;

export function UploadDocumentForm() {
  const [state, action, pending] = useActionState(uploadDocument, null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_SIZE) {
      setFileError("File must be smaller than 10 MB");
      e.target.value = "";
    } else {
      setFileError(null);
    }
  };

  const error = fileError || state?.error;

  return (
    <form action={action} className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-navy">Upload a document</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="label" className="block text-sm font-medium text-navy">
            Label
          </label>
          <input
            id="label"
            name="label"
            type="text"
            required
            placeholder="e.g. Builder Limited Warranty"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-navy">
            Document type
          </label>
          <select
            id="type"
            name="type"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          >
            {documentTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-navy">
            File
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileChange}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium"
          />
          {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
        </div>
      </div>

      {error && !fileError && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={pending || !!fileError}
        className="mt-6 rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
      >
        {pending ? "Uploading..." : "Upload document"}
      </button>
    </form>
  );
}
