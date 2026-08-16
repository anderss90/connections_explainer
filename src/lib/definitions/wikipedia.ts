import type { WordDefinition } from "../types";

interface WikipediaSummary {
  extract?: string;
  title?: string;
}

interface WikipediaSearchResponse {
  query?: {
    search?: Array<{ title: string }>;
  };
}

export function toWikipediaTitle(word: string): string {
  return word
    .split(/\s+/)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join("_");
}

export function trimWikipediaExtract(extract: string): string {
  const trimmed = extract.trim();
  if (trimmed.length <= 280) {
    return trimmed;
  }

  const sentences = trimmed.split(/(?<=\.)\s+/);
  let result = sentences[0] ?? trimmed;

  for (let index = 1; index < sentences.length; index += 1) {
    const next = `${result} ${sentences[index]}`.trim();
    if (next.length > 280) {
      break;
    }
    result = next;
  }

  if (result.length <= 280) {
    return result;
  }

  return `${trimmed.slice(0, 277).trim()}...`;
}

export function parseWikipediaSummary(
  summary: WikipediaSummary,
  word: string
): WordDefinition | null {
  const extract = summary.extract?.trim();
  if (!extract || extract.toLowerCase().includes("may refer to:")) {
    return null;
  }

  return {
    word,
    definition: trimWikipediaExtract(extract),
    source: "wikipedia",
  };
}

async function fetchWikipediaSummary(
  title: string,
  fetchFn: typeof fetch
): Promise<WikipediaSummary | null> {
  const encodedTitle = encodeURIComponent(title.replace(/ /g, "_"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;

  try {
    const response = await fetchFn(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as WikipediaSummary;
  } catch {
    return null;
  }
}

async function searchWikipediaTitle(
  word: string,
  fetchFn: typeof fetch
): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: word,
    format: "json",
    utf8: "1",
    srlimit: "1",
  });

  const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

  try {
    const response = await fetchFn(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as WikipediaSearchResponse;
    return data.query?.search?.[0]?.title ?? null;
  } catch {
    return null;
  }
}

export async function fetchWikipediaDefinition(
  word: string,
  fetchFn: typeof fetch = fetch
): Promise<WordDefinition | null> {
  const directTitle = toWikipediaTitle(word);
  const directSummary = await fetchWikipediaSummary(directTitle, fetchFn);
  const directResult = directSummary
    ? parseWikipediaSummary(directSummary, word)
    : null;

  if (directResult) {
    return directResult;
  }

  const searchTitle = await searchWikipediaTitle(word, fetchFn);
  if (!searchTitle) {
    return null;
  }

  const searchSummary = await fetchWikipediaSummary(searchTitle, fetchFn);
  return searchSummary ? parseWikipediaSummary(searchSummary, word) : null;
}

export async function fetchWikipediaDefinitions(
  words: string[],
  fetchFn: typeof fetch = fetch
): Promise<WordDefinition[]> {
  const results = await Promise.all(
    words.map((word) => fetchWikipediaDefinition(word, fetchFn))
  );

  return results.filter((result): result is WordDefinition => result !== null);
}
