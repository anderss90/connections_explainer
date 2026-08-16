import { readFileSync } from "fs";
import { join } from "path";
import {
  fetchTomsguidePuzzle,
  parseTomsguideWords,
} from "../tomsguide-fallback";

const fixtureHtml = readFileSync(
  join(__dirname, "../__fixtures__/tomsguide-snippet.html"),
  "utf-8"
);

describe("tomsguide-fallback", () => {
  it("extracts 16 words from HTML snippet", () => {
    const words = parseTomsguideWords(fixtureHtml);

    expect(words).toHaveLength(16);
    expect(words).toContain("FROM NEANDER");
    expect(words).toContain("PARTY");
    expect(words[0]).toBe("ACTOR");
  });

  it("returns empty array when section marker is missing", () => {
    expect(parseTomsguideWords("<html></html>")).toEqual([]);
  });

  it("fetches puzzle data from Tom's Guide", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => fixtureHtml,
    });

    const puzzle = await fetchTomsguidePuzzle("2026-08-16", mockFetch);

    expect(puzzle?.source).toBe("tomsguide");
    expect(puzzle?.words).toHaveLength(16);
  });
});
