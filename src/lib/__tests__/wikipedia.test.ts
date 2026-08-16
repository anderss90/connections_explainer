import {
  fetchWikipediaDefinition,
  parseWikipediaSummary,
  toWikipediaTitle,
  trimWikipediaExtract,
} from "../definitions/wikipedia";

describe("wikipedia definitions", () => {
  it("formats titles for Wikipedia lookup", () => {
    expect(toWikipediaTitle("FROM NEANDER")).toBe("From_Neander");
    expect(toWikipediaTitle("APPLE")).toBe("Apple");
  });

  it("trims long extracts to a readable sentence", () => {
    const extract =
      "Apple Inc. is an American multinational technology company headquartered in Cupertino, California. " +
      "It was founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne as Apple Computer Company. " +
      "The company designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.";

    expect(trimWikipediaExtract(extract)).toBe(
      "Apple Inc. is an American multinational technology company headquartered in Cupertino, California. It was founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne as Apple Computer Company."
    );
  });

  it("parses a valid Wikipedia summary", () => {
    const result = parseWikipediaSummary(
      {
        title: "Apple Inc.",
        extract:
          "Apple Inc. is an American multinational technology company headquartered in Cupertino, California.",
      },
      "APPLE"
    );

    expect(result).toEqual({
      word: "APPLE",
      definitions: [
        "Apple Inc. is an American multinational technology company headquartered in Cupertino, California.",
      ],
      source: "wikipedia",
    });
  });

  it("rejects disambiguation pages", () => {
    const result = parseWikipediaSummary(
      {
        extract: "Apple may refer to: the fruit, the company, and other topics.",
      },
      "APPLE"
    );

    expect(result).toBeNull();
  });

  it("falls back to Wikipedia search when direct title fails", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: { search: [{ title: "Taylor Swift" }] },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          extract:
            "Taylor Swift is an American singer-songwriter who is widely known for her genre-spanning music.",
        }),
      });

    const result = await fetchWikipediaDefinition("TAYLOR SWIFT", mockFetch);

    expect(result).toEqual({
      word: "TAYLOR SWIFT",
      definitions: [
        "Taylor Swift is an American singer-songwriter who is widely known for her genre-spanning music.",
      ],
      source: "wikipedia",
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
