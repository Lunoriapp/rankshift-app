const GENERIC_IMAGE_WORDS = new Set([
  "image",
  "images",
  "img",
  "photo",
  "photos",
  "picture",
  "pictures",
  "graphic",
  "graphics",
  "banner",
  "hero",
  "icon",
  "logo",
  "thumbnail",
  "thumb",
  "stock",
  "copy",
  "final",
  "large",
  "small",
  "medium",
  "desktop",
  "mobile",
  "web",
  "site",
  "homepage",
]);

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "this",
  "to",
  "with",
  "your",
]);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toWords(value: string): string[] {
  return normalizeWhitespace(
    value
      .toLowerCase()
      .replace(/\.[a-z0-9]{2,5}$/i, " ")
      .replace(/[_\-]+/g, " ")
      .replace(/[^a-z0-9\s]/g, " "),
  )
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/(?:es|s)$/i, (match) => (part.length > 4 ? "" : match)))
    .filter((part) => part.length > 1 && !/^\d+$/.test(part));
}

export function getImageFileName(src: string): string {
  if (!src) {
    return "unknown-image";
  }

  try {
    const parsed = new URL(src);
    const fileName = parsed.pathname.split("/").filter(Boolean).pop();
    return fileName || src;
  } catch {
    const withoutQuery = src.split("?")[0]?.split("#")[0] ?? src;
    return withoutQuery.split("/").filter(Boolean).pop() ?? src;
  }
}

function getMeaningfulFilenameWords(src: string): string[] {
  return toWords(getImageFileName(src)).filter((word) => !GENERIC_IMAGE_WORDS.has(word));
}

function getContextWords(surroundingText: string): string[] {
  return toWords(surroundingText).filter(
    (word) => !STOP_WORDS.has(word) && !GENERIC_IMAGE_WORDS.has(word),
  );
}

function sentenceCase(words: string[]): string {
  if (words.length === 0) {
    return "";
  }

  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildSuggestedAltText(input: {
  src: string;
  surroundingText: string;
}): string {
  const fileWords = getMeaningfulFilenameWords(input.src);
  const contextWords = getContextWords(input.surroundingText);

  const chosenWords = [...fileWords];

  for (const word of contextWords) {
    if (chosenWords.includes(word)) {
      continue;
    }

    chosenWords.push(word);

    if (chosenWords.length >= 8) {
      break;
    }
  }

  const fallbackWords = contextWords.slice(0, 6);
  const altWords = (chosenWords.length > 0 ? chosenWords : fallbackWords).slice(0, 12);

  if (altWords.length === 0) {
    return "Descriptive page image";
  }

  return sentenceCase(altWords);
}
