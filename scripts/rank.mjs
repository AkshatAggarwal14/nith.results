import { PrismaClient } from "@prisma/client";
import { branchMap } from "./branch.mjs";
const prisma = new PrismaClient();

const rankMap = new Map();

async function _rank(query, type, basedOn) {
  const students = await prisma.student.findMany({
    where: query,
    include: {
      summary: true,
    },
    orderBy: [
      {
        summary: {
          [basedOn]: "desc",
        },
      },
      {
        rollno: "asc",
      },
    ],
  });

  let currentRank = 1;
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const prev = i > 0 ? students[i - 1] : null;

    // Tied scores get the same rank (competition ranking: 1, 2, 2, 4...)
    if (
      prev &&
      s.summary &&
      prev.summary &&
      s.summary[basedOn] === prev.summary[basedOn]
    ) {
      // keep same currentRank
    } else {
      currentRank = i + 1;
    }

    if (!rankMap.has(s.rollno)) {
      rankMap.set(s.rollno, {});
    }

    rankMap.get(s.rollno)[`${type}_rank_${basedOn}`] = currentRank;
  }
}

async function _updateRank() {
  await prisma.rank.deleteMany({});

  const ranksArr = [];
  for (const [rollno, ranks] of rankMap) {
    ranksArr.push({
      rollno: rollno,
      ...ranks,
    });
  }

  await prisma.rank.createMany({
    data: ranksArr,
  });
}

async function main() {
  // rank in entire college
  await _rank({}, "college", "cgpi", true);
  await _rank({}, "college", "sgpi");

  // Batches from argv, else distinct batches already in the DB.
  const argBatches = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
  const batches =
    argBatches.length > 0
      ? argBatches
      : (
          await prisma.student.findMany({
            select: { batch: true },
            distinct: ["batch"],
          })
        ).map((s) => s.batch);
  for (const batch of batches) {
    // rank in the batch
    await _rank(
      {
        batch: batch,
      },
      "year",
      "cgpi"
    );
    await _rank(
      {
        batch: batch,
      },
      "year",
      "sgpi"
    );

    // rank in the class
    const branches = Object.keys(branchMap);
    for (const branch of branches) {
      await _rank(
        {
          branch_code: branch,
          batch: batch,
        },
        "class",
        "cgpi"
      );
      await _rank(
        {
          branch_code: branch,
          batch: batch,
        },
        "class",
        "sgpi"
      );
    }
  }

  await _updateRank();
}

await main();
