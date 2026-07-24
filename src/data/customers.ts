import type { Customer } from "./types";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const names = [
  "Aarav Sharma", "Priya Patel", "Rohan Deshmukh", "Sneha Iyer", "Vikram Singh",
  "Ananya Reddy", "Karan Malhotra", "Isha Kulkarni", "Aditya Nair", "Neha Joshi",
  "Rahul Verma", "Pooja Mehta", "Arjun Rao", "Divya Chauhan", "Siddharth Bose",
  "Kavya Menon", "Yash Agarwal", "Riya Kapoor", "Manish Pillai", "Tanvi Shetty",
];

const cities = [
  { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
  { city: "Pune", state: "Maharashtra", pincode: "411001" },
  { city: "Raigad", state: "Maharashtra", pincode: "402301" },
  { city: "Bengaluru", state: "Karnataka", pincode: "560001" },
  { city: "Delhi", state: "Delhi", pincode: "110001" },
  { city: "Hyderabad", state: "Telangana", pincode: "500001" },
  { city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
  { city: "Jaipur", state: "Rajasthan", pincode: "302001" },
];

export const customers: Customer[] = names.map((fullName, i) => {
  const loc = cities[i % cities.length];
  const initials = fullName.split(" ").map((n) => n[0]).join("");
  const totalOrders = [0, 1, 2, 3, 5, 8][i % 6];
  return {
    id: `cust-${String(i + 1).padStart(3, "0")}`,
    fullName,
    email: `${fullName.toLowerCase().replace(" ", ".")}@example.com`,
    phone: `9${String(700000000 + i * 137).slice(0, 9)}`,
    avatarInitials: initials,
    joinedAt: daysAgoIso(30 + i * 11),
    addresses: [
      {
        id: `addr-${i}-1`,
        label: "Home",
        name: fullName,
        phone: `9${String(700000000 + i * 137).slice(0, 9)}`,
        line1: `${100 + i} ${["MG Road", "Station Road", "Ring Road", "Sector 12"][i % 4]}`,
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
        isDefault: true,
      },
    ],
    totalOrders,
    totalSpent: totalOrders * (1800 + (i % 5) * 400),
    status: i === 11 ? "blocked" : "active",
    tags: totalOrders >= 5 ? ["VIP"] : totalOrders === 0 ? ["New"] : [],
  };
});
