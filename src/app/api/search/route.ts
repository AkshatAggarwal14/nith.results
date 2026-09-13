import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json([]);

  try {
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { rollno: { startsWith: q.toLowerCase() } },
          { name: { contains: q.toUpperCase(), mode: "insensitive" } },
        ],
      },
      include: { summary: true, branch: true },
      orderBy: { summary: { cgpi: "desc" } },
      take: 8,
    });
    return NextResponse.json(students);
  } catch (err: any) {
    console.error("API /api/search error:", err);
    return NextResponse.json(
      { error: "Search query failed", message: err?.message },
      { status: 500 }
    );
  }
}

