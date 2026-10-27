export type MarkdownListItem = {
  text: string;
  /** null when the item is a normal bullet, not a task. */
  checked: boolean | null;
};

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: MarkdownListItem[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" };

const LINK_OR_EMPHASIS = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

export function markdownLinks(text: string): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [];
  for (const match of text.matchAll(LINK_OR_EMPHASIS)) {
    if (match[1] && match[2]) links.push({ label: match[1], href: match[2] });
  }
  return links;
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line.trim());
}

function parseTable(lines: string[]): MarkdownBlock {
  const rows = lines.filter((line) => !isTableSeparator(line)).map(splitTableRow);
  const [headers = [], ...body] = rows;
  return { type: "table", headers, rows: body };
}

function parseTaskOrBullet(line: string): MarkdownListItem {
  const task = /^- \[([ xX])\]\s+(.*)$/.exec(line);
  if (task) return { text: task[2], checked: task[1].toLowerCase() === "x" };
  return { text: line.replace(/^- /, ""), checked: null };
}

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }

    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i += 1;
      }
      blocks.push(parseTable(tableLines));
      continue;
    }

    if (line.startsWith("- ")) {
      const items: MarkdownListItem[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(parseTaskOrBullet(lines[i]));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    blocks.push({ type: "paragraph", text: line.trim() });
    i += 1;
  }

  return blocks;
}
