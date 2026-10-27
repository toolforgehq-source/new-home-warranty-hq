import Link from "next/link";
import type { ReactNode } from "react";
import { parseMarkdown, type MarkdownBlock } from "@/lib/markdown";

function Inline({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    if (match[1] && match[2]) {
      nodes.push(
        <MdLink key={key++} href={match[2]}>
          {match[1]}
        </MdLink>,
      );
    } else if (match[3]) {
      nodes.push(<strong key={key++}>{match[3]}</strong>);
    } else if (match[4]) {
      nodes.push(<em key={key++}>{match[4]}</em>);
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function MdLink({ href, children }: { href: string; children: ReactNode }) {
  const className = "text-green hover:underline";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function Block({ block }: { block: MarkdownBlock }) {
  switch (block.type) {
    case "heading": {
      const className =
        block.level === 1
          ? "text-3xl font-bold text-navy lg:text-4xl"
          : block.level === 2
            ? "mt-10 text-xl font-semibold text-navy"
            : "mt-8 text-lg font-semibold text-navy";
      if (block.level === 1) return <h1 className={className}><Inline text={block.text} /></h1>;
      if (block.level === 2) return <h2 className={className}><Inline text={block.text} /></h2>;
      if (block.level === 3) return <h3 className={className}><Inline text={block.text} /></h3>;
      return <h4 className={className}><Inline text={block.text} /></h4>;
    }
    case "paragraph": {
      const footer = /^\*([^*]+)\*$/.exec(block.text);
      if (footer) {
        return <p className="mt-8 text-sm italic text-gray-500">{footer[1]}</p>;
      }
      return (
        <p className="mt-4 leading-relaxed text-gray-700">
          <Inline text={block.text} />
        </p>
      );
    }
    case "ul": {
      const tasks = block.items.some((item) => item.checked !== null);
      if (tasks) {
        return (
          <ul className="mt-4 space-y-2 text-gray-700">
            {block.items.map((item, index) => (
              <li key={index}>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    disabled
                    defaultChecked={item.checked === true}
                    className="mt-1 h-4 w-4 shrink-0 accent-green"
                  />
                  <span className="leading-relaxed">
                    <Inline text={item.text} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        );
      }
      return (
        <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
          {block.items.map((item, index) => (
            <li key={index} className="leading-relaxed">
              <Inline text={item.text} />
            </li>
          ))}
        </ul>
      );
    }
    case "ol":
      return (
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-gray-700">
          {block.items.map((item, index) => (
            <li key={index} className="leading-relaxed">
              <Inline text={item} />
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-700">
            <thead>
              <tr>
                {block.headers.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold text-navy"
                  >
                    <Inline text={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-200 px-3 py-2 align-top">
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return <hr className="my-8 border-gray-200" />;
    default:
      return null;
  }
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}
