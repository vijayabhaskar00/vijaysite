"use client";

import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select";

function cursorAllowed(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return finePointer && !reduceMotion;
}

/** Replaces the system cursor with a lagging ring + a dot that snaps to
 * full size on interactive elements. Fine-pointer (mouse/trackpad) devices
 * only, and only when motion is allowed -- touch devices and
 * reduced-motion visitors never see this and keep the native cursor,
 * checked both on mount and on live preference change. */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const update = () => setEnabled(cursorAllowed());
    update();
    const pointerMql = window.matchMedia("(pointer: fine)");
    const motionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (typeof pointerMql.addEventListener !== "function") return;
    pointerMql.addEventListener("change", update);
    motionMql.addEventListener("change", update);
    return () => {
      pointerMql.removeEventListener("change", update);
      motionMql.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-custom-cursor");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { ...target };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      }
    };

    const onOver = (event: PointerEvent) => {
      const isInteractive = (event.target as Element | null)?.closest?.(INTERACTIVE_SELECTOR);
      ringRef.current?.classList.toggle("cursor-ring--active", Boolean(isInteractive));
    };

    let raf = 0;
    const tick = () => {
      ring.x += (target.x - ring.x) * 0.18;
      ring.y += (target.y - ring.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerover", onOver);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
