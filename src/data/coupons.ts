import type { Coupon, Offer } from "./types";

function daysFromNowIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const coupons: Coupon[] = [
  { id: "cpn-1", code: "FESTIVE10", description: "10% off on all orders above ₹1500", type: "percentage", value: 10, minOrderAmount: 1500, maxDiscount: 500, maxUses: 1000, usesPerUser: 1, currentUses: 612, active: true, startsAt: daysAgoIso(10), endsAt: daysFromNowIso(20), appliesTo: "all", categoryIds: [], productIds: []  },
  { id: "cpn-2", code: "FIRSTORDER", description: "Flat ₹300 off on your first order", type: "fixed", value: 300, minOrderAmount: 999, maxUses: null, usesPerUser: 1, currentUses: 340, active: true, startsAt: daysAgoIso(60), endsAt: daysFromNowIso(365), appliesTo: "all", categoryIds: [], productIds: []  },
  { id: "cpn-3", code: "FREESHIP", description: "Free shipping on all orders", type: "free_shipping", value: 0, minOrderAmount: 0, maxUses: 500, usesPerUser: 2, currentUses: 210, active: true, startsAt: daysAgoIso(5), endsAt: daysFromNowIso(10), appliesTo: "all", categoryIds: [], productIds: []  },
  { id: "cpn-4", code: "EIDFEST20", description: "20% off — Eid Special", type: "percentage", value: 20, minOrderAmount: 2000, maxDiscount: 800, maxUses: 300, usesPerUser: 1, currentUses: 298, active: false, startsAt: daysAgoIso(90), endsAt: daysAgoIso(60), appliesTo: "all", categoryIds: [], productIds: []  },
  { id: "cpn-5", code: "MONSOON15", description: "15% off Monsoon Ready collection", type: "percentage", value: 15, minOrderAmount: 1000, maxDiscount: 400, maxUses: 400, usesPerUser: 1, currentUses: 89, active: true, startsAt: daysAgoIso(2), endsAt: daysFromNowIso(30), appliesTo: "all", categoryIds: [], productIds: [] },
];

export const offers: Offer[] = [
  { id: "off-1", name: "Festival Sale", description: "Up to 60% off sitewide", type: "percentage", value: 60, appliesTo: "all", showOnHomepage: true, badgeText: "UP TO 60% OFF", startsAt: daysAgoIso(5), endsAt: daysFromNowIso(15), active: true, categoryIds: [], collectionIds: [], productIds: []  },
  { id: "off-2", name: "Jordan Collection Drop", description: "New Jordan retros — limited stock", type: "percentage", value: 15, appliesTo: "collection", showOnHomepage: true, badgeText: "NEW DROP", startsAt: daysAgoIso(1), endsAt: daysFromNowIso(20), active: true, categoryIds: [], collectionIds: [], productIds: []  },
  { id: "off-3", name: "Weekend Flash Sale", description: "Extra 10% off, this weekend only", type: "percentage", value: 10, appliesTo: "all", showOnHomepage: true, badgeText: "FLASH SALE", startsAt: daysFromNowIso(2), endsAt: daysFromNowIso(4), active: true, categoryIds: [], collectionIds: [], productIds: []  },
  { id: "off-4", name: "Buy 2 Get Free Shipping", description: "Free shipping when you buy 2+ pairs", type: "free_shipping", value: 0, appliesTo: "all", showOnHomepage: false, badgeText: "COMBO OFFER", startsAt: daysAgoIso(20), endsAt: daysFromNowIso(40), active: true, categoryIds: [], collectionIds: [], productIds: []  },
  { id: "off-5", name: "Republic Day Sale", description: "Flat ₹500 off orders above ₹3000", type: "fixed", value: 500, appliesTo: "all", showOnHomepage: false, badgeText: "ENDED", startsAt: daysAgoIso(200), endsAt: daysAgoIso(170), active: false, categoryIds: [], collectionIds: [], productIds: [] },
];
