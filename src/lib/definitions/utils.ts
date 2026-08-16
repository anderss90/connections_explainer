export const MAX_DEFINITIONS = 5;

export function limitDefinitions(definitions: string[]): string[] {
  return definitions
    .map((definition) => definition.trim())
    .filter(Boolean)
    .slice(0, MAX_DEFINITIONS);
}

export function normalizeDefinitions(
  definitions: string[] | undefined,
  fallback?: string
): string[] {
  if (definitions?.length) {
    return limitDefinitions(definitions);
  }

  if (fallback?.trim()) {
    return [fallback.trim()];
  }

  return [];
}
