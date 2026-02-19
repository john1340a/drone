import { test, expect } from '@playwright/test';

test.describe('PMTiles Layer Loading', () => {

  test.beforeEach(async ({ page }) => {
    // Go to the map page
    await page.goto('/');
    // Wait for map container to be loaded
    await page.waitForSelector('#map', { state: 'visible' });
  });

  test('should successfully fetch PMTiles data', async ({ page }) => {
    // Define a promise to wait for a specific request
    const pmtilesRequestPromise = page.waitForRequest(request => 
      request.url().includes('restrictions_sia.pmtiles')
    );

    // Reload to ensure we catch the initial request
    await page.reload();
    await page.waitForSelector('#map', { state: 'visible' });

    // Wait for the request to be made
    const request = await pmtilesRequestPromise;
    expect(request).toBeTruthy();
    
    // Check response status
    const response = await request.response();
    if (response) {
        // 200 OK or 206 Partial Content are valid
        console.log(`PMTiles request status: ${response.status()}`);
        expect([200, 206, 304]).toContain(response.status());
    }
  });

  test('should render VectorGrid canvas tiles', async ({ page }) => {
    // VectorGrid uses <canvas> elements for tiles in the overlay pane
    // Wait for at least one canvas to appear in the overlay pane
    const canvasTile = page.locator('.leaflet-pane.leaflet-overlay-pane canvas').first();
    
    // Might take a moment to fetch and render
    await expect(canvasTile).toBeVisible({ timeout: 15000 });
    
    // Check if multiple tiles are rendered (zoomed out view usually has multiple)
    const count = await page.locator('.leaflet-pane.leaflet-overlay-pane canvas').count();
    console.log(`Rendered ${count} vector tiles`);
    expect(count).toBeGreaterThan(0);
  });

});
