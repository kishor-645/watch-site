"use client";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// Desktop-only: touch devices never download the dial.
const WatchCursorInner = dynamic(() => import("./watch-cursor-dial").then((m) => m.WatchCursorInner), { ssr: false });

const QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getEnabled = () => window.matchMedia(QUERY).matches;
const getServer = () => false;

/**
 * Desktop-only watch-dial cursor. Mounted once in the public layout. Decorative follower: the native
 * cursor stays visible (so text carets, resize handles etc. are untouched). One rAF loop that only
 * runs while the dial is catching up with the pointer. Hover states are read via event delegation:
 *   - a, button, [role=button], [data-cursor] → ring grows and the hands tick
 *   - [data-cursor="view"] → shows "View"; any `data-cursor-label="…"` shows that text instead
 *   - text inputs → dial fades out
 */
export function WatchCursor() {
  const enabled = useSyncExternalStore(subscribe, getEnabled, getServer);
  if (!enabled) return null;
  return <WatchCursorInner />;
}

