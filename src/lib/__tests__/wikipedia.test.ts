import { USER_AGENT } from "../http";
import {
  extractContainsQueryTokens,
  fetchWikipediaDefinition,
  fetchWikipediaDefinitions,
  getSignificantQueryTokens,
  isMusicNamedWork,
  pageMetadataMatchesQuery,
  parseWikipediaSummary,
  toWikipediaTitle,
  trimWikipediaExtract,
} from "../definitions/wikipedia";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe("wikipedia definitions", () => {
  it("formats titles for Wikipedia lookup", () => {
    expect(toWikipediaTitle("FROM NEANDER")).toBe("From_Neander");
    expect(toWikipediaTitle("APPLE")).toBe("Apple");
  });

  it("keeps significant query tokens and drops stopwords", () => {
    expect(getSignificantQueryTokens("FLYERS MASCOT")).toEqual([
      "FLYERS",
      "MASCOT",
    ]);
    expect(getSignificantQueryTokens("THE RED CARPET")).toEqual([
      "RED",
      "CARPET",
    ]);
  });

  it("requires every significant token in the extract", () => {
    expect(
      extractContainsQueryTokens(
        "Gritty is the official mascot for the Philadelphia Flyers.",
        "FLYERS MASCOT"
      )
    ).toBe(true);
    expect(
      extractContainsQueryTokens(
        "Coffee preparation is the process of making liquid coffee.",
        "COWBOY COFFEE"
      )
    ).toBe(false);
    expect(extractContainsQueryTokens("A hundred pieces of fabric.", "RED CARPET")).toBe(
      false
    );
  });

  it("detects album and tour descriptions as named works", () => {
    expect(isMusicNamedWork("1997 studio album by Janet Jackson")).toBe(true);
    expect(isMusicNamedWork("concert tour by American singer Janet Jackson")).toBe(
      true
    );
    expect(isMusicNamedWork("1993 film by John Singleton")).toBe(false);
  });

  it("matches Gritty via description when the title is a different name", () => {
    expect(
      pageMetadataMatchesQuery(
        {
          title: "Gritty",
          description: "Mascot for the Philadelphia Flyers",
        },
        "FLYERS MASCOT"
      )
    ).toBe(true);
  });

  it("rejects biographies that only mention a phrase in the extract", () => {
    expect(
      pageMetadataMatchesQuery(
        {
          title: "Janet Jackson",
          extract:
            "Janet Jackson is an American singer who recorded The Velvet Rope.",
        },
        "VELVET ROPE"
      )
    ).toBe(false);
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

  it("rejects Wikipedia summaries with a disambiguation type", () => {
    const result = parseWikipediaSummary(
      {
        type: "disambiguation",
        extract: "Foo is a page about several topics.",
      },
      "FOO"
    );

    expect(result).toBeNull();
  });

  it("rejects coffee-preparation extracts that lack cowboy", () => {
    const result = parseWikipediaSummary(
      {
        title: "Coffee preparation",
        extract:
          "Coffee preparation is the process of making liquid coffee using coffee beans.",
      },
      "COWBOY COFFEE"
    );

    expect(result).toBeNull();
  });

  it("skips studio album summaries", () => {
    const result = parseWikipediaSummary(
      {
        title: "The Velvet Rope",
        description: "1997 studio album by Janet Jackson",
        extract:
          "The Velvet Rope is the sixth studio album by American singer Janet Jackson.",
      },
      "VELVET ROPE"
    );

    expect(result).toBeNull();
  });

  it("keeps film summaries for phrases like poetic justice", () => {
    const result = parseWikipediaSummary(
      {
        title: "Poetic Justice (film)",
        description: "1993 film by John Singleton",
        extract:
          "Poetic Justice is a 1993 American romantic crime drama film written and directed by John Singleton.",
      },
      "POETIC JUSTICE"
    );

    expect(result?.source).toBe("wikipedia");
    expect(result?.definitions[0]).toContain("Poetic Justice");
  });

  it("sends an identifying User-Agent on Wikipedia requests", async () => {
    const mockFetch = jest.fn().mockResolvedValue(
      jsonResponse({
        extract: "Apple is the fruit of the apple tree.",
      })
    );

    await fetchWikipediaDefinition("APPLE", mockFetch);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("en.wikipedia.org"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": USER_AGENT,
          "Api-User-Agent": USER_AGENT,
        }),
      })
    );
  });

  it("falls back to Wikipedia search when direct title fails", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false))
      .mockResolvedValueOnce(
        jsonResponse({
          query: { search: [{ title: "Taylor Swift" }] },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          extract:
            "Taylor Swift is an American singer-songwriter who is widely known for her genre-spanning music.",
        })
      );

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

  it("accepts Flyers mascot search results that mention Flyers and mascot", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false))
      .mockResolvedValueOnce(
        jsonResponse({
          query: { search: [{ title: "Gritty" }] },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          title: "Gritty",
          description: "Mascot for the Philadelphia Flyers",
          extract:
            "Gritty is the official mascot for the Philadelphia Flyers of the National Hockey League (NHL).",
        })
      );

    const result = await fetchWikipediaDefinition("FLYERS MASCOT", mockFetch);

    expect(result).toEqual({
      word: "FLYERS MASCOT",
      definitions: [
        "Gritty is the official mascot for the Philadelphia Flyers of the National Hockey League (NHL).",
      ],
      source: "wikipedia",
    });
  });

  it("skips album and tour hits for velvet rope when nothing else qualifies", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false))
      .mockResolvedValueOnce(
        jsonResponse({
          query: {
            search: [
              { title: "The Velvet Rope" },
              { title: "The Velvet Rope Tour" },
              { title: "Janet Jackson" },
              { title: "The Velvet Rope Tour: Live in Concert" },
              { title: "Janet Jackson as a gay icon" },
            ],
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          title: "The Velvet Rope",
          description: "1997 studio album by Janet Jackson",
          extract:
            "The Velvet Rope is the sixth studio album by American singer Janet Jackson.",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          title: "The Velvet Rope Tour",
          description: "concert tour by American singer Janet Jackson",
          extract:
            "The Velvet Rope Tour was the third concert tour by American recording artist Janet Jackson.",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          title: "Janet Jackson",
          extract:
            "Janet Jackson is an American singer who recorded The Velvet Rope.",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          title: "The Velvet Rope Tour: Live in Concert",
          description: "live album by Janet Jackson",
          extract:
            "The Velvet Rope: Live in Concert is a live album by American singer Janet Jackson.",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          title: "Janet Jackson as a gay icon",
          extract:
            "Janet Jackson is regarded as a gay icon, especially after The Velvet Rope.",
        })
      );

    const result = await fetchWikipediaDefinition("VELVET ROPE", mockFetch);

    expect(result).toBeNull();
  });

  it("rejects cowboy coffee redirects that never mention cowboy", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          title: "Coffee preparation",
          extract:
            "Coffee preparation is the process of making liquid coffee using coffee beans.",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          query: { search: [{ title: "Coffee preparation" }] },
        })
      );

    const result = await fetchWikipediaDefinition("COWBOY COFFEE", mockFetch);

    expect(result).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("fetches definitions for multiple words and drops misses", async () => {
    const mockFetch = jest.fn().mockImplementation(async (url: string) => {
      if (String(url).includes("Apple")) {
        return jsonResponse({
          extract: "Apple is the fruit of the apple tree.",
        });
      }

      return jsonResponse({}, false);
    });

    const results = await fetchWikipediaDefinitions(
      ["APPLE", "VELVET ROPE"],
      mockFetch
    );

    expect(results).toHaveLength(1);
    expect(results[0].word).toBe("APPLE");
  });
});
