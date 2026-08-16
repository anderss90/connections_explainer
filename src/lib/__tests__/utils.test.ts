import { limitDefinitions, normalizeDefinitions } from "../definitions/utils";

describe("definition utils", () => {
  it("limits definitions to five", () => {
    expect(
      limitDefinitions([
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
      ])
    ).toEqual(["One", "Two", "Three", "Four", "Five"]);
  });

  it("normalizes legacy single-definition responses", () => {
    expect(normalizeDefinitions(undefined, "A live musical performance.")).toEqual([
      "A live musical performance.",
    ]);
  });
});
