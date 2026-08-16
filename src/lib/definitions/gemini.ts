import { GoogleGenerativeAI } from "@google/generative-ai";
import type { WordDefinition } from "../types";
import { MAX_DEFINITIONS, normalizeDefinitions } from "./utils";

export interface GeminiDefinitionResult {
  word: string;
  definitions: string[];
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
      definitions?: string[];
    }>;

    return parsed
      .map((item) => {
        const word = item.word?.trim().toUpperCase();
        if (!word) {
          return null;
        }

        const definitions = normalizeDefinitions(item.definitions, item.definition);
        if (definitions.length === 0) {
          return null;
        }

        return { word, definitions };
      })
      .filter((item): item is GeminiDefinitionResult => item !== null)
      .filter((item) => words.includes(item.word));
  } catch {
    return [];
  }
}

export function buildGeminiPrompt(words: string[]): string {
  return `For each word or phrase in this list, provide up to ${MAX_DEFINITIONS} distinct meanings in plain language (one short sentence each).

Guidelines:
- If a word has multiple common meanings (noun, verb, slang, etc.), list each separately.
- If it is a company, brand, or product name, explain what that company or brand is known for.
- If it is a famous person, say who they are and why they are known.
- If it is a place, landmark, or organization, describe it briefly.
- If it is slang, jargon, or part of a longer phrase, explain the common meaning.
- If it is an ordinary English word, give clear dictionary-style definitions for different senses.
- Do NOT mention Connections, puzzle categories, or word groupings.

Return ONLY valid JSON as an array of objects with "word" and "definitions" keys (definitions is a string array). Use the exact word spelling from the list.

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
      definitions: item.definitions,
      source: "gemini" as const,
    }));
  } catch {
    return [];
  }
}
