import type { Review } from "./types";
import { products } from "./products";
import { customers } from "./customers";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const titles = [
  "Absolutely worth it!", "Great quality for the price", "True to size, comfy fit",
  "Better than expected", "Good but delivery was slow", "My go-to sneaker now",
  "Perfect for daily wear", "Quality matches the price tag", "Comfortable out of the box",
  "Will buy again", "Decent, minor stitching issue", "Loved the packaging and quality",
];

const bodies = [
  "Ordered a size 9 and it fit perfectly. The cushioning is great for long walks and the finish looks premium in person.",
  "Was skeptical about replica quality but this exceeded expectations. Stitching is neat and the sole grip is solid.",
  "Delivery took 4 days but the product quality made up for it. Colors are exactly as shown.",
  "Bought this for college and it's held up well after 2 months of daily use. Would recommend to friends.",
  "Comfortable, lightweight, and the price makes it a no-brainer. COD option was convenient too.",
  "Good pair overall. Slight smell initially but that went away after a day of airing out.",
];

export const reviews: Review[] = Array.from({ length: 60 }).map((_, i) => {
  const product = products[i % products.length];
  const customer = customers[(i * 3) % customers.length];
  const rating = [5, 5, 4, 5, 3, 4, 5, 2][i % 8];
  const status: Review["status"] = i % 11 === 0 ? "pending" : i % 17 === 0 ? "hidden" : "approved";
  return {
    id: `rev-${String(i + 1).padStart(3, "0")}`,
    productId: product.id,
    customerId: customer.id,
    customerName: customer.fullName,
    rating,
    title: titles[i % titles.length],
    body: bodies[i % bodies.length],
    status,
    pinned: i % 23 === 0,
    adminReply: i % 13 === 0 ? "Thank you for your feedback! We're glad you loved it. 🙌" : undefined,
    helpfulCount: (i * 7) % 40,
    createdAt: daysAgoIso(2 + i * 1.7),
  };
});
