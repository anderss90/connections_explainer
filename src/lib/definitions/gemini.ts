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
  return `For each word or phrase in this list, explain what it means in plain language (1-2 sentences).

Guidelines:
- If it is a company, brand, or product name, explain what that company or brand is known for.
- If it is a famous person, say who they are and why they are known.
- If it is a place, landmark, or organization, describe it briefly.
- If it is slang, jargon, or part of a longer phrase, explain the common meaning.
- If it is an ordinary English word, give a clear dictionary-style definition.
- Do NOT mention Connections, puzzle categories, or word groupings.

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
