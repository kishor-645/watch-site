"use client";
import { useEffect, useRef } from "react";

const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], [data-cursor], summary, label[for], select';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';

/** The dial itself; loaded by <WatchCursor> (watch-cursor.tsx) only on hover-capable fine pointers. */
export function WatchCursorInner() {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const label = labelRef.current;
    if (!root || !label) return;

    let tx = -100;
    let ty = -100;
    let x = tx;
    let y = ty;
    let raf = 0;
    let shown = false;
    let lastHover: Element | null = null;

    const render = () => {
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const loop = () => {
      const dx = tx - x;
      const dy = ty - y;
      if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) {
        x = tx;
        y = ty;
        render();
        raf = 0; // idle until the pointer moves again
        return;
      }
      x += dx * 0.24;
      y += dy * 0.24;
      render();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        x = tx;
        y = ty;
        render();
        root.dataset.visible = "true";
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const setHover = (target: Element | null) => {
      if (target === lastHover) return;
      lastHover = target;
      const el = target instanceof Element ? target : null;
      if (el?.closest(TEXT)) {
        root.dataset.state = "text";
        return;
      }
      const hit = el?.closest(INTERACTIVE);
      if (!hit) {
        root.dataset.state = "idle";
        return;
      }
      const text = hit.getAttribute("data-cursor-label") || (hit.getAttribute("data-cursor") === "view" ? "View" : "");
      label.textContent = text;
      root.dataset.state = text ? "label" : "hover";
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "mouse") setHover(e.target as Element | null);
    };
    const onLeaveDoc = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        shown = false;
        root.dataset.visible = "false";
      }
    };
    const onDown = () => (root.dataset.pressed = "true");
    const onUp = () => (root.dataset.pressed = "false");
    const onBlur = () => {
      shown = false;
      root.dataset.visible = "false";
    };

    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointermove", onMove, opts);
    document.addEventListener("pointerover", onOver, opts);
    document.addEventListener("pointerout", onLeaveDoc, opts);
    window.addEventListener("pointerdown", onDown, opts);
    window.addEventListener("pointerup", onUp, opts);
    window.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onLeaveDoc);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden className="watch-cursor" data-state="idle" data-visible="false" data-pressed="false">
      <div className="watch-cursor-dial">
        <svg viewBox="0 0 40 40" className="watch-cursor-svg" focusable="false">
          <defs>
            <linearGradient id="watch-cursor-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f4f6fb" />
              <stop offset="0.45" stopColor="#9aa3b8" />
              <stop offset="0.7" stopColor="#e9ecf3" />
              <stop offset="1" stopColor="#7d869c" />
            </linearGradient>
          </defs>
          <circle className="watch-cursor-face" cx="20" cy="20" r="17" stroke="url(#watch-cursor-metal)" strokeWidth="2" />
          <g className="watch-cursor-ticks" stroke="#c7ccd6" strokeWidth="1.2" strokeLinecap="round">
            <line x1="20" y1="5.5" x2="20" y2="8" />
            <line x1="34.5" y1="20" x2="32" y2="20" />
            <line x1="20" y1="34.5" x2="20" y2="32" />
            <line x1="5.5" y1="20" x2="8" y2="20" />
          </g>
          <g className="watch-cursor-hands" strokeLinecap="round">
            <line className="watch-cursor-hour" x1="20" y1="20" x2="20" y2="12.5" stroke="#f4eee3" strokeWidth="1.8" />
            <line className="watch-cursor-minute" x1="20" y1="20" x2="20" y2="8.5" stroke="#ff8a57" strokeWidth="1.2" />
            <circle cx="20" cy="20" r="1.6" fill="#f4eee3" />
          </g>
        </svg>
        <span ref={labelRef} className="watch-cursor-label" />
      </div>
    </div>
  );
}
