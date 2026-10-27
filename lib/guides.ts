import fs from "fs";
import path from "path";
import { markdownLinks, parseMarkdown } from "@/lib/markdown";

export type Guide = {
  slug: string;
  title: string;
  description: string;
  body: string;
  path: string;
};

const ALLOWED_FRONT_MATTER = new Set(["slug", "title", "meta_description"]);
const GUIDES_DIR = path.join(process.cwd(), "content", "guides");

function parseFrontMatter(raw: string, file: string): { attrs: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${file} is missing front matter`);

  const attrs: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const idx = line.indexOf(":");
    if (idx === -1) throw new Error(`${file} has an unreadable front-matter line`);
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    attrs[key] = value;
  }

  for (const key of Object.keys(attrs)) {
    if (!ALLOWED_FRONT_MATTER.has(key)) {
      throw new Error(`${file} still has internal front-matter field "${key}"`);
    }
  }

  return { attrs, body: match[2].trim() };
}

export function getGuides(): Guide[] {
  const files = fs
    .readdirSync(GUIDES_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();

  const guides = files.map((file) => {
    const raw = fs.readFileSync(path.join(GUIDES_DIR, file), "utf8");
    const { attrs, body } = parseFrontMatter(raw, file);
    const slug = (attrs.slug ?? "").replace(/^\/guides\//, "");
    if (!attrs.title || !attrs.meta_description || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`${file} needs a slug, title, and meta_description`);
    }
    return {
      slug,
      title: attrs.title,
      description: attrs.meta_description,
      body,
      path: `/guides/${slug}`,
    };
  });

  const slugs = new Set<string>();
  for (const guide of guides) {
    if (slugs.has(guide.slug)) throw new Error(`Duplicate guide slug "${guide.slug}"`);
    slugs.add(guide.slug);
  }

  return guides;
}

export function getGuide(slug: string): Guide | undefined {
  return getGuides().find((guide) => guide.slug === slug);
}

/** Internal links written in guide markdown. External URLs are left out. */
export function guideInternalLinks(guide: Guide): { label: string; href: string }[] {
  const hrefs: { label: string; href: string }[] = [];
  for (const block of parseMarkdown(guide.body)) {
    const texts =
      block.type === "paragraph" || block.type === "heading"
        ? [block.text]
        : block.type === "ul"
          ? block.items.map((item) => item.text)
          : block.type === "ol"
            ? block.items
            : block.type === "table"
              ? [...block.headers, ...block.rows.flat()]
              : [];
    for (const text of texts) {
      for (const link of markdownLinks(text)) {
        if (link.href.startsWith("/")) hrefs.push(link);
      }
    }
  }
  return hrefs;
}
