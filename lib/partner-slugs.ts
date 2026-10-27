/**
 * Partner slugs used for QA fixtures. The public page stays up (the profile
 * row is not deleted) but must not be indexed or listed in the sitemap.
 *
 * A slug is a test slug when it is `qa-test-company`, or when a hyphen-separated
 * token is `test` / `qa-test`, or when it contains `test-company`.
 * Words that merely contain the letters "test" (for example "contest") are kept.
 */
export function isTestPartnerSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "qa-test-company" || normalized === "test" || normalized === "qa-test") return true;
  if (normalized.startsWith("test-") || normalized.startsWith("qa-test-")) return true;
  if (normalized.endsWith("-test") || normalized.endsWith("-qa-test")) return true;
  if (normalized.includes("-test-") || normalized.includes("-qa-test-")) return true;
  if (normalized.includes("test-company")) return true;
  return false;
}
