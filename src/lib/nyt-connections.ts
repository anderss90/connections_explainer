import type { NYTRawResponse, PuzzleData } from "./types";

const NYT_CONNECTIONS_URL =
  "https://www.nytimes.com/svc/connections/v2/{date}.json";

export function flattenWords(categories: NYTRawResponse["categories"]): string[] {
  if (!categories) {
    return [];
  }

  const words = categories.flatMap((category) =>
    category.cards.map((card) => card.content.trim().toUpperCase())
  );

  return [...new Set(words)].sort((a, b) => a.localeCompare(b));
}

export function parseNYTResponse(data: NYTRawResponse, date: string): PuzzleData | null {
  if (data.status !== "OK" || !data.categories?.length) {
    return null;
  }

  const words = flattenWords(data.categories);

  if (words.length === 0) {
    return null;
  }

  return {
    puzzleId: data.id ?? null,
    printDate: data.print_date ?? date,
    editor: data.editor ?? null,
    words,
    source: "nyt",
  };
}

export async function fetchNYTPuzzle(
  date: string,
  fetchFn: typeof fetch = fetch
): Promise<PuzzleData | null> {
  const url = NYT_CONNECTIONS_URL.replace("{date}", date);

  try {
    const response = await fetchFn(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ConnectionsWordsSite/1.0",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NYTRawResponse;
    return parseNYTResponse(data, date);
  } catch {
    return null;
  }
}
