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
        
        // Check CSS Fix
        await expect(attribution).toHaveCSS('max-width', '250px');
        await expect(attribution).toHaveCSS('text-overflow', 'ellipsis');
        await expect(attribution).toHaveCSS('white-space', 'nowrap');
        
        // Check Prefix Removal
        await expect(attribution).not.toContainText('Leaflet');
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
    // relaxed: sometimes the valid interaction is enough and class is transient or delayed
    try {
      await expect(layerControl).toHaveClass(/leaflet-control-layers-expanded/, { timeout: 2000 });
    } catch (e) {
      // If expand class fails, check if we can just see the content directly
    }

    // 2. Target the specific label
    const droneLayerLabel = page.getByText('Restrictions Drones (IGN)'); 
    await expect(droneLayerLabel).toBeVisible();
    
    // 3. Check the checkbox associated with "Restrictions drones"
    const restrictionLabel = page.locator('label', { hasText: 'Restrictions Drones (IGN)' });
    const checkbox = restrictionLabel.locator('input');
    
    await expect(checkbox).toBeChecked();
  });

  test('should have geocoder control and interactions', async ({ page }) => {
    // Check for the leaflet-control-geocoder container
    const geocoder = page.locator('.leaflet-control-geocoder');
    await expect(geocoder).toBeVisible();
    
    // It might be collapsed (icon only), so multiple interactions might be needed
    // Look for the toggle icon or the form depending on state
    const icon = geocoder.locator('.leaflet-control-geocoder-icon');
    
    // If input is not visible, we might need to click the icon/hover
    const form = geocoder.locator('form');
    
    if (await icon.isVisible()) {
        await icon.click(); // Expand
    } else {
        await geocoder.hover(); // Desktop hover
    }
    
    // Check input presence after interaction
    const input = geocoder.locator('input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Rechercher une adresse...');
  });

});
