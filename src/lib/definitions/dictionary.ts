import type { WordDefinition } from "../types";
import { limitDefinitions, normalizeDefinitions } from "./utils";

interface DictionaryEntry {
  word: string;
  meanings: Array<{
    definitions: Array<{ definition: string }>;
  }>;
}

export function parseDictionaryResponse(
  entries: DictionaryEntry[],
  word: string
): string[] {
  const definitions: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    for (const meaning of entry.meanings ?? []) {
      for (const item of meaning.definitions ?? []) {
        const text = item.definition?.trim();
        const key = text?.toLowerCase();

        if (text && key && !seen.has(key)) {
          seen.add(key);
          definitions.push(text);
        }
      }
    }
  }

  return limitDefinitions(definitions);
}

export async function fetchDictionaryDefinition(
  word: string,
  fetchFn: typeof fetch = fetch
): Promise<WordDefinition | null> {
  const encodedWord = encodeURIComponent(word.toLowerCase());
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodedWord}`;

  try {
    const response = await fetchFn(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const entries = (await response.json()) as DictionaryEntry[];
    const definitions = parseDictionaryResponse(entries, word);

    if (definitions.length === 0) {
      return null;
    }

    return {
      word,
      definitions,
      source: "dictionary",
    };
  } catch {
    return null;
  }
}

export async function fetchDictionaryDefinitions(
  words: string[],
  fetchFn: typeof fetch = fetch
): Promise<WordDefinition[]> {
  const results = await Promise.all(
    words.map((word) => fetchDictionaryDefinition(word, fetchFn))
  );

  return results.filter((result): result is WordDefinition => result !== null);
}
