import { render, screen } from "@testing-library/react";
import { WordList } from "../WordList";

describe("WordList", () => {
  it("renders all word cards", () => {
    render(
      <WordList
        definitions={[
          {
            word: "CONCERT",
            definitions: ["A live musical performance."],
            source: "gemini",
          },
          {
            word: "GIG",
            definitions: ["A paid performance by a musician."],
            source: "dictionary",
          },
        ]}
      />
    );

    expect(screen.getByText("CONCERT")).toBeInTheDocument();
    expect(screen.getByText("GIG")).toBeInTheDocument();
  });

  it("shows empty state when no definitions", () => {
    render(<WordList definitions={[]} />);
    expect(screen.getByText("No words available.")).toBeInTheDocument();
  });
});
