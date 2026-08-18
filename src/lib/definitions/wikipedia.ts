import { clientHeaders } from "../http";
import type { WordDefinition } from "../types";

interface WikipediaSummary {
  extract?: string;
  title?: string;
  type?: string;
  description?: string;
}

interface WikipediaSearchResponse {
  query?: {
    search?: Array<{ title: string }>;
  };
}

const STOPWORDS = new Set([
  "A",
  "AN",
  "THE",
  "OF",
  "AND",
  "OR",
  "TO",
  "IN",
  "ON",
  "FOR",
  "AT",
]);

const MUSIC_NAMED_WORK_PATTERN =
  /\b(studio album|live album|video album|song by|single by|concert tour)\b/i;

const WIKIPEDIA_HEADERS = clientHeaders("application/json");

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

export function getSignificantQueryTokens(word: string): string[] {
  return word
    .toUpperCase()
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

export function extractContainsQueryTokens(extract: string, word: string): boolean {
  const tokens = getSignificantQueryTokens(word);
  if (tokens.length === 0) {
    return true;
  }

  return tokens.every((token) => {
    const pattern = new RegExp(`\\b${escapeRegExp(token)}\\b`, "i");
    return pattern.test(extract);
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isMusicNamedWork(text?: string): boolean {
  if (!text) {
    return false;
  }

  return MUSIC_NAMED_WORK_PATTERN.test(text);
}

export function pageMetadataMatchesQuery(
  summary: WikipediaSummary,
  word: string
): boolean {
  const tokens = getSignificantQueryTokens(word);
  if (tokens.length === 0) {
    return true;
  }

  if (summary.title && extractContainsQueryTokens(summary.title, word)) {
    return true;
  }

  if (summary.description && extractContainsQueryTokens(summary.description, word)) {
    return true;
  }

  return !summary.title && !summary.description;
}

function normalizeWikipediaTitle(title: string): string {
  return title.replace(/ /g, "_").toLowerCase();
}

export function parseWikipediaSummary(
  summary: WikipediaSummary,
  word: string
): WordDefinition | null {
  if (summary.type === "disambiguation") {
    return null;
  }

  if (isMusicNamedWork(summary.description)) {
    return null;
  }

  if (!pageMetadataMatchesQuery(summary, word)) {
    return null;
  }

  const extract = summary.extract?.trim();
  if (!extract || extract.toLowerCase().includes("may refer to:")) {
    return null;
  }

  if (isMusicNamedWork(extract)) {
    return null;
  }

  if (!extractContainsQueryTokens(extract, word)) {
    return null;
  }

  return {
    word,
    definitions: [trimWikipediaExtract(extract)],
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
      headers: WIKIPEDIA_HEADERS,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as WikipediaSummary;
  } catch {
    return null;
  }
}

async function searchWikipediaTitles(
  word: string,
  fetchFn: typeof fetch
): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: word,
    format: "json",
    utf8: "1",
    srlimit: "5",
  });

  const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

  try {
    const response = await fetchFn(url, {
      headers: WIKIPEDIA_HEADERS,
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as WikipediaSearchResponse;
    return data.query?.search?.map((item) => item.title) ?? [];
  } catch {
    return [];
  }
}

export async function fetchWikipediaDefinition(
  word: string,
  fetchFn: typeof fetch = fetch
): Promise<WordDefinition | null> {
  const triedTitles = new Set<string>();
  const directTitle = toWikipediaTitle(word);
  const directSummary = await fetchWikipediaSummary(directTitle, fetchFn);

  if (directSummary) {
    triedTitles.add(normalizeWikipediaTitle(directTitle));
    if (directSummary.title) {
      triedTitles.add(normalizeWikipediaTitle(directSummary.title));
    }

    const directResult = parseWikipediaSummary(directSummary, word);
    if (directResult) {
      return directResult;
    }
  }

  const searchTitles = await searchWikipediaTitles(word, fetchFn);

  for (const searchTitle of searchTitles) {
    const normalized = normalizeWikipediaTitle(searchTitle);
    if (triedTitles.has(normalized)) {
      continue;
    }

    triedTitles.add(normalized);
    const searchSummary = await fetchWikipediaSummary(searchTitle, fetchFn);
    const result = searchSummary
      ? parseWikipediaSummary(searchSummary, word)
      : null;

    if (result) {
      return result;
    }
  }

  return null;
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
