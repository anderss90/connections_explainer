import { render, screen } from "@testing-library/react";
import { WordCard } from "../WordCard";

describe("WordCard", () => {
  it("renders a single definition as text", () => {
    render(
      <WordCard
        word="CONCERT"
        definitions={["A live musical performance."]}
        source="gemini"
      />
    );

    expect(screen.getByRole("heading", { name: "CONCERT" })).toBeInTheDocument();
    expect(screen.getByText("A live musical performance.")).toBeInTheDocument();
    expect(screen.getByText("via gemini")).toBeInTheDocument();
  });

  it("renders multiple definitions as a numbered list", () => {
    render(
      <WordCard
        word="SET"
        definitions={[
          "A sequence of songs performed live by a DJ or band.",
          "To put something in a specified place or position.",
        ]}
        source="dictionary"
      />
    );

    expect(screen.getByText("A sequence of songs performed live by a DJ or band.")).toBeInTheDocument();
    expect(screen.getByText("To put something in a specified place or position.")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
