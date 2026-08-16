import { clearCache } from "../cache";
import { fetchPuzzle } from "../puzzle";
import { fetchNYTPuzzle } from "../nyt-connections";
import { fetchTomsguidePuzzle } from "../tomsguide-fallback";

jest.mock("../nyt-connections", () => ({
  fetchNYTPuzzle: jest.fn(),
}));

jest.mock("../tomsguide-fallback", () => ({
  fetchTomsguidePuzzle: jest.fn(),
}));

describe("fetchPuzzle", () => {
  beforeEach(() => {
    clearCache();
    jest.clearAllMocks();
  });

  it("returns NYT puzzle when available", async () => {
    (fetchNYTPuzzle as jest.Mock).mockResolvedValue({
      puzzleId: 1247,
      printDate: "2026-08-16",
      editor: "Wyna Liu",
      words: ["ACTOR"],
      source: "nyt",
    });

    const puzzle = await fetchPuzzle("2026-08-16");
    expect(puzzle?.source).toBe("nyt");
    expect(fetchTomsguidePuzzle).not.toHaveBeenCalled();
  });

  it("falls back to Tom's Guide when NYT fails", async () => {
    (fetchNYTPuzzle as jest.Mock).mockResolvedValue(null);
    (fetchTomsguidePuzzle as jest.Mock).mockResolvedValue({
      puzzleId: null,
      printDate: "2026-08-16",
      editor: null,
      words: ["ACTOR"],
      source: "tomsguide",
    });

    const puzzle = await fetchPuzzle("2026-08-16");
    expect(puzzle?.source).toBe("tomsguide");
  });
});
