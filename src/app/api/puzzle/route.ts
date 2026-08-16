import { NextResponse } from "next/server";
import { getTodayInET } from "@/lib/date";
import { fetchPuzzle } from "@/lib/puzzle";

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? getTodayInET();

  const puzzle = await fetchPuzzle(date);

  if (!puzzle) {
    return NextResponse.json(
      { error: "Unable to fetch puzzle data." },
      { status: 503 }
    );
  }

  return NextResponse.json(puzzle);
}
