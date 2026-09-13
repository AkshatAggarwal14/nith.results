"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Root Layout Error:", error);
  }, [error]);

  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: "#0b0d12",
          color: "#f3f4f6",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            background: "#131720",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "2.5rem 2rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(225, 29, 72, 0.12)",
              color: "#f43f5e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.35rem", margin: "0 0 0.6rem", fontWeight: 700 }}>
            System Error
          </h2>
          <p
            style={{
              opacity: 0.75,
              fontSize: "0.92rem",
              lineHeight: 1.55,
              margin: "0 0 1.75rem",
            }}
          >
            A critical system error prevented the application from loading. Please
            try reloading.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "0.65rem 1.4rem",
              borderRadius: 10,
              background: "#7a0e18",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: "0.92rem",
              cursor: "pointer",
            }}
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
