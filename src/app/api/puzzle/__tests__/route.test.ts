/**
 * @jest-environment node
 */
import { GET } from "../route";
import * as puzzle from "@/lib/puzzle";

jest.mock("@/lib/puzzle", () => ({
  fetchPuzzle: jest.fn(),
}));

describe("GET /api/puzzle", () => {
  it("returns puzzle data", async () => {
    (puzzle.fetchPuzzle as jest.Mock).mockResolvedValue({
      puzzleId: 1247,
      printDate: "2026-08-16",
      editor: "Wyna Liu",
      words: ["ACTOR", "CONCERT"],
      source: "nyt",
    });

    const response = await GET(
      new Request("http://localhost/api/puzzle?date=2026-08-16")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.words).toEqual(["ACTOR", "CONCERT"]);
    expect(body).not.toHaveProperty("categories");
  });

  it("returns 503 when puzzle is unavailable", async () => {
    (puzzle.fetchPuzzle as jest.Mock).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/puzzle"));
    expect(response.status).toBe(503);
  });
});
