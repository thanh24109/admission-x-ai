/**
 * Utility to strip Vietnamese accents and diacritics for flexible fuzzy searching.
 */
export function removeVietnameseDiacritics(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Checks if search text matches target text, supporting both accented and non-accented Vietnamese.
 */
export function matchesVietnameseSearch(target: string, query: string): boolean {
  if (!query) return true;
  if (!target) return false;

  const normalizedTarget = removeVietnameseDiacritics(target);
  const normalizedQuery = removeVietnameseDiacritics(query);

  return (
    target.toLowerCase().includes(query.toLowerCase().trim()) ||
    normalizedTarget.includes(normalizedQuery)
  );
}
