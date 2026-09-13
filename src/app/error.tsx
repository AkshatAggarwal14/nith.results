"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Topbar, Footer } from "./components/SiteShell";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Application error caught by Error Boundary:", error);
  }, [error]);

  const errorMsg = error?.message || "";
  const isDbError =
    errorMsg.includes("Prisma") ||
    errorMsg.includes("database") ||
    errorMsg.includes("ECONNREFUSED") ||
    errorMsg.includes("connect") ||
    errorMsg.includes("timed out");

  return (
    <main className="wrap">
      <Topbar />
      <div className="error-card">
        <div className="error-icon-box" aria-hidden="true">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1 className="error-title">
          {isDbError ? "Database Temporarily Unavailable" : "Something Went Wrong"}
        </h1>

        <p className="error-sub">
          {isDbError
            ? "We couldn't connect to the results database. The database service might be restarting, busy, or temporarily unreachable. Please try again shortly."
            : "An unexpected error occurred while loading this page. You can try refreshing or head back to the leaderboard."}
        </p>

        {error.digest && (
          <div className="error-digest">
            <span>Reference ID:</span> <code>{error.digest}</code>
          </div>
        )}

        <div className="error-btn-group">
          <button
            type="button"
            onClick={() => reset()}
            className="error-primary-btn"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Try again</span>
          </button>

          <Link href="/" className="error-secondary-btn">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Back to leaderboard</span>
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
