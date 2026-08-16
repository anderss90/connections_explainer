import { getCached, setCached } from "../cache";
import {
  fetchDictionaryDefinition,
  fetchDictionaryDefinitions,
} from "./dictionary";
import { fetchGeminiDefinitions } from "./gemini";
import { fetchWikipediaDefinitions } from "./wikipedia";
import type { WordDefinition } from "../types";

function getMissingWords(
  words: string[],
  definitionsByWord: Map<string, WordDefinition>
): string[] {
  return words.filter((word) => !definitionsByWord.has(word));
}

function mergeDefinitions(
  definitionsByWord: Map<string, WordDefinition>,
  definitions: WordDefinition[]
): void {
  for (const definition of definitions) {
    definitionsByWord.set(definition.word, definition);
  }
}

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
  const definitionsByWord = new Map<string, WordDefinition>();

  mergeDefinitions(
    definitionsByWord,
    await fetchGeminiDefinitions(words, apiKey)
  );

  let missingWords = getMissingWords(words, definitionsByWord);
  if (missingWords.length > 0) {
    mergeDefinitions(
      definitionsByWord,
      await fetchDictionaryDefinitions(missingWords, fetchFn)
    );
  }

  missingWords = getMissingWords(words, definitionsByWord);
  if (missingWords.length > 0) {
    mergeDefinitions(
      definitionsByWord,
      await fetchWikipediaDefinitions(missingWords, fetchFn)
    );
  }

  missingWords = getMissingWords(words, definitionsByWord);
  if (missingWords.length > 0 && apiKey) {
    mergeDefinitions(
      definitionsByWord,
      await fetchGeminiDefinitions(missingWords, apiKey)
    );
  }

  missingWords = getMissingWords(words, definitionsByWord);
  for (const word of missingWords) {
    const fallback = await fetchDictionaryDefinition(word, fetchFn);
    if (fallback) {
      definitionsByWord.set(word, fallback);
      continue;
    }

    definitionsByWord.set(word, {
      word,
      definition: "Definition unavailable.",
      source: "dictionary",
    });
  }

  const ordered = words
    .map((word) => definitionsByWord.get(word))
    .filter((definition): definition is WordDefinition => definition !== undefined);

  setCached(cacheKey, ordered);
  return ordered;
}
