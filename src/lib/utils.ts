/**
 * Helper utilities for Team Availability & Schedule Matrix
 */

/**
 * Strips all emoji characters, dingbats, and pictorial symbols from text.
 * Ensures clean, professional typography across the application.
 */
export function stripEmojis(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{FE00}-\u{FE0F}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}
