"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FilterModal, { formatBatch } from "./FilterModal";

type Hit = {
  rollno: string;
  name: string;
  batch: string;
  branch: { branch_code: string } | null;
  summary: { cgpi: string } | null;
};

export type FilterConfig = {
  batches: { batch: string }[];
  branches: { branch_code: string; branch_name: string }[];
  currentBatch?: string;
  currentBranch?: string;
  currentSize?: number;
};

export default function SearchForm({ filters }: { filters?: FilterConfig }) {
  const [text, setText] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  const selectedBatches = (filters?.currentBatch || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const selectedBranches = (filters?.currentBranch || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const activeCount = selectedBatches.length + selectedBranches.length;

  const buildHrefWithFilters = (newBatches: string[], newBranches: string[]) => {
    const q: Record<string, string> = {};
    if (newBatches.length > 0) q.batch = newBatches.join(",");
    if (newBranches.length > 0) q.branch = newBranches.join(",");
    if (filters?.currentSize && filters.currentSize !== 25) {
      q.size = String(filters.currentSize);
    }
    q.page = "1";
    const qs = new URLSearchParams(q).toString();
    return qs ? `/?${qs}` : "/";
  };

  const removeBatch = (b: string) => {
    const next = selectedBatches.filter((item) => item !== b);
    router.replace(buildHrefWithFilters(next, selectedBranches));
  };

  const removeBranch = (br: string) => {
    const next = selectedBranches.filter((item) => item !== br);
    router.replace(buildHrefWithFilters(selectedBatches, next));
  };


  const clearAllHref =
    filters?.currentSize && filters.currentSize !== 25
      ? `/?size=${filters.currentSize}&page=1`
      : "/";


  useEffect(() => {
    if (text.trim().length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(text)}`);
        const data = await res.json();
        setHits(Array.isArray(data) ? data : []);
        setCursor(-1);
        setOpen(true);
      } catch {
        /* offline — ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [text]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const go = (roll: string) => {
    setOpen(false);
    router.push(`/result/${roll.toLowerCase()}`);
  };

  return (
    <div className="searchbox" ref={boxRef}>
      <div className="search-row">
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (cursor >= 0 && hits[cursor]) go(hits[cursor].rollno);
            else if (text.trim()) go(text.trim());
          }}
        >
          <div className="search-icon-slot">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="search-svg"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => hits.length && setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, hits.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, -1));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Search by Roll No. or Name…"
            maxLength={40}
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit" className="search-submit">
            View
          </button>
        </form>

        {filters && (
          <button
            type="button"
            className={`filter-btn ${activeCount > 0 ? "has-active" : ""}`}
            onClick={() => setFilterModalOpen(true)}
            title="Filter results by branches and batch"
            aria-label="Open filter results"
          >
            <svg
              className="filter-btn-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="21" y2="21" />
              <line x1="4" x2="20" y1="14" y2="14" />
              <line x1="4" x2="20" y1="7" y2="7" />
              <circle cx="14" cy="21" r="2" />
              <circle cx="8" cy="14" r="2" />
              <circle cx="16" cy="7" r="2" />
            </svg>
            <span className="filter-btn-label">Filter</span>
            {activeCount > 0 && (
              <span className="filter-count-badge">{activeCount}</span>
            )}
          </button>
        )}
      </div>

      {filters && activeCount > 0 && (
        <div className="active-filter-strip">
          <span className="strip-label">Active filters:</span>
          {selectedBatches.map((b) => (
            <button
              key={`batch-${b}`}
              type="button"
              onClick={() => removeBatch(b)}
              className="active-tag"
              title={`Remove Batch ${formatBatch(b)} filter`}
            >
              <span>Batch {formatBatch(b)}</span>
              <span className="remove-x">✕</span>
            </button>
          ))}
          {selectedBranches.map((br) => {
            const branchObj = filters.branches.find(
              (b) => b.branch_code.toLowerCase() === br
            );
            const name = branchObj?.branch_name || br.toUpperCase();
            return (
              <button
                key={`branch-${br}`}
                type="button"
                onClick={() => removeBranch(br)}
                className="active-tag"
                title={`Remove ${name} filter`}
              >
                <span>{name}</span>
                <span className="remove-x">✕</span>
              </button>
            );
          })}
          <Link href={clearAllHref} scroll={false} className="clear-all-link">
            Clear all
          </Link>
        </div>
      )}


      {open && hits.length > 0 && (
        <ul className="suggest" role="listbox">
          {hits.map((h, i) => (
            <li key={h.rollno}>
              <button
                role="option"
                aria-selected={i === cursor}
                className={i === cursor ? "sel" : ""}
                onClick={() => go(h.rollno)}
                onMouseEnter={() => setCursor(i)}
              >
                <span className="who">
                  <strong>{h.name}</strong>
                  <span className="roll">
                    {h.rollno.toUpperCase()} ·{" "}
                    {h.branch?.branch_code?.toUpperCase()} · {h.batch}
                  </span>
                </span>
                <span className="cg">{h.summary?.cgpi ?? "—"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {filters && (
        <FilterModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          batches={filters.batches}
          branches={filters.branches}
          currentBatch={filters.currentBatch}
          currentBranch={filters.currentBranch}
          currentSize={filters.currentSize}
        />
      )}
    </div>
  );
}
