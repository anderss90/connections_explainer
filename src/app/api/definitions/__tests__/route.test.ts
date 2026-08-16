/**
 * @jest-environment node
 */
import { GET } from "../route";
import * as puzzle from "@/lib/puzzle";
import * as definitions from "@/lib/definitions";

jest.mock("@/lib/puzzle", () => ({
  fetchPuzzle: jest.fn(),
}));

jest.mock("@/lib/definitions", () => ({
  fetchWordDefinitions: jest.fn(),
}));

describe("GET /api/definitions", () => {
  it("returns definitions for puzzle words", async () => {
    (puzzle.fetchPuzzle as jest.Mock).mockResolvedValue({
      puzzleId: 1247,
      printDate: "2026-08-16",
      editor: "Wyna Liu",
      words: ["CONCERT", "GIG"],
      source: "nyt",
    });

    (definitions.fetchWordDefinitions as jest.Mock).mockResolvedValue([
      {
        word: "CONCERT",
        definition: "A live musical performance.",
        source: "gemini",
      },
      {
        word: "GIG",
        definition: "A paid performance by a musician.",
        source: "dictionary",
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/definitions?date=2026-08-16")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.definitions).toHaveLength(2);
    expect(definitions.fetchWordDefinitions).toHaveBeenCalledWith(
      ["CONCERT", "GIG"],
      "2026-08-16"
    );
  });

  it("returns 503 when puzzle is unavailable", async () => {
    (puzzle.fetchPuzzle as jest.Mock).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/definitions"));
    expect(response.status).toBe(503);
  });
});
