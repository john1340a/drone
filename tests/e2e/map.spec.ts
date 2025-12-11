import { test, expect } from '@playwright/test';

test.describe('Map Application', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to the map page before each test
    await page.goto('/');
    // Wait for map container to be present
    await page.waitForSelector('#map');
  });

  test('should load the map container', async ({ page }) => {
    const map = page.locator('#map');
    await expect(map).toBeVisible();
    // Computed height is usually px, so matching '100%' fails
    // await expect(map).toHaveCSS('height', '100%'); 
  });

  test('should show basemap switcher interactions', async ({ page }) => {
    // Check if toggle button exists
    const toggle = page.locator('.basemap-toggle-link');
    
    // On mobile, the switcher might be collapsed
    if (await toggle.isVisible()) {
        await toggle.click();
    }

    const osmOption = page.locator('[data-basemap="osm"]');
    const satelliteOption = page.locator('[data-basemap="satellite"]');

    await expect(osmOption).toBeVisible();
    await expect(satelliteOption).toBeVisible();

    // Switch to satellite
    await satelliteOption.click();
    await expect(satelliteOption).toHaveClass(/active/);
    await expect(osmOption).not.toHaveClass(/active/);
  });

  test('should have attribution visible on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
        const attribution = page.locator('.leaflet-control-attribution');
        await expect(attribution).toBeVisible();
        
        // CSS Check for our fix
        const bottom = await attribution.evaluate((el) => {
            return window.getComputedStyle(el.closest('.leaflet-bottom')!).bottom;
        });
        
        // It should not be 0px
        expect(bottom).not.toBe('0px');
    }
  });

  test('should load drone restriction layer', async ({ page, isMobile }) => {
    // 1. Open Layer Control
    const layerControl = page.locator('.leaflet-control-layers');
    
    if (isMobile) {
        await layerControl.click(); 
    } else {
        await layerControl.hover();
    }
    
    // Key fix: Wait for the control to actually expand via CSS class
    await expect(layerControl).toHaveClass(/leaflet-control-layers-expanded/);

    // 2. Target the specific label
    const droneLayerLabel = page.getByText('Restrictions Drones (IGN)'); 
    await expect(droneLayerLabel).toBeVisible();
    
    // 3. Check the checkbox associated with "Restrictions drones"
    const restrictionLabel = page.locator('label', { hasText: 'Restrictions Drones (IGN)' });
    const checkbox = restrictionLabel.locator('input');
    
    await expect(checkbox).toBeChecked();
  });

});
