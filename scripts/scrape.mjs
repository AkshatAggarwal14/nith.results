import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { JSDOM } from "jsdom";

const prisma = new PrismaClient();

let parseErrorCount = 0;
let fetchErrCount = 0;

async function parseHTML(rawHTML, batch) {
  try {
    const dom = new JSDOM(rawHTML);

    // fetch all tables
    const tables = dom.window.document.querySelectorAll("table");

    // table[1] contains information about the student
    const studentInfo = tables[1].querySelectorAll("td");

    const rollNo = studentInfo[0]
      .querySelectorAll("p")[1]
      .textContent.trim()
      .toLowerCase();

    //* Will only work with with roll numbers such as 20bcs020
    const branch_code = rollNo.substring(2, 5);

    const name = studentInfo[1].querySelectorAll("p")[1].textContent.trim();
    const fathersName = studentInfo[2]
      .querySelectorAll("p")[1]
      .textContent.trim();

    const student = {
      name,
      rollno: rollNo,
      fathers_name: fathersName,
      batch: batch,
      branch_code: branch_code,
    };

    const courses = [];
    const results = [];
    const semSummaries = [];

    // table[2] through table[n-3] contains the result of the student in a pair of two!
    for (let i = 2; i < tables.length - 2; i += 2) {
      let semNo = i / 2;

      // table[i] contains the detailed result of the student in a particular semester
      const semInfo = tables[i].querySelectorAll("tr");

      // sem_info[0] contains the semester number
      // sem_info[1] contains the headers of the table
      for (let j = 2; j < semInfo.length; j++) {
        const subjectInfo = semInfo[j].querySelectorAll("td");

        const courseName = subjectInfo[1].textContent.trim();
        const courseCode = subjectInfo[2].textContent.trim();
        const courseCredits = parseInt(subjectInfo[3].textContent.trim());
        const gradeLetter = subjectInfo[4].textContent.trim();
        const GP = parseInt(subjectInfo[5].textContent.trim());

        courses.push({
          course_code: courseCode,
          course_title: courseName,
          course_credits: courseCredits,
        });

        results.push({
          rollno: rollNo,
          course_code: courseCode,
          semester: semNo,
          grade: GP / courseCredits,
          grade_letter: gradeLetter,
          gp: GP,
        });
      }

      // table[i+1] contains the summary of the student in a particular semester
      const semSummary = tables[i + 1].querySelectorAll("td");

      const sgpaEq = semSummary[1].querySelectorAll("p")[1].textContent.trim();
      const sgpi = sgpaEq.substring(sgpaEq.indexOf("=") + 1).trim();

      const sgpiTotal = parseInt(
        semSummary[2].querySelectorAll("p")[1].textContent.trim()
      );

      const cgpiEq = semSummary[3].querySelectorAll("p")[1].textContent.trim();
      const cgpi = cgpiEq.substring(cgpiEq.indexOf("=") + 1).trim();

      const cgpiTotal = parseInt(
        semSummary[4].querySelectorAll("p")[1].textContent.trim()
      );

      semSummaries.push({
        // rollno: rollNo,
        semester: semNo,
        sgpi: sgpi,
        sgpi_total: sgpiTotal,
        cgpi: cgpi,
        cgpi_total: cgpiTotal,
      });
    }

    // Insert all the data into the database
    await prisma.student.upsert({
      create: {
        ...student,
        branch_code: branch_code,
        sem_summary: {
          createMany: {
            data: semSummaries,
            skipDuplicates: true,
          },
        },
        summary: {
          create: semSummaries[semSummaries.length - 1],
        },
      },
      update: {
        ...student,
        sem_summary: {
          createMany: {
            data: semSummaries,
            skipDuplicates: true,
          },
        },
        summary: {
          update: semSummaries[semSummaries.length - 1],
        },
      },
      where: {
        rollno: rollNo,
      },
    });

    await prisma.course.createMany({
      data: courses,
      skipDuplicates: true,
    });

    await prisma.result.createMany({
      data: results,
      skipDuplicates: true,
    });

    return rollNo;
  } catch (err) {
    console.log(err);
    parseErrorCount++;
    return null;
  }
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Auto-enumeration tuning. History (batches 20/21) shows dense 001..max
// with max single-number gaps, so 10 consecutive "not found" is a safe stop.
const CONSEC_NOT_FOUND_LIMIT =
  Number(process.env.CONSEC_NOT_FOUND_LIMIT) || 10;
const MAX_ROLL = Number(process.env.MAX_ROLL) || 250;
const REQUEST_DELAY_MS = 400;
const FETCH_TIMEOUT = 10000;
const FETCH_RETRIES = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseTokens(indexHtml) {
  const csrf = indexHtml.match(/name="CSRFToken" value="([^"]+)"/)?.[1];
  const rvt = indexHtml.match(
    /RequestVerificationToken"[^>]*value="([^"]+)"/
  )?.[1];
  if (!csrf || !rvt)
    throw new Error("Failed to parse CSRF/RVT tokens from index.asp");
  return { csrf, rvt };
}

function cookiesFromHeaders(setCookie) {
  if (!setCookie) return "";
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
  return arr.map((c) => c.split(";")[0]).join("; ");
}

// One session (cookies + tokens from a single index.asp GET) serves many
// result.asp POSTs — verified 10 sequential rolls on one session. Refresh
// only when the server rejects us.
const sessions = new Map();

async function getSession(batch) {
  const cached = sessions.get(batch);
  if (cached) return cached;
  const base = `http://results.nith.ac.in/scheme${batch}/studentresult`;
  const idx = await axios.get(`${base}/index.asp`, {
    timeout: FETCH_TIMEOUT,
    headers: { "User-Agent": UA },
  });
  const { csrf, rvt } = parseTokens(idx.data);
  const session = {
    base,
    csrf,
    rvt,
    cookie: cookiesFromHeaders(idx.headers["set-cookie"]),
  };
  sessions.set(batch, session);
  return session;
}

async function postResult(session, rollNo) {
  const body = new URLSearchParams({
    RollNumber: rollNo,
    CSRFToken: session.csrf,
    RequestVerificationToken: session.rvt,
    B1: "Submit",
  }).toString();

  const res = await axios.post(`${session.base}/result.asp`, body, {
    timeout: FETCH_TIMEOUT,
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${session.base}/index.asp`,
      ...(session.cookie ? { Cookie: session.cookie } : {}),
    },
  });
  return res.data;
}

// Network errors throw (retryable); "not found" returns HTML normally.
// On POST failure, refresh the session once and retry — that distinguishes
// an expired session from a per-student server error (e.g. 21bcs001 500s
// even with fresh tokens, so it must be skipped, not counted as not-found).
async function fetchResultHTML(batch, rollNo) {
  let lastErr;
  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const session = await getSession(batch);
      try {
        return await postResult(session, rollNo);
      } catch (err) {
        // Possibly stale session: drop it, re-establish once, retry same roll.
        sessions.delete(batch);
        const fresh = await getSession(batch);
        return await postResult(fresh, rollNo);
      }
    } catch (err) {
      lastErr = err;
      console.log(`${rollNo} fetch attempt ${attempt} failed: ${err.message}`);
      sessions.delete(batch);
      await sleep(1000 * attempt);
    }
  }
  throw lastErr;
}

// Invalid roll returns HTTP 200 with ~1 table containing "Roll number Problem"
// (valid results have many tables + SGPI). Keep this separate from parse errors.
function isNotFoundPage(html) {
  if (/roll\s*number\s*problem/i.test(html)) return true;
  try {
    const tables = new JSDOM(html).window.document.querySelectorAll("table");
    if (tables.length <= 2) return true;
  } catch {
    /* fall through */
  }
  return false;
}

async function enumerateBranch(batch, branchCode, foundEmails) {
  let consecNotFound = 0;
  for (let n = 1; n <= MAX_ROLL; n++) {
    const rollNo = `${batch}${branchCode}${String(n).padStart(3, "0")}`;
    console.log(rollNo);
    let html;
    try {
      html = await fetchResultHTML(batch, rollNo);
    } catch (err) {
      // Transient failure: do NOT count toward stop streak, keep going.
      console.log(`${rollNo} skipped after retries: ${err.message}`);
      fetchErrCount++;
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    if (isNotFoundPage(html)) {
      consecNotFound++;
      if (consecNotFound >= CONSEC_NOT_FOUND_LIMIT) {
        console.log(
          `Stopping ${batch}${branchCode} at ${rollNo} after ${consecNotFound} consecutive not-found.`
        );
        break;
      }
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    const savedRoll = await parseHTML(html, batch);
    if (savedRoll) {
      consecNotFound = 0;
      foundEmails.push(`${savedRoll}@nith.ac.in`);
    }
    // Parse failure on a valid-looking page: don't count toward stop streak.
    await sleep(REQUEST_DELAY_MS);
  }
}

async function fetchBatch(batch, branchCodes) {
  // Probe: skip batches with no scheme on the portal (e.g. future years,
  // graduated batches the portal removed) instead of enumerating blindly.
  try {
    await getSession(batch);
  } catch (err) {
    console.log(`Skipping batch ${batch}: no scheme on portal (${err.message})`);
    return [];
  }

  const foundEmails = [];
  for (const branchCode of branchCodes) {
    console.log(`Enumerating ${batch}${branchCode}...`);
    await enumerateBranch(batch, branchCode, foundEmails);
  }

  return foundEmails;
}

async function main() {
  // No batch files needed: `node scripts/scrape.mjs 22 23`, or no args
  // to cover 20..current year (missing schemes are probed and skipped).
  const { branchMap } = await import("./branch.mjs").catch(() => ({
    branchMap: null,
  }));
  const allBranches = branchMap
    ? Object.keys(branchMap)
    : [
        "bcs",
        "bec",
        "bce",
        "bar",
        "bch",
        "bee",
        "bme",
        "bms",
        "bma",
        "bph",
        "dcs",
        "dec",
      ];
  // Test hook: BRANCHES=bcs,bee limits enumeration to those branches.
  const onlyBranches = (process.env.BRANCHES || "")
    .split(",")
    .map((b) => b.trim().toLowerCase())
    .filter(Boolean);
  const branchCodes =
    onlyBranches.length > 0
      ? allBranches.filter((b) => onlyBranches.includes(b))
      : allBranches;

  const argBatches = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
  let batches = argBatches;
  if (batches.length === 0) {
    // Default scope is batches 20..current year; the top end is open —
    // missing schemes (e.g. future years) are probed and skipped in fetchBatch.
    const startYY = Number(process.env.START_BATCH) || 20;
    const curYY = Number(String(new Date().getFullYear()).slice(2));
    batches = Array.from(
      { length: curYY - startYY + 1 },
      (_, i) => String(startYY + i)
    );
  }

  for (const batch of batches) {
    console.log(`Processing ${batch} batch`);
    const found = await fetchBatch(batch, branchCodes);
    console.log(`Found ${found.length} students in batch ${batch}.`);
  }

  console.log("Failed to parse for", parseErrorCount, "students.");
  console.log("Failed to fetch for", fetchErrCount, "students.");
}

await main();
