import type { WordDefinition } from "@/lib/types";
import { WordCard } from "./WordCard";

interface WordListProps {
  definitions: WordDefinition[];
}

export function WordList({ definitions }: WordListProps) {
  if (definitions.length === 0) {
    return (
      <p className="text-center text-stone-600" role="status">
        No words available.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {definitions.map((item) => (
        <li key={item.word}>
          <WordCard word={item.word} definition={item.definition} source={item.source} />
        </li>
      ))}
    </ul>
  );
}
