/** Lowercase and without accents, so "epaule" finds "Épaule". Used by the pages and the browser. */
export const searchText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
