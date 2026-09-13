import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skip = searchParams.get("skip") || 0;
  const take = searchParams.get("take") || 3000;

  try {
    const students = await prisma.student.findMany({
      include: {
        summary: true,
        rank: true,
      },
      skip: Number(skip),
      take: Number(take),
      orderBy: {
        summary: {
          cgpi: "desc",
        },
      },
    });
    return NextResponse.json(students);
  } catch (err: any) {
    console.error("API /api/result error:", err);
    return NextResponse.json(
      { error: "Failed to fetch student results", message: err?.message },
      { status: 500 }
    );
  }
}

