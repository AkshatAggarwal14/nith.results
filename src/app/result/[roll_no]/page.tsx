import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar, Footer } from "../../components/SiteShell";
import ReportTabs from "./ReportTabs";
import EmailAction from "./EmailAction";
import { prisma } from "../../lib/prisma";

export default async function ResultPage({
  params,
}: {
  params: { roll_no: string };
}) {
  const rollno = params.roll_no.toLowerCase();

  const student = await prisma.student.findFirst({
    where: { rollno },
    include: { branch: true, summary: true, sem_summary: true, rank: true },
  });
  if (!student) notFound();

  const subjects = await prisma.result.findMany({
    where: { rollno },
    include: { course: true },
    orderBy: [{ semester: "asc" }, { course_code: "asc" }],
  });

  const sems = [...student.sem_summary]
    .sort((a, b) => a.semester - b.semester)
    .map((s) => {
      const subs = subjects.filter((r) => r.semester === s.semester);
      return {
        semester: s.semester,
        sgpi: s.sgpi,
        cgpi: s.cgpi,
        credits: subs.reduce((t, r) => t + (r.course?.course_credits ?? 0), 0),
        subjects: subs.map((r) => ({
          course_code: r.course_code,
          course_title: r.course?.course_title ?? null,
          course_credits: r.course?.course_credits ?? null,
          grade_letter: r.grade_letter,
          gp: r.gp,
        })),
      };
    });

  // Semester histories of college #1 and class #1 for graph compare.
  const [collegeTop, classTop] = await Promise.all([
    prisma.rank.findFirst({ where: { college_rank_cgpi: 1 } }),
    prisma.rank.findFirst({
      where: {
        class_rank_cgpi: 1,
        student: { batch: student.batch, branch_code: student.branch_code },
      },
    }),
  ]);
  const topperRolls = [collegeTop?.rollno, classTop?.rollno].filter(
    (r): r is string => !!r && r !== rollno
  );
  const topSems = topperRolls.length
    ? await prisma.sem_summary.findMany({
        where: { rollno: { in: topperRolls } },
        orderBy: { semester: "asc" },
      })
    : [];
  const topStudents = topperRolls.length
    ? await prisma.student.findMany({
        where: { rollno: { in: topperRolls } },
        include: { summary: true },
      })
    : [];
  const sgpiBySem = (r?: string) =>
    topSems
      .filter((s) => s.rollno === r)
      .map((s) => parseFloat(s.sgpi) || null);
  const meta = (r?: string) => {
    const s = topStudents.find((t) => t.rollno === r);
    return s
      ? { name: s.name, rollno: s.rollno, cgpi: s.summary?.cgpi ?? "" }
      : null;
  };
  const compare = {
    college: sgpiBySem(collegeTop?.rollno),
    branch: sgpiBySem(classTop?.rollno),
    collegeMeta: meta(collegeTop?.rollno),
    branchMeta: meta(classTop?.rollno),
  };

  const sgpis = sems.map((s) => parseFloat(s.sgpi) || 0);
  const delta =
    sems.length >= 2
      ? parseFloat(sems[sems.length - 1].cgpi) -
        parseFloat(sems[sems.length - 2].cgpi)
      : 0;
  const totalCourses = sems.reduce((t, s) => t + s.subjects.length, 0);

  return (
    <main className="wrap">
      <Topbar />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/" className="crumb-link">
          <svg
            className="crumb-icon"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Leaderboard</span>
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
        <Link href={`/?batch=${student.batch}`} className="crumb-link">
          Batch {student.batch}
        </Link>
        {student.branch_code && (
          <>
            <span className="crumb-sep" aria-hidden="true">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
            <Link
              href={`/?batch=${student.batch}&branch=${student.branch_code}`}
              className="crumb-link"
              title={student.branch?.branch_name ?? student.branch_code.toUpperCase()}
            >
              {student.branch?.branch_code?.toUpperCase() ??
                student.branch_code.toUpperCase()}
            </Link>
          </>
        )}
        <span className="crumb-sep" aria-hidden="true">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
        <span className="crumb-current" aria-current="page">
          {student.rollno.toUpperCase()}
        </span>
      </nav>

      <section className="profile">
        <div className="who">
          <span className="avatar">{student.name[0]}</span>
          <div className="who-body">
            <h1>{student.name}</h1>
            <p className="who-meta">
              <span className="roll-badge">{student.rollno.toUpperCase()}</span>
              <span className="sep">·</span>
              <span>
                {student.branch?.branch_name ??
                  student.branch?.branch_code?.toUpperCase()}
              </span>
              <span className="sep">·</span>
              <span>batch {student.batch}</span>
            </p>
            <EmailAction
              rollno={student.rollno}
              email={`${student.rollno.toLowerCase()}@nith.ac.in`}
            />
          </div>
          {student.rank && (
            <span className="bigbadge">
              College Rank #{student.rank.college_rank_cgpi}
            </span>
          )}
        </div>

        <div className="stats">
          <div className="stat">
            <span>Cumulative CGPI</span>
            <strong>
              {student.summary?.cgpi} <small>/ 10</small>
            </strong>
            {sems.length >= 2 && (
              <em className={delta >= 0 ? "up" : "down"}>
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(2)} vs last sem
              </em>
            )}
          </div>
          <div className="stat">
            <span>Total courses</span>
            <strong>{totalCourses}</strong>
          </div>
          <div className="stat">
            <span>Highest SGPI</span>
            <strong>{Math.max(...sgpis).toFixed(2)}</strong>
          </div>
          <div className="stat">
            <span>Lowest SGPI</span>
            <strong>{Math.min(...sgpis).toFixed(2)}</strong>
          </div>
        </div>

        {student.rank && (
          <div className="rankchips">
            <span className="rankchip">
              Batch <strong>#{student.rank.year_rank_cgpi}</strong>
            </span>
            <span className="rankchip">
              Class <strong>#{student.rank.class_rank_cgpi}</strong>
            </span>
          </div>
        )}
      </section>

      <h2 style={{ marginTop: "2rem" }}>Academic history</h2>
      <ReportTabs sems={sems} compare={compare} />

      <Footer />
    </main>
  );
}
