export const cleanIsbn = (
  isbn: string | undefined | null
): string | undefined => {
  const trimmed = isbn?.replace(/-/g, "").trim();
  return trimmed ? trimmed : undefined;
};
