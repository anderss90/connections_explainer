import { clearCache } from "../cache";
import { fetchWordDefinitions } from "../definitions";
import { fetchGeminiDefinitions } from "../definitions/gemini";
import {
  fetchDictionaryDefinition,
  fetchDictionaryDefinitions,
} from "../definitions/dictionary";
import { fetchWikipediaDefinitions } from "../definitions/wikipedia";

jest.mock("../definitions/gemini", () => ({
  fetchGeminiDefinitions: jest.fn(),
}));

jest.mock("../definitions/dictionary", () => ({
  fetchDictionaryDefinition: jest.fn(),
  fetchDictionaryDefinitions: jest.fn(),
}));

jest.mock("../definitions/wikipedia", () => ({
  fetchWikipediaDefinitions: jest.fn(),
}));

describe("fetchWordDefinitions", () => {
  beforeEach(() => {
    clearCache();
    jest.clearAllMocks();
    (fetchGeminiDefinitions as jest.Mock).mockResolvedValue([]);
    (fetchDictionaryDefinitions as jest.Mock).mockResolvedValue([]);
    (fetchWikipediaDefinitions as jest.Mock).mockResolvedValue([]);
    (fetchDictionaryDefinition as jest.Mock).mockResolvedValue(null);
  });

  it("uses Gemini definitions and dictionary fallback for missing words", async () => {
    (fetchGeminiDefinitions as jest.Mock).mockResolvedValueOnce([
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

    const definitions = await fetchWordDefinitions(
      ["CONCERT", "GIG"],
      "2026-08-16"
    );

    expect(definitions).toHaveLength(2);
    expect(definitions[0].source).toBe("gemini");
    expect(definitions[1].source).toBe("dictionary");
  });

  it("uses Wikipedia for words missing from dictionary", async () => {
    (fetchDictionaryDefinitions as jest.Mock).mockResolvedValue([]);
    (fetchWikipediaDefinitions as jest.Mock).mockResolvedValue([
      {
        word: "APPLE",
        definition: "Apple Inc. is an American technology company.",
        source: "wikipedia",
      },
    ]);

    const definitions = await fetchWordDefinitions(["APPLE"], "2026-08-16");

    expect(definitions[0]).toEqual({
      word: "APPLE",
      definition: "Apple Inc. is an American technology company.",
      source: "wikipedia",
    });
    expect(fetchWikipediaDefinitions).toHaveBeenCalledWith(["APPLE"], expect.any(Function));
  });

  it("retries Gemini for words still missing after Wikipedia", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    (fetchGeminiDefinitions as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          word: "FROM NEANDER",
          definition:
            "Refers to Neanderthals, an extinct human species that lived in Europe and western Asia.",
          source: "gemini",
        },
      ]);

    (fetchDictionaryDefinitions as jest.Mock).mockResolvedValue([]);
    (fetchWikipediaDefinitions as jest.Mock).mockResolvedValue([]);

    const definitions = await fetchWordDefinitions(
      ["FROM NEANDER"],
      "2026-08-16"
    );

    expect(fetchGeminiDefinitions).toHaveBeenCalledTimes(2);
    expect(definitions[0].source).toBe("gemini");

    delete process.env.GEMINI_API_KEY;
  });
});
