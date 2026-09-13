"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevUrlRef = useRef<string>("");

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setVisible(true);
    setProgress(18);
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) return prev + 12;
        if (prev < 85) return prev + 4;
        if (prev < 94) return prev + 0.8;
        return prev;
      });
    }, 120);
  };

  const done = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => setProgress(0), 200);
    }, 220);
  };

  // Route changed: complete progress bar
  useEffect(() => {
    const currentUrl = `${pathname}?${searchParams?.toString() || ""}`;
    if (prevUrlRef.current && prevUrlRef.current !== currentUrl) {
      done();
    }
    prevUrlRef.current = currentUrl;
  }, [pathname, searchParams]);

  // Intercept navigation link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore modifier keys, external links, downloads, hash jumps, mailto
      if (
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      const isInternal =
        href.startsWith("/") || href.startsWith(window.location.origin);

      if (isInternal) {
        const targetUrl = new URL(href, window.location.origin);
        // If clicking anchor to current page hash only, ignore
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search &&
          targetUrl.hash
        ) {
          return;
        }
        start();
      }
    };

    // Listen to custom start/done events for programmatic usage
    const onStart = () => start();
    const onDone = () => done();

    window.addEventListener("nprogress:start", onStart);
    window.addEventListener("nprogress:done", onDone);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("nprogress:start", onStart);
      window.removeEventListener("nprogress:done", onDone);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="top-progress-bar"
      style={{
        opacity: visible ? 1 : 0,
        transform: `scaleX(${Math.min(progress, 100) / 100})`,
      }}
      aria-hidden="true"
    />
  );
}
