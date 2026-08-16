import {
  fetchDictionaryDefinition,
  parseDictionaryResponse,
} from "../definitions/dictionary";

describe("dictionary definitions", () => {
  it("parses multiple dictionary meanings up to five", () => {
    const definitions = parseDictionaryResponse(
      [
        {
          word: "set",
          meanings: [
            {
              definitions: [
                { definition: "To put something in a specified place or position." },
                { definition: "To prepare or arrange something." },
              ],
            },
            {
              definitions: [
                { definition: "A group of things that belong together." },
                { definition: "A sequence of songs performed by a DJ or band." },
              ],
            },
          ],
        },
      ],
      "SET"
    );

    expect(definitions).toHaveLength(4);
    expect(definitions[3]).toBe(
      "A sequence of songs performed by a DJ or band."
    );
  });

  it("limits dictionary meanings to five", () => {
    const definitions = parseDictionaryResponse(
      [
        {
          word: "set",
          meanings: [
            {
              definitions: [
                { definition: "Meaning 1." },
                { definition: "Meaning 2." },
                { definition: "Meaning 3." },
                { definition: "Meaning 4." },
                { definition: "Meaning 5." },
                { definition: "Meaning 6." },
              ],
            },
          ],
        },
      ],
      "SET"
    );

    expect(definitions).toHaveLength(5);
  });

  it("fetches dictionary definitions", async () => {
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
      definitions: ["A live musical performance."],
      source: "dictionary",
    });
  });
});
