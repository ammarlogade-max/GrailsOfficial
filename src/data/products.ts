import type { Product, ProductColor } from "./types";
import { productPhotos } from "../lib/images";

interface Seed {
  brand: string;
  name: string;
  categoryId: string;
  price: number;
  originalPrice: number;
  colors: ProductColor[];
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  stock: number;
  rating: number;
  reviews: number;
  sold: number;
  material: string;
  daysAgo: number;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const seeds: Seed[] = [
  { brand: "Nike", name: "Air Zoom Pulse Runner", categoryId: "cat-running", price: 2799, originalPrice: 5999, stock: 42, rating: 4.6, reviews: 214, sold: 860, material: "Engineered mesh + rubber", daysAgo: 5, colors: [{name:"Triple White",hex:"#f5f5f5"},{name:"Black/Orange",hex:"#111111"},{name:"Volt",hex:"#c6f135"}], bestSeller: true, trending: true },
  { brand: "Nike", name: "Air Max Horizon", categoryId: "cat-lifestyle", price: 3299, originalPrice: 7499, stock: 30, rating: 4.7, reviews: 388, sold: 1210, material: "Leather + mesh", daysAgo: 40, colors: [{name:"White/Black",hex:"#e5e5e5"},{name:"Sail",hex:"#efe6d8"}], bestSeller: true, featured: true },
  { brand: "Nike", name: "Court Vision Low", categoryId: "cat-basketball", price: 2199, originalPrice: 4499, stock: 55, rating: 4.4, reviews: 156, sold: 502, material: "Synthetic leather", daysAgo: 3, colors: [{name:"White/Red",hex:"#ffffff"},{name:"Black",hex:"#141414"}], newArrival: true },
  { brand: "Nike", name: "Blazer Mid Retro", categoryId: "cat-lifestyle", price: 2999, originalPrice: 6299, stock: 21, rating: 4.5, reviews: 97, sold: 340, material: "Canvas + leather", daysAgo: 60, colors: [{name:"Sail/Black",hex:"#f2ede1"},{name:"Sail/Orange",hex:"#f2ede1"}] },
  { brand: "Adidas", name: "Ultraboost Surge", categoryId: "cat-running", price: 3499, originalPrice: 8999, stock: 38, rating: 4.8, reviews: 512, sold: 1890, material: "Primeknit + Boost foam", daysAgo: 8, colors: [{name:"Core Black",hex:"#0a0a0a"},{name:"Cloud White",hex:"#f5f5f5"}], bestSeller: true, trending: true, featured: true },
  { brand: "Adidas", name: "Duramo Flex", categoryId: "cat-training", price: 1899, originalPrice: 3999, stock: 60, rating: 4.2, reviews: 88, sold: 275, material: "Mesh + EVA", daysAgo: 12, colors: [{name:"Grey/Orange",hex:"#3b3b3b"},{name:"Navy",hex:"#1c2b4a"}] },
  { brand: "Adidas", name: "Superstar Classic", categoryId: "cat-lifestyle", price: 2499, originalPrice: 5499, stock: 47, rating: 4.6, reviews: 640, sold: 2100, material: "Leather + rubber shell toe", daysAgo: 200, colors: [{name:"White/Black",hex:"#ffffff"},{name:"White/Green",hex:"#ffffff"}], bestSeller: true },
  { brand: "Adidas", name: "Forum Bold High", categoryId: "cat-basketball", price: 3199, originalPrice: 6999, stock: 18, rating: 4.5, reviews: 76, sold: 190, material: "Leather", daysAgo: 4, colors: [{name:"Orange/White",hex:"#f97316"},{name:"Black/White",hex:"#141414"}], newArrival: true, trending: true },
  { brand: "Puma", name: "Velocity Nitro 2.0", categoryId: "cat-running", price: 2599, originalPrice: 5299, stock: 33, rating: 4.3, reviews: 120, sold: 410, material: "Mesh + Nitro foam", daysAgo: 25, colors: [{name:"Navy/Orange",hex:"#1c2b4a"},{name:"Grey",hex:"#8a8a8a"}] },
  { brand: "Puma", name: "Smash Court 3.0", categoryId: "cat-lifestyle", price: 1999, originalPrice: 3999, stock: 70, rating: 4.1, reviews: 64, sold: 220, material: "Leather", daysAgo: 15, colors: [{name:"White/Red",hex:"#ffffff"},{name:"White/Black",hex:"#ffffff"}] },
  { brand: "Puma", name: "RS-X Chunky", categoryId: "cat-lifestyle", price: 3399, originalPrice: 7199, stock: 12, rating: 4.4, reviews: 58, sold: 145, material: "Mesh + suede", daysAgo: 2, colors: [{name:"White/Multi",hex:"#e5e5e5"}], newArrival: true },
  { brand: "New Balance", name: "990 Heritage", categoryId: "cat-lifestyle", price: 3799, originalPrice: 8499, stock: 26, rating: 4.7, reviews: 302, sold: 780, material: "Suede + mesh", daysAgo: 70, colors: [{name:"Grey",hex:"#8a8a8a"},{name:"Navy",hex:"#1c2b4a"}], bestSeller: true },
  { brand: "New Balance", name: "574 Classic", categoryId: "cat-lifestyle", price: 2299, originalPrice: 4799, stock: 44, rating: 4.5, reviews: 410, sold: 990, material: "Suede + mesh", daysAgo: 130, colors: [{name:"Grey/Orange",hex:"#5c6b78"},{name:"Black",hex:"#141414"}] },
  { brand: "New Balance", name: "Fresh Foam Trail", categoryId: "cat-training", price: 3099, originalPrice: 6299, stock: 19, rating: 4.4, reviews: 55, sold: 130, material: "Ripstop mesh", daysAgo: 6, colors: [{name:"Olive",hex:"#3a4a2e"}], newArrival: true },
  { brand: "Reebok", name: "Nano X4 Trainer", categoryId: "cat-training", price: 3599, originalPrice: 7999, stock: 22, rating: 4.6, reviews: 140, sold: 360, material: "Flexweave + rubber", daysAgo: 18, colors: [{name:"Black/Orange",hex:"#0a0a0a"},{name:"Grey",hex:"#8a8a8a"}], trending: true },
  { brand: "Reebok", name: "Club C Legacy", categoryId: "cat-lifestyle", price: 2099, originalPrice: 4299, stock: 51, rating: 4.3, reviews: 210, sold: 640, material: "Leather", daysAgo: 90, colors: [{name:"White/Navy",hex:"#ffffff"}] },
  { brand: "Converse", name: "Chuck Street Hi", categoryId: "cat-lifestyle", price: 1799, originalPrice: 3599, stock: 65, rating: 4.5, reviews: 520, sold: 1400, material: "Canvas", daysAgo: 300, colors: [{name:"Black",hex:"#0a0a0a"},{name:"White",hex:"#f5f5f5"},{name:"Red",hex:"#a3122a"}], bestSeller: true },
  { brand: "Converse", name: "One Star Low", categoryId: "cat-lifestyle", price: 1699, originalPrice: 3299, stock: 34, rating: 4.2, reviews: 78, sold: 210, material: "Suede", daysAgo: 45, colors: [{name:"Burgundy",hex:"#7a1f1f"},{name:"Navy",hex:"#1c2b4a"}] },
  { brand: "Vans", name: "Old Skool Street", categoryId: "cat-lifestyle", price: 1899, originalPrice: 3799, stock: 58, rating: 4.6, reviews: 460, sold: 1320, material: "Canvas + suede", daysAgo: 110, colors: [{name:"Black/White",hex:"#0a0a0a"},{name:"Checkerboard",hex:"#1a1a1a"}], bestSeller: true },
  { brand: "Vans", name: "Slip-On Classic", categoryId: "cat-slipon", price: 1599, originalPrice: 2999, stock: 80, rating: 4.4, reviews: 340, sold: 1050, material: "Canvas", daysAgo: 20, colors: [{name:"Navy",hex:"#1c2b4a"},{name:"Black",hex:"#0a0a0a"}] },
  { brand: "Skechers", name: "Go Walk Glide", categoryId: "cat-slipon", price: 1699, originalPrice: 3299, stock: 66, rating: 4.3, reviews: 190, sold: 560, material: "Knit mesh", daysAgo: 33, colors: [{name:"Grey",hex:"#8a8a8a"},{name:"Black",hex:"#141414"}] },
  { brand: "Skechers", name: "Max Cushion Runner", categoryId: "cat-running", price: 2399, originalPrice: 4999, stock: 29, rating: 4.4, reviews: 102, sold: 300, material: "Mesh", daysAgo: 9, colors: [{name:"White/Navy",hex:"#e5e5e5"}], newArrival: true },
  { brand: "Nike", name: "Air Jordan Retro Low", categoryId: "cat-basketball", price: 4299, originalPrice: 9999, stock: 15, rating: 4.9, reviews: 610, sold: 1550, material: "Leather", daysAgo: 55, colors: [{name:"Red/Black",hex:"#a3122a"},{name:"University Blue",hex:"#5b9bd5"}], bestSeller: true, trending: true, featured: true },
  { brand: "Nike", name: "Air Jordan Retro High", categoryId: "cat-basketball", price: 4799, originalPrice: 10999, stock: 9, rating: 4.9, reviews: 440, sold: 980, material: "Leather", daysAgo: 1, colors: [{name:"Black/Red (Bred)",hex:"#0a0a0a"},{name:"Chicago",hex:"#e11d48"}], newArrival: true, trending: true, featured: true },
  { brand: "Nike", name: "Downshifter Trainer", categoryId: "cat-running", price: 1999, originalPrice: 3999, stock: 72, rating: 4.1, reviews: 66, sold: 240, material: "Mesh", daysAgo: 28, colors: [{name:"Grey/Orange",hex:"#5c6b78"}] },
  { brand: "Adidas", name: "Grand Court Base", categoryId: "cat-lifestyle", price: 1899, originalPrice: 3699, stock: 61, rating: 4.2, reviews: 133, sold: 420, material: "Leather", daysAgo: 80, colors: [{name:"White/Navy",hex:"#ffffff"}] },
  { brand: "Adidas", name: "Ozweego Trail", categoryId: "cat-training", price: 2999, originalPrice: 5999, stock: 24, rating: 4.3, reviews: 71, sold: 165, material: "Mesh + TPU", daysAgo: 14, colors: [{name:"Olive",hex:"#3a4a2e"},{name:"Grey",hex:"#8a8a8a"}] },
  { brand: "Puma", name: "Cali Sport Clean", categoryId: "cat-lifestyle", price: 2199, originalPrice: 4399, stock: 39, rating: 4.4, reviews: 98, sold: 260, material: "Leather", daysAgo: 22, colors: [{name:"White",hex:"#f5f5f5"},{name:"White/Pink",hex:"#f5f5f5"}] },
  { brand: "Puma", name: "Court Slip Elite", categoryId: "cat-slipon", price: 1799, originalPrice: 3399, stock: 48, rating: 4.2, reviews: 54, sold: 175, material: "Knit", daysAgo: 11, colors: [{name:"Black",hex:"#0a0a0a"}] },
  { brand: "New Balance", name: "Kids Sprint Runner", categoryId: "cat-kids", price: 1499, originalPrice: 2799, stock: 55, rating: 4.5, reviews: 88, sold: 300, material: "Mesh", daysAgo: 17, colors: [{name:"Orange",hex:"#f97316"},{name:"Blue",hex:"#3a6ea5"}] },
  { brand: "Nike", name: "Kids Court Champ", categoryId: "cat-kids", price: 1699, originalPrice: 3299, stock: 40, rating: 4.4, reviews: 62, sold: 210, material: "Synthetic leather", daysAgo: 26, colors: [{name:"White/Red",hex:"#ffffff"}] },
  { brand: "Reebok", name: "Kids Flex Bounce", categoryId: "cat-kids", price: 1399, originalPrice: 2599, stock: 47, rating: 4.3, reviews: 39, sold: 140, material: "Mesh", daysAgo: 38, colors: [{name:"Sky Blue",hex:"#5b9bd5"}] },
  { brand: "Adidas", name: "Racer TR23", categoryId: "cat-running", price: 2699, originalPrice: 5599, stock: 36, rating: 4.5, reviews: 149, sold: 470, material: "Mesh + EVA", daysAgo: 7, colors: [{name:"Black/Orange",hex:"#141414"},{name:"White",hex:"#f5f5f5"}], trending: true },
  { brand: "Puma", name: "Iconic High Street", categoryId: "cat-lifestyle", price: 2899, originalPrice: 5799, stock: 20, rating: 4.4, reviews: 60, sold: 155, material: "Suede + leather", daysAgo: 48, colors: [{name:"Burgundy",hex:"#7a1f1f"}] },
  { brand: "Vans", name: "Sk8-Hi Reissue", categoryId: "cat-lifestyle", price: 2199, originalPrice: 4399, stock: 32, rating: 4.6, reviews: 210, sold: 640, material: "Canvas + suede", daysAgo: 65, colors: [{name:"Black/White",hex:"#0a0a0a"}] },
  { brand: "New Balance", name: "Rebel v4 Speed", categoryId: "cat-running", price: 3299, originalPrice: 6799, stock: 16, rating: 4.7, reviews: 88, sold: 220, material: "Knit + FuelCell foam", daysAgo: 3, colors: [{name:"Orange/Black",hex:"#f97316"}], newArrival: true, trending: true },
  { brand: "Reebok", name: "Classic Leather Utility", categoryId: "cat-lifestyle", price: 2499, originalPrice: 4999, stock: 27, rating: 4.5, reviews: 175, sold: 500, material: "Leather", daysAgo: 150, colors: [{name:"White",hex:"#e5e5e5"}] },
  { brand: "Skechers", name: "Arch Fit Stride", categoryId: "cat-training", price: 2999, originalPrice: 5999, stock: 23, rating: 4.6, reviews: 96, sold: 280, material: "Mesh + memory foam", daysAgo: 10, colors: [{name:"Black/Orange",hex:"#0a0a0a"}] },
];

function sizeSetFor(categoryId: string): number[] {
  if (categoryId === "cat-kids") return [10, 11, 12, 13, 1, 2, 3];
  return [6, 7, 8, 9, 10, 11, 12];
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const products: Product[] = seeds.map((s, i) => {
  const id = `prod-${String(i + 1).padStart(3, "0")}`;
  const slug = slugify(`${s.brand} ${s.name}`);
  const discount = Math.round(((s.originalPrice - s.price) / s.originalPrice) * 100);
  return {
    id,
    name: `${s.brand} ${s.name}`,
    slug,
    sku: `UK-${s.brand.slice(0, 3).toUpperCase()}-${1000 + i}`,
    barcode: `8901234${String(560000 + i)}`,
    categoryId: s.categoryId,
    brand: s.brand,
    description: `The ${s.brand} ${s.name} blends premium ${s.material.toLowerCase()} construction with everyday comfort. Designed for sneakerheads who want the look without compromising on durability — cushioned insole, breathable lining, and a grippy outsole made for Indian streets and weather.`,
    highlights: [
      "Premium quality materials, true to original silhouette",
      "Runs true to size — order your usual UK size",
      "Cushioned insole for all-day comfort",
      `${discount}% off MRP for a limited time`,
    ],
    specifications: {
      Material: s.material,
      Sole: "Rubber",
      Closure: s.categoryId === "cat-slipon" ? "Slip-On" : "Lace-Up",
      Weight: `${260 + (i % 8) * 10}g`,
      "Country of Origin": "India",
    },
    shippingInfo: "Ships in 2-3 business days. Free delivery above ₹999.",
    returnPolicy: "7-day easy return & exchange policy.",
    price: s.price,
    originalPrice: s.originalPrice,
    images: productPhotos(s.categoryId, i),
    availableSizes: sizeSetFor(s.categoryId),
    availableColors: s.colors,
    material: s.material,
    weight: 260 + (i % 8) * 10,
    status: "published",
    featured: !!s.featured,
    trending: !!s.trending,
    bestSeller: !!s.bestSeller,
    newArrival: !!s.newArrival,
    stock: s.stock,
    lowStockThreshold: 10,
    seoTitle: `Buy ${s.brand} ${s.name} Online | Grail's Official`,
    seoDescription: `Shop the ${s.brand} ${s.name} at ₹${s.price}. Premium quality, COD available, free shipping above ₹999, 7-day returns.`,
    seoKeywords: `${s.brand}, ${s.name}, sneakers, shoes online india`,
    sortOrder: i,
    numReviews: s.reviews,
    avgRating: s.rating,
    totalSold: s.sold,
    createdAt: daysAgoIso(s.daysAgo),
    updatedAt: daysAgoIso(Math.max(0, s.daysAgo - 2)),
  };
});

export const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
