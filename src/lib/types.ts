export type PuzzleSource = "nyt" | "tomsguide";

export interface PuzzleData {
  puzzleId: number | null;
  printDate: string;
  editor: string | null;
  words: string[];
  source: PuzzleSource;
}

export type DefinitionSource = "gemini" | "dictionary" | "wikipedia";

export interface WordDefinition {
  word: string;
  definition: string;
  source: DefinitionSource;
}

export interface NYTRawResponse {
  status: string;
  id?: number;
  print_date?: string;
  editor?: string;
  categories?: Array<{
    title: string;
    cards: Array<{ content: string; position: number }>;
  }>;
  errors?: string[];
}
