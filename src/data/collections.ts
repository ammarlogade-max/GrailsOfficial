import type { Collection } from "./types";
import { products } from "./products";
import { darkBannerPhoto, categoryHeroPhoto } from "../lib/images";

const byIds = (ids: string[]) => ids;
const idsWhere = (fn: (p: (typeof products)[number]) => boolean, limit = 8) =>
  products.filter(fn).slice(0, limit).map((p) => p.id);

export const collections: Collection[] = [
  {
    id: "col-jordan",
    name: "Jordan Collection",
    slug: "jordan-collection",
    description: "Iconic retro silhouettes for the culture.",
    sectionTitle: "Jordan Exclusives",
    showOnHomepage: true,
    homepageSortOrder: 1,
    productIds: byIds(idsWhere((p) => p.name.includes("Jordan"))),
    active: true,
    bannerPhoto: categoryHeroPhoto("cat-basketball"),
  },
  {
    id: "col-festival",
    name: "Festival Sale",
    slug: "festival-sale",
    description: "Our biggest markdowns of the season.",
    sectionTitle: "🎉 Festival Sale — Up to 60% Off",
    showOnHomepage: true,
    homepageSortOrder: 2,
    productIds: byIds(idsWhere((p) => p.price / p.originalPrice < 0.45, 10)),
    active: true,
    bannerPhoto: darkBannerPhoto("sneakersBlackBg"),
  },
  {
    id: "col-monsoon",
    name: "Monsoon Ready",
    slug: "monsoon-ready",
    description: "Grippy soles and quick-dry uppers for the rains.",
    sectionTitle: "Monsoon Ready Picks",
    showOnHomepage: true,
    homepageSortOrder: 3,
    productIds: byIds(idsWhere((p) => p.categoryId === "cat-training" || p.categoryId === "cat-running", 8)),
    active: true,
    bannerPhoto: categoryHeroPhoto("cat-training"),
  },
  {
    id: "col-college",
    name: "College Essentials",
    slug: "college-essentials",
    description: "Everyday sneakers that survive lectures, canteens and metro rides.",
    sectionTitle: "College Essentials",
    showOnHomepage: false,
    homepageSortOrder: 4,
    productIds: byIds(idsWhere((p) => p.categoryId === "cat-lifestyle", 8)),
    active: true,
    bannerPhoto: categoryHeroPhoto("cat-lifestyle"),
  },
];
