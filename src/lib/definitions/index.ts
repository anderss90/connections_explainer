import { getCached, setCached } from "../cache";
import {
  fetchDictionaryDefinition,
  fetchDictionaryDefinitions,
} from "./dictionary";
import { fetchGeminiDefinitions } from "./gemini";
import { fetchWikipediaDefinitions, fetchWikipediaDefinition } from "./wikipedia";
import type { WordDefinition } from "../types";

export const UNAVAILABLE_DEFINITION = "Definition unavailable.";

function hasUnavailableDefinition(definitions: WordDefinition[]): boolean {
  return definitions.some((item) =>
    item.definitions.includes(UNAVAILABLE_DEFINITION)
  );
}

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
  if (cached && !hasUnavailableDefinition(cached)) {
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
    const dictionary = await fetchDictionaryDefinition(word, fetchFn);
    if (dictionary) {
      definitionsByWord.set(word, dictionary);
      continue;
    }

    const wikipedia = await fetchWikipediaDefinition(word, fetchFn);
    if (wikipedia) {
      definitionsByWord.set(word, wikipedia);
      continue;
    }

    if (apiKey) {
      const gemini = await fetchGeminiDefinitions([word], apiKey);
      if (gemini[0]) {
        definitionsByWord.set(word, gemini[0]);
        continue;
      }
    }

    definitionsByWord.set(word, {
      word,
      definitions: [UNAVAILABLE_DEFINITION],
      source: "dictionary",
    });
  }

  const ordered = words
    .map((word) => definitionsByWord.get(word))
    .filter((definition): definition is WordDefinition => definition !== undefined);

  if (!hasUnavailableDefinition(ordered)) {
    setCached(cacheKey, ordered);
  }

  return ordered;
}
