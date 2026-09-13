import Link from "next/link";
import SearchForm from "./components/SearchForm";
import Pagination from "./components/Pagination";
import { Topbar, Footer } from "./components/SiteShell";
import { prisma } from "./lib/prisma";

const PAGE_SIZES = [25, 50, 75, 100, 200];
const DEFAULT_SIZE = 25;

export default async function Home({
  searchParams,
}: {
  searchParams: {
    batch?: string;
    branch?: string;
    page?: string;
    size?: string;
  };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const size = PAGE_SIZES.includes(Number(searchParams.size))
    ? Number(searchParams.size)
    : DEFAULT_SIZE;

  const batchList = searchParams.batch
    ? searchParams.batch.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const branchList = searchParams.branch
    ? searchParams.branch.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const where: {
    batch?: string | { in: string[] };
    branch_code?: string | { in: string[] };
  } = {};

  if (batchList.length === 1) {
    where.batch = batchList[0];
  } else if (batchList.length > 1) {
    where.batch = { in: batchList };
  }

  if (branchList.length === 1) {
    where.branch_code = branchList[0];
  } else if (branchList.length > 1) {
    where.branch_code = { in: branchList };
  }

  const [batches, branches, total, students] = await Promise.all([
    prisma.student.findMany({
      select: { batch: true },
      distinct: ["batch"],
      orderBy: { batch: "asc" },
    }),
    prisma.branch.findMany({ orderBy: { branch_name: "asc" } }),
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: { summary: true, rank: true, branch: true },
      orderBy: [
        { summary: { cgpi: "desc" } },
        { rollno: "asc" },
      ],
      skip: (page - 1) * size,
      take: size,
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / size));
  const q = (p: number, extra: Record<string, string | undefined> = {}) => {
    const params: Record<string, string> = {};
    const batch = extra.batch ?? searchParams.batch;
    const branch = extra.branch ?? searchParams.branch;
    if (batch) params.batch = batch;
    if (branch) params.branch = branch;
    if (size !== DEFAULT_SIZE) params.size = String(size);
    for (const [k, v] of Object.entries(extra)) {
      if (k !== "batch" && k !== "branch" && v) params[k] = v;
    }
    params.page = String(p);
    return `/?${new URLSearchParams(params)}`;
  };
  const sizeHref = (s: number) =>
    `/?${new URLSearchParams({
      ...(searchParams.batch ? { batch: searchParams.batch } : {}),
      ...(searchParams.branch ? { branch: searchParams.branch } : {}),
      ...(s !== DEFAULT_SIZE ? { size: String(s) } : {}),
      page: "1",
    })}`;
  const allBatchesHref = `/?${new URLSearchParams({
    ...(searchParams.branch ? { branch: searchParams.branch } : {}),
    ...(size !== DEFAULT_SIZE ? { size: String(size) } : {}),
    page: "1",
  })}`;
  const allBranchesHref = `/?${new URLSearchParams({
    ...(searchParams.batch ? { batch: searchParams.batch } : {}),
    ...(size !== DEFAULT_SIZE ? { size: String(size) } : {}),
    page: "1",
  })}`;

  return (
    <main className="wrap">
      <Topbar />
      <header className="hero">
        <h1>
          NIT Hamirpur <em>results</em>, ranked.
        </h1>
        <p>Search any roll number, or browse the leaderboard.</p>
      </header>

      <SearchForm
        filters={{
          batches,
          branches,
          currentBatch: searchParams.batch,
          currentBranch: searchParams.branch,
          currentSize: size,
        }}
      />

      <div className="listbar" id="leaderboard">
        <Pagination
          page={page}
          pages={pages}
          baseParams={{
            batch: searchParams.batch,
            branch: searchParams.branch,
            size,
          }}
          isBottom={false}
          showJump={false}
        />
        <div className="sizes">
          <span>Per page:</span>
          {PAGE_SIZES.map((s) => (
            <Link
              key={s}
              href={sizeHref(s)}
              className={s === size ? "pgnum active" : "pgnum"}
              scroll={false}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      <section className="rcards">
        {students.map((s, i) => {
          const rankNum =
            branchList.length === 1 && batchList.length === 1
              ? s.rank?.class_rank_cgpi
              : batchList.length === 1
              ? s.rank?.year_rank_cgpi
              : s.rank?.college_rank_cgpi;
          const displayRank =
            rankNum != null ? `#${rankNum}` : `#${(page - 1) * size + i + 1}`;

          return (
            <Link key={s.rollno} href={`/result/${s.rollno}`} className="rcard">
              <span className="rank">{displayRank}</span>
              <h3>{s.name}</h3>
            <div className="roll">
              {s.rollno.toUpperCase()} ·{" "}
              {s.branch?.branch_code?.toUpperCase()} · batch {s.batch}
            </div>
            <div className="cgpi">
              {s.summary?.cgpi} <small>CGPI</small>
            </div>
            {s.rank && (
              <div className="splits">
                <span>Year #{s.rank.year_rank_cgpi}</span>
                <span>Class #{s.rank.class_rank_cgpi}</span>
              </div>
            )}
          </Link>
        );
      })}
      </section>

      <Pagination
        page={page}
        pages={pages}
        baseParams={{
          batch: searchParams.batch,
          branch: searchParams.branch,
          size,
        }}
        isBottom={true}
        showJump={true}
      />
      <p className="count">
        Showing {total > 0 ? (page - 1) * size + 1 : 0}–{Math.min(page * size, total)} of {total.toLocaleString("en-IN")} students
      </p>

      <Footer />
    </main>
  );
}
