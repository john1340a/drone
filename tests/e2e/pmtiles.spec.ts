import { test, expect } from '@playwright/test';

test.describe('PMTiles Layer Loading (MapLibre GL JS)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#map', { state: 'visible' });
  });

  test('should fetch restrictions_sia.pmtiles file', async ({ page }) => {
    const pmtilesRequestPromise = page.waitForRequest(request =>
      request.url().includes('restrictions_sia.pmtiles'),
      { timeout: 15000 }
    );

    await page.reload();
    await page.waitForSelector('#map', { state: 'visible' });

    const request = await pmtilesRequestPromise;
    expect(request).toBeTruthy();

    const response = await request.response();
    if (response) {
      // MapLibre uses Range Requests — 200, 206, or 304 are all valid
      expect([200, 206, 304]).toContain(response.status());
    }
  });

  test('should fetch allowed_zones.pmtiles file', async ({ page }) => {
    const pmtilesRequestPromise = page.waitForRequest(request =>
      request.url().includes('allowed_zones.pmtiles'),
      { timeout: 15000 }
    );

    await page.reload();
    await page.waitForSelector('#map', { state: 'visible' });

    const request = await pmtilesRequestPromise;
    expect(request).toBeTruthy();
  });

  test('should render MapLibre WebGL canvas', async ({ page }) => {
    // MapLibre renders everything on a single WebGL canvas
    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
  });

  test('should register pmtiles protocol', async ({ page }) => {
    // Check that PMTiles URL scheme is being used (tile requests via Range)
    const tileRequest = page.waitForRequest(request => {
      const url = request.url();
      return url.includes('.pmtiles') && request.method() === 'GET';
    }, { timeout: 15000 });

    await page.reload();
    await page.waitForSelector('#map');

    const request = await tileRequest;
    // MapLibre issues Range Requests on PMTiles files via the pmtiles protocol handler
    expect(request.url()).toMatch(/\.pmtiles/);
  });
});
