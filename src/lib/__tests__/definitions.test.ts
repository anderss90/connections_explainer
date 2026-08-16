import { clearCache } from "../cache";
import { fetchWordDefinitions } from "../definitions";
import { fetchGeminiDefinitions } from "../definitions/gemini";
import {
  fetchDictionaryDefinition,
  fetchDictionaryDefinitions,
} from "../definitions/dictionary";

jest.mock("../definitions/gemini", () => ({
  fetchGeminiDefinitions: jest.fn(),
}));

jest.mock("../definitions/dictionary", () => ({
  fetchDictionaryDefinition: jest.fn(),
  fetchDictionaryDefinitions: jest.fn(),
}));

describe("fetchWordDefinitions", () => {
  beforeEach(() => {
    clearCache();
    jest.clearAllMocks();
  });

  it("uses Gemini definitions and dictionary fallback for missing words", async () => {
    (fetchGeminiDefinitions as jest.Mock).mockResolvedValue([
      {
        word: "CONCERT",
        definition: "A live musical performance.",
        source: "gemini",
      },
    ]);

    (fetchDictionaryDefinitions as jest.Mock).mockResolvedValue([
      {
        word: "GIG",
        definition: "A paid performance by a musician.",
        source: "dictionary",
      },
    ]);

    (fetchDictionaryDefinition as jest.Mock).mockResolvedValue(null);

    const definitions = await fetchWordDefinitions(
      ["CONCERT", "GIG"],
      "2026-08-16"
    );

    expect(definitions).toHaveLength(2);
    expect(definitions[0].source).toBe("gemini");
    expect(definitions[1].source).toBe("dictionary");
  });
});
