const { test, expect } = require('@playwright/test');

test('should load the game and display UI', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Check title
  await expect(page).toHaveTitle(/Interactive Low-Poly FPS/);

  // Check UI elements
  await expect(page.locator('#weapon-info')).toBeVisible();
  await expect(page.locator('#health-info')).toBeVisible();
  await expect(page.locator('#ammo-info')).toBeVisible();
  
  // Check customization panel
  await expect(page.locator('#customization-panel')).toBeVisible();
  await expect(page.locator('#color-hat')).toBeVisible();
  await expect(page.locator('#color-shirt')).toBeVisible();
  await expect(page.locator('#color-shorts')).toBeVisible();
});

test('should lock pointer on start game click', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Click start game button
  await page.click('#btn-start');
  
  // In a real environment, this would trigger pointer lock.
  // We can check if the customization panel is hidden if pointer is locked.
  // Note: Playwright handles pointer lock slightly differently, but we can check UI state.
  await expect(page.locator('#customization-panel')).not.toBeVisible();
});
