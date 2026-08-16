import { WordList } from "@/components/WordList";
import { formatDisplayDate, getTodayInET } from "@/lib/date";
import { fetchWordDefinitions } from "@/lib/definitions";
import { fetchPuzzle } from "@/lib/puzzle";

export default async function HomePage() {
  const date = getTodayInET();
  const puzzle = await fetchPuzzle(date);

  if (!puzzle) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold">Connections Daily Words</h1>
        <p className="mt-4 text-red-700" role="alert">
          Unable to load today&apos;s puzzle. Please try again later.
        </p>
      </main>
    );
  }

  const definitions = await fetchWordDefinitions(puzzle.words, date);
  const displayDate = formatDisplayDate(puzzle.printDate);
  const puzzleLabel = puzzle.puzzleId ? `#${puzzle.puzzleId}` : "Today";

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10 text-center">
        <p className="text-sm uppercase tracking-widest text-stone-500">
          NYT Connections
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Connections {puzzleLabel} — {displayDate}
        </h1>
        <p className="mt-3 text-stone-600">
          {puzzle.editor ? `Edited by ${puzzle.editor}. ` : ""}
          Words sourced from{" "}
          <span className="rounded bg-stone-200 px-2 py-0.5 text-xs uppercase tracking-wide text-stone-700">
            {puzzle.source}
          </span>
        </p>
        <p className="mt-2 text-sm text-stone-500">
          {puzzle.words.length} words — definitions only, no category spoilers.
        </p>
      </header>

      <WordList definitions={definitions} />
    </main>
  );
}
