import { getCached, setCached } from "../cache";
import {
  fetchDictionaryDefinition,
  fetchDictionaryDefinitions,
} from "./dictionary";
import { fetchGeminiDefinitions } from "./gemini";
import type { WordDefinition } from "../types";

export async function fetchWordDefinitions(
  words: string[],
  date: string,
  fetchFn: typeof fetch = fetch
): Promise<WordDefinition[]> {
  const cacheKey = `definitions:${date}:${words.join(",")}`;
  const cached = getCached<WordDefinition[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const geminiDefinitions = await fetchGeminiDefinitions(words, apiKey);

  const definitionsByWord = new Map<string, WordDefinition>();
  for (const definition of geminiDefinitions) {
    definitionsByWord.set(definition.word, definition);
  }

  const missingWords = words.filter((word) => !definitionsByWord.has(word));

  if (missingWords.length > 0) {
    const dictionaryDefinitions = await fetchDictionaryDefinitions(
      missingWords,
      fetchFn
    );

    for (const definition of dictionaryDefinitions) {
      definitionsByWord.set(definition.word, definition);
    }
  }

  const stillMissing = words.filter((word) => !definitionsByWord.has(word));
  for (const word of stillMissing) {
    const fallback = await fetchDictionaryDefinition(word, fetchFn);
    if (fallback) {
      definitionsByWord.set(word, fallback);
    } else {
      definitionsByWord.set(word, {
        word,
        definition: "Definition unavailable.",
        source: "dictionary",
      });
    }
  }

  const ordered = words
    .map((word) => definitionsByWord.get(word))
    .filter((definition): definition is WordDefinition => definition !== undefined);

  setCached(cacheKey, ordered);
  return ordered;
}
