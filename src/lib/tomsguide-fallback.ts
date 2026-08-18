import { clientHeaders } from "./http";
import type { PuzzleData } from "./types";

const TOMSGUIDE_URL =
  "https://www.tomsguide.com/news/todays-connections-answer";

const SECTION_MARKER = "Today's Connection Grid and Words";

export function parseTomsguideWords(html: string): string[] {
  const sectionIndex = html.indexOf(SECTION_MARKER);
  if (sectionIndex === -1) {
    return [];
  }

  const afterSection = html.slice(sectionIndex);
  const nextHeadingIndex = afterSection.indexOf("## Today's Connections Group Hints");
  const sectionContent =
    nextHeadingIndex === -1
      ? afterSection
      : afterSection.slice(0, nextHeadingIndex);

  const bulletMatches = sectionContent.matchAll(/^\* ([A-Za-z][A-Za-z\s'-]+)$/gm);
  const words: string[] = [];

  for (const match of bulletMatches) {
    const word = match[1].trim().toUpperCase();
    if (word && !words.includes(word)) {
      words.push(word);
    }
  }

  return words.sort((a, b) => a.localeCompare(b));
}

export async function fetchTomsguidePuzzle(
  date: string,
  fetchFn: typeof fetch = fetch
): Promise<PuzzleData | null> {
  try {
    const response = await fetchFn(TOMSGUIDE_URL, {
      headers: clientHeaders("text/html"),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const words = parseTomsguideWords(html);

    if (words.length === 0) {
      return null;
    }

    return {
      puzzleId: null,
      printDate: date,
      editor: null,
      words,
      source: "tomsguide",
    };
  } catch {
    return null;
  }
}
