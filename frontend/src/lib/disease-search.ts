import type { Disease } from "@/lib/backend";

function normalize(value: string) {
  return value.normalize("NFKD").toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function isSubsequence(needle: string, haystack: string) {
  let index = 0;
  for (const letter of haystack) {
    if (letter === needle[index]) index++;
    if (index === needle.length) return true;
  }
  return false;
}

function orderedWordPrefixes(queryWords: string[], words: string[]) {
  let wordIndex = 0;
  for (const queryWord of queryWords) {
    while (wordIndex < words.length && !words[wordIndex].startsWith(queryWord)) wordIndex++;
    if (wordIndex === words.length) return false;
    wordIndex++;
  }
  return true;
}

function matchScore(name: string, query: string) {
  const normalized = normalize(name);
  const words = normalized.split(" ");
  const queryWords = query.split(" ");
  const compactQuery = query.replaceAll(" ", "");
  const initials = words.map(word => word[0]).join("");

  if (normalized === query) return 0;
  if (normalized.startsWith(query)) return 1;
  if (initials === compactQuery) return 2;
  if (initials.startsWith(compactQuery)) return 3;
  if (queryWords.length > 1 && orderedWordPrefixes(queryWords, words)) return 4;
  if (words.some(word => word.startsWith(query))) return 5;
  if (normalized.includes(query)) return 6;
  if (compactQuery.length >= 2 && isSubsequence(compactQuery, initials)) return 7;
  if (compactQuery.length >= 3 && isSubsequence(compactQuery, normalized.replaceAll(" ", ""))) return 8;
  return Infinity;
}

export function searchDiseases(diseases: Disease[], input: string, limit?: number) {
  const query = normalize(input);
  if (!query) return limit === undefined ? diseases : diseases.slice(0, limit);
  const matches = diseases
    .map(disease => ({ disease, score: matchScore(disease.name, query) }))
    .filter(item => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score || a.disease.name.localeCompare(b.disease.name))
    .map(item => item.disease);
  return limit === undefined ? matches : matches.slice(0, limit);
}
