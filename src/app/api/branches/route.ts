import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const branches = await prisma.branch.findMany({});
    return NextResponse.json(branches);
  } catch (err: any) {
    console.error("API /api/branches error:", err);
    return NextResponse.json(
      { error: "Failed to fetch branches", message: err?.message },
      { status: 500 }
    );
  }
}

