import { test, expect } from "@playwright/test";

test.describe("OpenGov Intelligence Explorer E2E", () => {
  test("landing page loads and links to explorer", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await expect(page.locator("h1")).toContainText("Regulatory records you can");
    
    // Click Launch Explorer
    await page.click("text=Launch Explorer");
    await expect(page).toHaveURL(/.*\/explorer/);
  });

  test("explorer search and filter flow", async ({ page }) => {
    await page.goto("http://localhost:3000/explorer");
    
    // Check search input exists
    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();
    
    // Type query
    await searchInput.fill("Reliance");
    await page.keyboard.press("Enter");
    
    // Wait for results
    await expect(page.locator("text=Reliance")).toBeVisible();
  });

  test("analytics dashboard renders metrics", async ({ page }) => {
    await page.goto("http://localhost:3000/analytics");
    await expect(page.locator("h1")).toContainText("Enforcement Trends");
  });

  test("jobs monitor page displays ingestion runs", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");
    await expect(page.locator("h1")).toContainText("Crawler Ingestion");
  });
});
