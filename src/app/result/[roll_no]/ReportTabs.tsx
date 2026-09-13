"use client";

import { useState } from "react";

type Subject = {
  course_code: string;
  course_title: string | null;
  course_credits: number | null;
  grade_letter: string;
  gp: number;
};

type Sem = {
  semester: number;
  sgpi: string;
  cgpi: string;
  credits: number;
  subjects: Subject[];
};

function gradeClass(g: string) {
  const t = g.trim().toUpperCase();
  if (t === "A") return "g-a";
  if (t === "AB" || t === "A+") return "g-ab";
  if (t === "B") return "g-b";
  if (t === "BC") return "g-bc";
  if (t === "C") return "g-c";
  if (t === "D" || t === "F" || t === "FAIL") return "g-f";
  return "g-na";
}

function Report({ sems }: { sems: Sem[] }) {
  const openAllAndPrint = () => {
    document
      .querySelectorAll(".report details")
      .forEach((d) => ((d as HTMLDetailsElement).open = true));
    setTimeout(() => window.print(), 50);
  };
  return (
    <div>
      <div className="reporthead">
        <span>
          {sems.length} semesters ·{" "}
          {sems.reduce((t, s) => t + s.subjects.length, 0)} courses
        </span>
        <button className="printbtn" onClick={openAllAndPrint}>
          Print transcript
        </button>
      </div>
      <div className="semlist">
        {sems.map((s, i) => {
          const prev = i > 0 ? parseFloat(sems[i - 1].sgpi) || 0 : null;
          const cur = parseFloat(s.sgpi) || 0;
          const d = prev == null ? null : cur - prev;
          return (
            <details key={s.semester} open={i === 0} className="semcard">
              <summary>
                <span className="semtag">
                  Sem {String(s.semester).padStart(2, "0")}
                </span>
                <span className="semmeta">{s.credits} credits</span>
                {d != null && (
                  <span className={d >= 0 ? "delta up" : "delta down"}>
                    {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(2)}
                  </span>
                )}
                <span className="semscores">
                  <span>
                    SGPI <strong>{s.sgpi}</strong>
                  </span>
                  <span>
                    CGPI <strong>{s.cgpi}</strong>
                  </span>
                </span>
              </summary>
              <ul className="subjlist">
                {s.subjects.map((r) => {
                  const max = (r.course_credits ?? 0) * 10;
                  const pct =
                    max > 0
                      ? Math.max(4, Math.min(100, (r.gp / max) * 100))
                      : 0;
                  return (
                    <li key={r.course_code}>
                      <span
                        className="pfill"
                        style={{ width: `${pct}%` }}
                      />
                      <div>
                        <div className="subj">{r.course_title}</div>
                        <div className="roll">
                          {r.course_code}
                          {r.course_credits != null &&
                            ` · ${r.course_credits} cr`}
                        </div>
                      </div>
                      <span className={`grade ${gradeClass(r.grade_letter)}`}>
                        {r.grade_letter}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
      <p className="unofficial">
        Unofficial transcript generated from results.nith.ac.in data.
      </p>
    </div>
  );
}

type TopperMeta = { name: string; rollno: string; cgpi: string } | null;

function TopperCard({
  label,
  meta,
  checked,
  onToggle,
  dasharray,
  href,
}: {
  label: string;
  meta: NonNullable<TopperMeta>;
  checked: boolean;
  onToggle: () => void;
  dasharray: string;
  href: string;
}) {
  return (
    <div
      className={`tcard${checked ? "" : " off"}`}
      role="link"
      tabIndex={0}
      aria-label={`View ${label} report`}
      onClick={() => (window.location.href = href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") window.location.href = href;
      }}
    >
      <div className="tinfo">
        <span className="tlabel">{label}</span>
        <span className="roll">
          {meta.rollno.toUpperCase()} · CGPI {meta.cgpi}
        </span>
      </div>
      <svg width="26" height="6" aria-hidden="true">
        <line
          x1="0"
          y1="3"
          x2="26"
          y2="3"
          stroke="#9aa3b2"
          strokeWidth="3"
          strokeDasharray={dasharray}
        />
      </svg>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={`Compare with ${label}`}
        className={checked ? "switch on" : "switch"}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <span className="knob" />
      </button>
    </div>
  );
}

function Graph({
  sems,
  compare,
}: {
  sems: Sem[];
  compare: {
    college: (number | null)[];
    branch: (number | null)[];
    collegeMeta: TopperMeta;
    branchMeta: TopperMeta;
  };
}) {
  const [showCollege, setShowCollege] = useState(false);
  const [showBranch, setShowBranch] = useState(false);
  const W = 680;
  const H = 260;
  const PADL = 48;
  const PADR = 14;
  const PADT = 30;
  const PADB = 26;
  const LO = 7;
  const HI = 10;
  const slot = sems.length <= 1 ? 0 : (W - PADL - PADR) / (sems.length - 1);
  const x = (i: number) => (sems.length === 1 ? W / 2 : PADL + i * slot);
  const y = (v: number) =>
    H - PADB - ((v - LO) / (HI - LO)) * (H - PADT - PADB);
  const bw = Math.min(46, Math.max(14, slot * 0.52));
  const line = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v == null ? null : `${x(i)},${y(v)}`))
      .filter(Boolean)
      .join(" ");
  const sg = (s: Sem) => parseFloat(s.sgpi) || 0;
  const cg = (s: Sem) => parseFloat(s.cgpi) || 0;

  return (
    <div>
      <div className="legend">
        <span>
          <i className="bar sw" /> SGPI
        </span>
        <span>
          <i className="dot cg" /> CGPI
        </span>
      </div>
      {(compare.collegeMeta || compare.branchMeta) && (
        <div className="tcards">
          {compare.collegeMeta && (
            <TopperCard
              label="College topper"
              meta={compare.collegeMeta}
              checked={showCollege}
              onToggle={() => setShowCollege(!showCollege)}
              dasharray="7 4"
              href={`/result/${compare.collegeMeta.rollno}`}
            />
          )}
          {compare.branchMeta && (
            <TopperCard
              label="Class topper"
              meta={compare.branchMeta}
              checked={showBranch}
              onToggle={() => setShowBranch(!showBranch)}
              dasharray="2 4"
              href={`/result/${compare.branchMeta.rollno}`}
            />
          )}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="graph" role="img">
        {[7, 7.5, 8, 8.5, 9, 9.5, 10].map((g) => (
          <g key={g}>
            <line x1={PADL} x2={W - PADR} y1={y(g)} y2={y(g)} className="grid" />
            <text x={4} y={y(g) + 4} className="axis">
              {g.toFixed(1)}
            </text>
          </g>
        ))}
        {sems.map((s, i) => (
          <g key={`bar-${s.semester}`}>
            <rect
              x={x(i) - bw / 2}
              y={y(sg(s))}
              width={bw}
              height={Math.max(2, y(LO) - y(sg(s)))}
              rx={5}
              className="bar sg"
            >
              <title>{`Sem ${s.semester} SGPI ${s.sgpi}`}</title>
            </rect>
            <text x={x(i)} y={y(sg(s)) - 13} className="val" textAnchor="middle">
              {sg(s).toFixed(2)}
            </text>
          </g>
        ))}
        {showCollege && compare.college.length > 0 && (
          <polyline points={line(compare.college)} className="line top" />
        )}
        {showBranch && compare.branch.length > 0 && (
          <polyline points={line(compare.branch)} className="line top b" />
        )}
        <polyline
          points={line(sems.map((s) => cg(s)))}
          className="line cg"
        />
        {sems.map((s, i) => (
          <g key={s.semester}>
            <circle cx={x(i)} cy={y(cg(s))} r={4.5} className="pt cg">
              <title>{`Sem ${s.semester} CGPI ${s.cgpi}`}</title>
            </circle>
            <text x={x(i)} y={H - 8} className="axis" textAnchor="middle">
              S{s.semester}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function ReportTabs({
  sems,
  compare,
}: {
  sems: Sem[];
  compare: {
    college: (number | null)[];
    branch: (number | null)[];
    collegeMeta: TopperMeta;
    branchMeta: TopperMeta;
  };
}) {
  const [tab, setTab] = useState<"report" | "graph">("report");
  return (
    <section className="report">
      <div className="tabs" role="tablist">
        {(["report", "graph"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "tab active" : "tab"}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "report" && <Report sems={sems} />}
      {tab === "graph" && <Graph sems={sems} compare={compare} />}
    </section>
  );
}
