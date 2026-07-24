/**
 * Curated set of free-to-use (Unsplash License — free for commercial use,
 * no attribution required) sneaker photographs, grouped so each product
 * category gets a small consistent pool of real photography instead of
 * one photo repeated everywhere.
 *
 * Source: images.unsplash.com (photographers credited in README-ASSETS.md)
 */
function unsplash(id: string, w = 900): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

// Individual photo ids
export const PHOTO = {
  whitePairWhiteBg: "photo-1676379827610-c380c52db0c6", // Maria Fernanda Pissioli
  redPairWhiteBg: "photo-1675625500632-2d276bd51920", // Derrick Payton
  whiteShoeBlackBg: "photo-1617813774819-2b086f744456", // Adrian Hernandez
  whiteBlackOrangeCloseup: "photo-1639572600664-28a2a01ce860", // Ibrahim Abazid
  blueOrangeWhiteBg: "photo-1637437735621-22472eee4875", // mostafa mahmoudi
  jordanCreamOutdoor: "photo-1700407592504-f4de855d559a", // Karsten Winegeart
  sneakersBlackBg: "photo-1692482386532-7a3c6a051144", // Fujiphilm
  sneakerDarkProfile: "photo-1755194757953-a9301005114b", // Fujiphilm
} as const;

type PhotoKey = keyof typeof PHOTO;

// Small, sensible pool per category so cards within a category feel
// consistent while still varying across the catalog.
const CATEGORY_POOLS: Record<string, PhotoKey[]> = {
  "cat-running": ["blueOrangeWhiteBg", "redPairWhiteBg", "whiteShoeBlackBg"],
  "cat-basketball": ["jordanCreamOutdoor", "sneakersBlackBg", "sneakerDarkProfile"],
  "cat-lifestyle": ["whitePairWhiteBg", "whiteBlackOrangeCloseup", "redPairWhiteBg"],
  "cat-training": ["whiteShoeBlackBg", "sneakersBlackBg", "blueOrangeWhiteBg"],
  "cat-slipon": ["whitePairWhiteBg", "blueOrangeWhiteBg", "whiteBlackOrangeCloseup"],
  "cat-kids": ["whiteBlackOrangeCloseup", "jordanCreamOutdoor", "whitePairWhiteBg"],
};

/** Returns 3 distinct photo URLs (gallery) for a given category + index, rotated so cards vary. */
export function productPhotos(categoryId: string, index: number): string[] {
  const pool = CATEGORY_POOLS[categoryId] || CATEGORY_POOLS["cat-lifestyle"];
  const rotated = [pool[index % pool.length], pool[(index + 1) % pool.length], pool[(index + 2) % pool.length]];
  return rotated.map((key) => unsplash(PHOTO[key]));
}

export function heroPhoto(): string {
  return unsplash(PHOTO.sneakerDarkProfile, 1600);
}

export function darkBannerPhoto(key: PhotoKey = "sneakersBlackBg"): string {
  return unsplash(PHOTO[key], 1200);
}

export function categoryHeroPhoto(categoryId: string): string {
  const pool = CATEGORY_POOLS[categoryId] || CATEGORY_POOLS["cat-lifestyle"];
  return unsplash(PHOTO[pool[0]], 1200);
}

export { unsplash };
