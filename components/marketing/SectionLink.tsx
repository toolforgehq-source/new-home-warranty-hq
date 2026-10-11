"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

// Next's Link ignores a click when the URL already has the same hash, so
// scroll to the section ourselves when it is on the current page.
export function SectionLink({
  href,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const pathname = usePathname();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const [path, id] = href.split("#");
    if (!id || (path || "/") !== pathname) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    window.history.replaceState(window.history.state, "", `#${id}`);
    // Wait a frame so layout changes from onClick (e.g. closing the mobile menu) land first.
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth" }));
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
