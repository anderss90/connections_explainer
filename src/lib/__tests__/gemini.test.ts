import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildGeminiPrompt,
  fetchGeminiDefinitions,
  GEMINI_MODEL,
  parseGeminiResponse,
} from "../definitions/gemini";

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                word: "SET",
                definitions: [
                  "A sequence of songs performed live by a DJ or band.",
                  "To put something in a specified place or position.",
                ],
              },
              {
                word: "GIG",
                definitions: ["A paid performance by a musician."],
              },
            ]),
        },
      }),
    }),
  })),
}));

describe("gemini definitions", () => {
  it("builds a batch prompt for all words", () => {
    const prompt = buildGeminiPrompt(["SET", "GIG"]);

    expect(prompt).toContain("SET, GIG");
    expect(prompt).toContain("definitions");
    expect(prompt).toContain("company, brand");
    expect(prompt).toContain("multiple common meanings");
  });

  it("parses Gemini JSON response with multiple definitions", () => {
    const parsed = parseGeminiResponse(
      'Here are definitions:\n[{"word":"SET","definitions":["A DJ set.","To place something."]}]',
      ["SET", "GIG"]
    );

    expect(parsed).toEqual([
      {
        word: "SET",
        definitions: ["A DJ set.", "To place something."],
      },
    ]);
  });

  it("supports legacy single-definition Gemini responses", () => {
    const parsed = parseGeminiResponse(
      '[{"word":"CONCERT","definition":"A live musical performance."}]',
      ["CONCERT"]
    );

    expect(parsed).toEqual([
      {
        word: "CONCERT",
        definitions: ["A live musical performance."],
      },
    ]);
  });

  it("fetches Gemini definitions when API key is present", async () => {
    const definitions = await fetchGeminiDefinitions(["SET", "GIG"], "test-key");

    expect(definitions).toHaveLength(2);
    expect(definitions[0].definitions).toHaveLength(2);
    expect(definitions[0].source).toBe("gemini");

    const client = (GoogleGenerativeAI as unknown as jest.Mock).mock.results.at(-1)
      ?.value;
    expect(client.getGenerativeModel).toHaveBeenCalledWith({ model: GEMINI_MODEL });
  });

  it("returns empty array without API key", async () => {
    const definitions = await fetchGeminiDefinitions(["CONCERT"]);
    expect(definitions).toEqual([]);
  });
});
