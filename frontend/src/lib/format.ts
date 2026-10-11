export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function initials(fullname?: string | null): string {
  const letters = (fullname ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return letters || "?";
}
