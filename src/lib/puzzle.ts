import { getCached, setCached } from "./cache";
import { fetchNYTPuzzle } from "./nyt-connections";
import { fetchTomsguidePuzzle } from "./tomsguide-fallback";
import type { PuzzleData } from "./types";

export async function fetchPuzzle(
  date: string,
  fetchFn: typeof fetch = fetch
): Promise<PuzzleData | null> {
  const cacheKey = `puzzle:${date}`;
  const cached = getCached<PuzzleData>(cacheKey);
  if (cached) {
    return cached;
  }

  const nytPuzzle = await fetchNYTPuzzle(date, fetchFn);
  if (nytPuzzle) {
    setCached(cacheKey, nytPuzzle);
    return nytPuzzle;
  }

  const tomsguidePuzzle = await fetchTomsguidePuzzle(date, fetchFn);
  if (tomsguidePuzzle) {
    setCached(cacheKey, tomsguidePuzzle);
    return tomsguidePuzzle;
  }

  return null;
}
