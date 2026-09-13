import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { roll_no: string } }
) {
  const roll_no = params.roll_no.toLowerCase();

  const result = await prisma.student.findFirst({
    where: {
      rollno: roll_no,
    },
    include: {
      branch: true,
      summary: true,
      sem_summary: true,
      rank: true,
    },
  });

  return NextResponse.json(result);
}
