"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type PaginationProps = {
  page: number;
  pages: number;
  baseParams: {
    batch?: string;
    branch?: string;
    size?: number;
  };
  isBottom?: boolean;
  showJump?: boolean;
};

export default function Pagination({
  page,
  pages,
  baseParams,
  isBottom = false,
  showJump = true,
}: PaginationProps) {
  const [jumpPage, setJumpPage] = useState("");
  const router = useRouter();

  const buildHref = (p: number) => {
    const params: Record<string, string> = {};
    if (baseParams.batch) params.batch = baseParams.batch;
    if (baseParams.branch) params.branch = baseParams.branch;
    if (baseParams.size && baseParams.size !== 25) {
      params.size = String(baseParams.size);
    }
    params.page = String(p);
    return `/?${new URLSearchParams(params)}`;
  };

  // Scroll to leaderboard on navigation from bottom or jump box
  useEffect(() => {
    const target = sessionStorage.getItem("pager_target");
    if (target === "leaderboard") {
      sessionStorage.removeItem("pager_target");
      const el = document.getElementById("leaderboard");
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - 75;
        window.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
      }
    }
  }, [page]);

  const navigateTo = (p: number, shouldScrollToLeaderboard: boolean) => {
    if (p < 1 || p > pages || p === page) return;
    if (shouldScrollToLeaderboard) {
      sessionStorage.setItem("pager_target", "leaderboard");
    }
    router.push(buildHref(p));
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= pages) {
      navigateTo(p, true);
      setJumpPage("");
    }
  };

  const nums = new Set([1, page, page - 1, page + 1, pages]);
  const list = Array.from(nums)
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);

  return (
    <div className={`pagination-wrap ${isBottom ? "bottom" : "top"}`}>
      <nav className="pager" aria-label="Pagination">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            scroll={false}
            className="pgbtn"
            aria-label="Previous page"
            onClick={(e) => {
              e.preventDefault();
              navigateTo(page - 1, isBottom);
            }}
          >
            <svg
              className="pgbtn-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Prev</span>
          </Link>
        ) : (
          <span className="pgbtn disabled" aria-hidden="true">
            <svg
              className="pgbtn-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Prev</span>
          </span>
        )}

        {list.map((n, i) => (
          <span key={n} className="pggroup">
            {i > 0 && n - list[i - 1] > 1 && <span className="gap">…</span>}
            {n === page ? (
              <span className="pgnum active" aria-current="page">
                {n}
              </span>
            ) : (
              <Link
                href={buildHref(n)}
                scroll={false}
                className="pgnum"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(n, isBottom);
                }}
              >
                {n}
              </Link>
            )}
          </span>
        ))}

        {page < pages ? (
          <Link
            href={buildHref(page + 1)}
            scroll={false}
            className="pgbtn"
            aria-label="Next page"
            onClick={(e) => {
              e.preventDefault();
              navigateTo(page + 1, isBottom);
            }}
          >
            <span>Next</span>
            <svg
              className="pgbtn-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        ) : (
          <span className="pgbtn disabled" aria-hidden="true">
            <span>Next</span>
            <svg
              className="pgbtn-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
        )}
      </nav>

      {showJump && pages > 1 && (
        <form className="page-jump" onSubmit={handleJump}>
          <span className="jump-label">Go to:</span>
          <input
            type="number"
            min={1}
            max={pages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            placeholder="#"
            className="jump-input"
            aria-label={`Enter page number between 1 and ${pages}`}
          />
          <button type="submit" className="jump-btn">
            Go
          </button>
        </form>
      )}
    </div>
  );
}
