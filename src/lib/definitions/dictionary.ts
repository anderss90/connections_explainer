import type { WordDefinition } from "../types";

interface DictionaryEntry {
  word: string;
  meanings: Array<{
    definitions: Array<{ definition: string }>;
  }>;
}

export function parseDictionaryResponse(
  entries: DictionaryEntry[],
  word: string
): string | null {
  const definition = entries[0]?.meanings?.[0]?.definitions?.[0]?.definition;
  return definition?.trim() ?? null;
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
    const definition = parseDictionaryResponse(entries, word);

    if (!definition) {
      return null;
    }

    return {
      word,
      definition,
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
