import { test, expect } from "@playwright/test";

test.describe("Shakti Command Center Dashboard E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local dev server route
    await page.goto("/");
  });

  test("should render the main dashboard container and system header", async ({ page }) => {
    // Check main title
    await expect(page.locator("h1")).toContainText("SHAKTI COMMAND CENTER");
    
    // Check key layout sections exist
    await expect(page.getByLabel("Executive Business KPIs")).toBeVisible();
    await expect(page.getByLabel("Runtime Health & Topology")).toBeVisible();
    await expect(page.getByLabel("Execution Pipelines & Linage")).toBeVisible();
    await expect(page.getByLabel("Simulation & Replay")).toBeVisible();
  });

  test("should adapt to different viewport sizes", async ({ page }) => {
    // 1. Mobile Viewport test
    await page.setViewportSize({ width: 375, height: 667 });
    // Check visibility on mobile
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByLabel("Executive Business KPIs")).toBeVisible();

    // 2. Desktop Viewport test
    await page.setViewportSize({ width: 1280, height: 800 });
    // Grid displays next to each other on desktop, check grid classes exist
    const mainGrid = page.locator("main > div.grid");
    await expect(mainGrid).toBeVisible();
  });
});
