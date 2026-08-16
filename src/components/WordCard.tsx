import type { DefinitionSource } from "@/lib/types";

interface WordCardProps {
  word: string;
  definitions: string[];
  source: DefinitionSource;
}

export function WordCard({ word, definitions, source }: WordCardProps) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold tracking-wide text-stone-900">
        {word}
      </h2>
      {definitions.length === 1 ? (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-700">
          {definitions[0]}
        </p>
      ) : (
        <ol className="mt-2 flex-1 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-stone-700">
          {definitions.map((definition, index) => (
            <li key={`${word}-${index}`}>{definition}</li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs uppercase tracking-wider text-stone-400">
        via {source}
      </p>
    </article>
  );
}
