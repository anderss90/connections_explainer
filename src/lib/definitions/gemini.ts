import { GoogleGenerativeAI } from "@google/generative-ai";
import type { WordDefinition } from "../types";

export interface GeminiDefinitionResult {
  word: string;
  definition: string;
}

export function parseGeminiResponse(
  text: string,
  words: string[]
): GeminiDefinitionResult[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      word?: string;
      definition?: string;
    }>;

    return parsed
      .filter((item) => item.word && item.definition)
      .map((item) => ({
        word: item.word!.trim().toUpperCase(),
        definition: item.definition!.trim(),
      }))
      .filter((item) => words.includes(item.word));
  } catch {
    return [];
  }
}

export function buildGeminiPrompt(words: string[]): string {
  return `For each word in this list, provide a concise 1-2 sentence definition that a general reader would understand. Do not mention Connections, categories, or puzzle groupings.

Return ONLY valid JSON as an array of objects with "word" and "definition" keys. Use the exact word spelling from the list.

Words: ${words.join(", ")}`;
}

export async function fetchGeminiDefinitions(
  words: string[],
  apiKey?: string
): Promise<WordDefinition[]> {
  if (!apiKey) {
    return [];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent(buildGeminiPrompt(words));
    const text = result.response.text();
    const parsed = parseGeminiResponse(text, words);

    return parsed.map((item) => ({
      word: item.word,
      definition: item.definition,
      source: "gemini" as const,
    }));
  } catch {
    return [];
  }
}
