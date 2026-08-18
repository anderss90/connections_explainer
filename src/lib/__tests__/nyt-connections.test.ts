import nytFixture from "../__fixtures__/nyt-response.json";
import {
  flattenWords,
  parseNYTResponse,
  fetchNYTPuzzle,
} from "../nyt-connections";
import type { NYTRawResponse } from "../types";

describe("nyt-connections", () => {
  it("flattens and sorts words without duplicates", () => {
    const words = flattenWords(nytFixture.categories);

    expect(words).toHaveLength(16);
    expect(words[0]).toBe("ACTOR");
    expect(words).toContain("FROM NEANDER");
    expect(words).toContain("CONCERT");
  });

  it("parses a valid NYT response without categories", () => {
    const puzzle = parseNYTResponse(nytFixture as NYTRawResponse, "2026-08-16");

    expect(puzzle).not.toBeNull();
    expect(puzzle?.source).toBe("nyt");
    expect(puzzle?.puzzleId).toBe(1247);
    expect(puzzle?.editor).toBe("Wyna Liu");
    expect(puzzle?.words).toHaveLength(16);
    expect(puzzle).not.toHaveProperty("categories");
  });

  it("returns null for invalid NYT responses", () => {
    expect(parseNYTResponse({ status: "ERROR" }, "2026-08-16")).toBeNull();
  });

  it("fetches puzzle data from NYT endpoint", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => nytFixture,
    });

    const puzzle = await fetchNYTPuzzle("2026-08-16", mockFetch);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.nytimes.com/svc/connections/v2/2026-08-16.json",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          "User-Agent": expect.stringContaining("ConnectionsWordsSite/1.0"),
        }),
      })
    );
    expect(puzzle?.words).toHaveLength(16);
  });
});
