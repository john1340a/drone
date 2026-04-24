import { test, expect } from '@playwright/test';

test.describe('Map Application', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#map');
  });

  test('should load the map container', async ({ page }) => {
    const map = page.locator('#map');
    await expect(map).toBeVisible();
    // MapLibre renders a canvas inside the container
    const canvas = page.locator('#map canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('should show basemap switcher and toggle basemap', async ({ page }) => {
    const toggleBtn = page.locator('.basemap-toggle-btn');
    await expect(toggleBtn).toBeVisible();

    // Initial state: Jawg active, button shows Satellite thumbnail
    const img = toggleBtn.locator('img');
    await expect(img).toHaveAttribute('src', /satellite/);

    // Click to switch
    await toggleBtn.click();

    // After click: basemap is Satellite, button should show OSM/Jawg thumbnail
    await expect(img).toHaveAttribute('src', /osm/);
  });

  test('should display MapLibre attribution', async ({ page }) => {
    const attribution = page.locator('.maplibregl-ctrl-attrib');
    await expect(attribution).toBeVisible();
  });

  test('should open layer control panel on click', async ({ page }) => {
    const layerControl = page.locator('.layer-control');
    await expect(layerControl).toBeVisible();

    // Icon is visible by default, panel is hidden
    const panel = layerControl.locator('.layer-control-panel');
    await expect(panel).toBeHidden();

    // Click on the layers icon to expand
    const icon = layerControl.locator('.layer-control-icon');
    await icon.click();

    // Panel becomes visible via .expanded class
    await expect(layerControl).toHaveClass(/expanded/);
    await expect(panel).toBeVisible();

    // Both "Restrictions" and "Zones Autorisées" checkboxes are present and checked
    const restrictionsCheckbox = panel.locator('#toggle-restrictions');
    await expect(restrictionsCheckbox).toBeChecked();

    const allowedCheckbox = panel.locator('#toggle-allowed');
    await expect(allowedCheckbox).toBeChecked();
  });

  test('should have geocoder with correct placeholder', async ({ page, isMobile }) => {
    const geocoder = page.locator('.geocoder-control');
    await expect(geocoder).toBeVisible();

    const input = geocoder.locator('#geocoder-input');
    await expect(input).toBeAttached();

    // Placeholder differs between mobile and desktop
    const expectedPlaceholder = isMobile ? 'Rechercher...' : 'Rechercher une adresse...';
    await expect(input).toHaveAttribute('placeholder', expectedPlaceholder);
  });

  test('should expand geocoder on focus', async ({ page }) => {
    const wrapper = page.locator('.geocoder-wrapper');
    const input = page.locator('#geocoder-input');

    // Focus the input to trigger expand
    await input.focus();

    // Input becomes visible and usable
    await expect(input).toBeVisible();
  });

  test('should load weather widget and display mocked wind data', async ({ page }) => {
    // Mock the Open-Meteo API
    await page.route('**/api.open-meteo.com/v1/forecast*', async route => {
      const json = {
        current: {
          wind_speed_10m: 15.5,
          wind_direction_10m: 180,
          wind_gusts_10m: 25
        }
      };
      await route.fulfill({ json });
    });

    await page.reload();
    await page.waitForSelector('#map');

    const widget = page.locator('.weather-widget');
    await expect(widget).toBeVisible();

    const speed = widget.locator('#wind-speed');
    await expect(speed).toHaveText('16'); // 15.5 rounded

    // Safety status: 15.5 km/h < 30 and gusts 25 < 40 → safe
    await expect(widget).toHaveClass(/safe/);
  });

  test('should have DOM-TOM territory selector', async ({ page }) => {
    const domtom = page.locator('.domtom-geocoder');
    await expect(domtom).toBeVisible();

    const trigger = domtom.locator('.select-trigger');
    await trigger.click();

    // Dropdown becomes active
    const customSelect = domtom.locator('.custom-select');
    await expect(customSelect).toHaveClass(/active/);

    // All 5 territories are listed
    const options = customSelect.locator('.select-option');
    await expect(options).toHaveCount(5);
  });

  test('layer control and DOM-TOM should be mutually exclusive', async ({ page }) => {
    // Open layer control
    await page.locator('.layer-control .layer-control-icon').click();
    await expect(page.locator('.layer-control')).toHaveClass(/expanded/);

    // Open DOM-TOM → layer control should close
    await page.locator('.domtom-geocoder .select-trigger').click();
    await expect(page.locator('.custom-select')).toHaveClass(/active/);
    await expect(page.locator('.layer-control')).not.toHaveClass(/expanded/);
  });

  test('should display the legend control', async ({ page, isMobile }) => {
    const legend = page.locator('.legend-control');
    await expect(legend).toBeVisible();

    if (isMobile) {
      // On mobile, legend starts collapsed — toggle is visible
      const toggle = legend.locator('.legend-toggle');
      await expect(toggle).toBeVisible();
    } else {
      // Desktop: legend content always visible
      const content = legend.locator('.legend-content');
      await expect(content).toBeVisible();
    }
  });
});
