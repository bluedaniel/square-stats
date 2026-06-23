"use client";

import { type ComponentPropsWithoutRef } from "react";

type Props = Omit<ComponentPropsWithoutRef<"a">, "target" | "rel"> & { href: string };

export function ExternalLink({ href, onClick, ...props }: Props) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      e.preventDefault();
      import("@tauri-apps/plugin-opener").then(({ openUrl }) => openUrl(href));
    }
    onClick?.(e);
  }

  return <a href={href} target="_blank" rel="noreferrer" onClick={handleClick} {...props} />;
}
