import { expect, test } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:4173";

test.use({ baseURL });

function collectPageErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("core public routes render without client crashes", async ({ page }) => {
  const errors = collectPageErrors(page);
  for (const path of ["/", "/products", "/product/nike-air-zoom-pulse-runner", "/cart", "/faq", "/track", "/login", "/register"]) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  }
  expect(errors).toEqual([]);
});

test("mobile menu stays above hero and readable", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByLabel("Open menu").click();

  const drawer = page.getByTestId("mobile-menu-panel");
  await expect(page.getByPlaceholder("Search...")).toBeVisible();
  await expect(page.locator('a[href="/products?category=running"]').last()).toBeVisible();
  await expect(page.locator('a[href="/products?category=basketball"]').last()).toBeVisible();

  const drawerBg = await drawer.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(drawerBg).not.toBe("rgba(0, 0, 0, 0)");
  expect(errors).toEqual([]);
});

test("customer can add product to cart and reach COD checkout", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/products");
  const firstProduct = page.locator('a[href^="/product/"]').first();
  await expect(firstProduct, "Live catalog must have at least one product before launch").toBeVisible();
  const productName = (await firstProduct.textContent())?.replace(/\s+/g, " ").trim() || "";
  await firstProduct.click();
  await expect(page.locator("body")).not.toContainText("Product not found.");
  await page.locator("button").filter({ hasText: /^(1|2|3|6|7|8|9|10|11|12|13)$/ }).first().click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.goto("/cart");
  await expect(page.locator("body")).toContainText(productName.split(" ").slice(0, 2).join(" "));
  await page.getByRole("link", { name: /checkout/i }).click();
  await expect(page.getByRole("heading", { name: /checkout/i })).toBeVisible();
  await expect(page.getByLabel("Cash on Delivery")).toBeChecked();
  await expect(page.getByText("Scanner payment coming soon")).toBeVisible();
  expect(errors).toEqual([]);
});

test("admin protected route redirects unauthenticated users to login", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "UrbanKicks Admin" })).toBeVisible();
  expect(errors).toEqual([]);
});
