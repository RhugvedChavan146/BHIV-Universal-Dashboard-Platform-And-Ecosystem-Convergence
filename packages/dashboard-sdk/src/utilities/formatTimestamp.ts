/**
 * Formats an ISO timestamp as a localized `HH:MM:SS` (24h) time string.
 * Returns the raw input unchanged if it isn't a parseable date, and an
 * empty string if no value is given.
 */
export function formatTimestamp(iso?: string, locale: string = "en-IN"): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}
