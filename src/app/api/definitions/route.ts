import { NextResponse } from "next/server";
import { getTodayInET } from "@/lib/date";
import { fetchWordDefinitions } from "@/lib/definitions";
import { fetchPuzzle } from "@/lib/puzzle";

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? getTodayInET();

  const puzzle = await fetchPuzzle(date);

  if (!puzzle) {
    return NextResponse.json(
      { error: "Unable to fetch puzzle data for definitions." },
      { status: 503 }
    );
  }

  const definitions = await fetchWordDefinitions(puzzle.words, date);

  return NextResponse.json({
    printDate: puzzle.printDate,
    definitions,
  });
}
