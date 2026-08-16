const ET_TIMEZONE = "America/New_York";

export function getTodayInET(date: Date = new Date()): string {
  return formatDateInET(date);
}

export function formatDateInET(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getMsUntilMidnightET(from: Date = new Date()): number {
  const etParts = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(from);

  const hour = Number(etParts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(etParts.find((p) => p.type === "minute")?.value ?? 0);
  const second = Number(etParts.find((p) => p.type === "second")?.value ?? 0);

  const elapsedMs = (hour * 3600 + minute * 60 + second) * 1000;
  return 24 * 60 * 60 * 1000 - elapsedMs;
}
