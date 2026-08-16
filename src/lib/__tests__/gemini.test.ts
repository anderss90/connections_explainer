import {
  buildGeminiPrompt,
  fetchGeminiDefinitions,
  parseGeminiResponse,
} from "../definitions/gemini";

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              { word: "CONCERT", definition: "A live musical performance." },
              { word: "GIG", definition: "A paid performance by a musician." },
            ]),
        },
      }),
    }),
  })),
}));

describe("gemini definitions", () => {
  it("builds a batch prompt for all words", () => {
    const prompt = buildGeminiPrompt(["CONCERT", "GIG"]);

    expect(prompt).toContain("CONCERT, GIG");
    expect(prompt).toContain("JSON");
  });

  it("parses Gemini JSON response", () => {
    const parsed = parseGeminiResponse(
      'Here are definitions:\n[{"word":"CONCERT","definition":"A live musical performance."}]',
      ["CONCERT", "GIG"]
    );

    expect(parsed).toEqual([
      { word: "CONCERT", definition: "A live musical performance." },
    ]);
  });

  it("fetches Gemini definitions when API key is present", async () => {
    const definitions = await fetchGeminiDefinitions(
      ["CONCERT", "GIG"],
      "test-key"
    );

    expect(definitions).toHaveLength(2);
    expect(definitions[0].source).toBe("gemini");
  });

  it("returns empty array without API key", async () => {
    const definitions = await fetchGeminiDefinitions(["CONCERT"]);
    expect(definitions).toEqual([]);
  });
});
