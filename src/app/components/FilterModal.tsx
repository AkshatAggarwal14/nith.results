"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

export type FilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  batches: { batch: string }[];
  branches: { branch_code: string; branch_name: string }[];
  currentBatch?: string; // Comma-separated: e.g. "20" or "20,21"
  currentBranch?: string; // Comma-separated: e.g. "bcs" or "bcs,bee"
  currentSize?: number;
};

export function formatBatch(b: string) {
  if (b.length === 2) return `20${b}`;
  return b;
}

export default function FilterModal({
  isOpen,
  onClose,
  batches,
  branches,
  currentBatch,
  currentBranch,
  currentSize,
}: FilterModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const selectedBatches = useMemo(() => {
    return currentBatch ? currentBatch.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }, [currentBatch]);

  const selectedBranches = useMemo(() => {
    return currentBranch ? currentBranch.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : [];
  }, [currentBranch]);

  if (!isOpen) return null;

  const buildHref = (newBatches: string[], newBranches: string[]) => {
    const q: Record<string, string> = {};
    if (newBatches.length > 0) q.batch = newBatches.join(",");
    if (newBranches.length > 0) q.branch = newBranches.join(",");
    if (currentSize && currentSize !== 25) q.size = String(currentSize);
    q.page = "1";

    const qs = new URLSearchParams(q).toString();
    return qs ? `/?${qs}` : "/";
  };

  const toggleBranch = (code: string) => {
    const lower = code.toLowerCase();
    let next: string[];
    if (selectedBranches.includes(lower)) {
      next = selectedBranches.filter((c) => c !== lower);
    } else {
      next = [...selectedBranches, lower];
    }
    router.replace(buildHref(selectedBatches, next));
  };

  const clearBranches = () => {
    router.replace(buildHref(selectedBatches, []));
  };

  const toggleBatch = (b: string) => {
    let next: string[];
    if (selectedBatches.includes(b)) {
      next = selectedBatches.filter((item) => item !== b);
    } else {
      next = [...selectedBatches, b];
    }
    router.replace(buildHref(next, selectedBranches));
  };

  const clearBatches = () => {
    router.replace(buildHref([], selectedBranches));
  };

  const resetAll = () => {
    router.replace(buildHref([], []));
  };


  const totalActive = selectedBatches.length + selectedBranches.length;

  return (
    <div
      className="filter-backdrop"
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div
        className="filter-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
      >
        <div className="filter-header">
          <div>
            <h2 id="filter-title">Filter Results</h2>
            <p className="filter-subtitle">
              Select multiple branches and batches. Click again to unselect.
            </p>
          </div>
          <button
            type="button"
            className="filter-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="filter-body">
          <div className="filter-group">
            <div className="filter-group-header">
              <h3 className="filter-group-title">BY BRANCHES</h3>
              {selectedBranches.length > 0 && (
                <span className="filter-selected-pill">
                  {selectedBranches.length} selected
                </span>
              )}
            </div>
            <div className="filter-chips">
              <button
                type="button"
                onClick={clearBranches}
                className={`fchip ${selectedBranches.length === 0 ? "active" : ""}`}
                aria-pressed={selectedBranches.length === 0}
              >
                All Branches
              </button>
              {branches.map((b) => {
                const isSelected = selectedBranches.includes(
                  b.branch_code.toLowerCase()
                );
                return (
                  <button
                    key={b.branch_code}
                    type="button"
                    onClick={() => toggleBranch(b.branch_code)}
                    className={`fchip ${isSelected ? "active" : ""}`}
                    aria-pressed={isSelected}
                  >
                    {isSelected && <span className="chip-check">✓</span>}
                    <span>{b.branch_name || b.branch_code.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group-header">
              <h3 className="filter-group-title">BY BATCH</h3>
              {selectedBatches.length > 0 && (
                <span className="filter-selected-pill">
                  {selectedBatches.length} selected
                </span>
              )}
            </div>
            <div className="filter-chips">
              <button
                type="button"
                onClick={clearBatches}
                className={`fchip ${selectedBatches.length === 0 ? "active" : ""}`}
                aria-pressed={selectedBatches.length === 0}
              >
                All Batches
              </button>
              {batches.map((b) => {
                const isSelected = selectedBatches.includes(b.batch);
                return (
                  <button
                    key={b.batch}
                    type="button"
                    onClick={() => toggleBatch(b.batch)}
                    className={`fchip ${isSelected ? "active" : ""}`}
                    aria-pressed={isSelected}
                  >
                    {isSelected && <span className="chip-check">✓</span>}
                    <span>{formatBatch(b.batch)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="filter-footer">
          {totalActive > 0 ? (
            <button
              type="button"
              onClick={resetAll}
              className="filter-reset-btn"
            >
              Reset all filters
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            className="filter-done-btn"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
