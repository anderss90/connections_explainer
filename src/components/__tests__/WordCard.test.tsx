import { render, screen } from "@testing-library/react";
import { WordCard } from "../WordCard";

describe("WordCard", () => {
  it("renders word and definition", () => {
    render(
      <WordCard
        word="CONCERT"
        definition="A live musical performance."
        source="gemini"
      />
    );

    expect(screen.getByRole("heading", { name: "CONCERT" })).toBeInTheDocument();
    expect(screen.getByText("A live musical performance.")).toBeInTheDocument();
    expect(screen.getByText("via gemini")).toBeInTheDocument();
  });
});
