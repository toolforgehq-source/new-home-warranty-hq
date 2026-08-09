import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage";
import { UploadDocumentForm } from "./UploadDocumentForm";

export default async function DocumentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const home = await prisma.home.findFirst({
    where: {
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
    include: { documents: { orderBy: { uploadedAt: "desc" } } },
  });

  const docsWithUrls = await Promise.all(
    (home?.documents ?? []).map(async (doc) => {
      try {
        const url = await getSignedDownloadUrl(doc.fileKey);
        return { ...doc, url };
      } catch {
        return { ...doc, url: null };
      }
    })
  );

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-navy">Documents</h1>
        <p className="mt-2 text-gray-600">Upload builder warranty, manuals, and other home records.</p>

        <UploadDocumentForm />

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy">Uploaded documents</h2>
          {docsWithUrls.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No documents yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {docsWithUrls.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-navy">{doc.label}</p>
                    <p className="text-sm text-gray-500">{doc.type.replace("_", " ")} &bull; {doc.mimeType}</p>
                  </div>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">Storage not configured</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
