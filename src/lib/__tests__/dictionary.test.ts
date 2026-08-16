import {
  fetchDictionaryDefinition,
  parseDictionaryResponse,
} from "../definitions/dictionary";

describe("dictionary definitions", () => {
  it("parses dictionary API response", () => {
    const definition = parseDictionaryResponse(
      [
        {
          word: "concert",
          meanings: [
            {
              definitions: [{ definition: "A live musical performance." }],
            },
          ],
        },
      ],
      "CONCERT"
    );

    expect(definition).toBe("A live musical performance.");
  });

  it("fetches a dictionary definition", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          word: "concert",
          meanings: [
            {
              definitions: [{ definition: "A live musical performance." }],
            },
          ],
        },
      ],
    });

    const result = await fetchDictionaryDefinition("CONCERT", mockFetch);

    expect(result).toEqual({
      word: "CONCERT",
      definition: "A live musical performance.",
      source: "dictionary",
    });
  });
});
