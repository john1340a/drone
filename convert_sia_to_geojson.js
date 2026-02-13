const fs = require("fs");
const path = require("path");

// Configuration
const INPUT_DIR = path.join(__dirname, "public/data");
const OUTPUT_FILE = path.join(
  __dirname,
  "public/data/restrictions_sia.geojson",
);

// Find the latest UASZones file
const files = fs.readdirSync(INPUT_DIR);
const siaFile = files.find(
  (f) => f.startsWith("UASZones_") && f.endsWith(".json"),
);

if (!siaFile) {
  console.error("❌ No UASZones_*.json file found in public/data/");
  process.exit(1);
}

console.log(`📂 Processing: ${siaFile}`);
let rawData = fs.readFileSync(path.join(INPUT_DIR, siaFile), "utf8");
// Remove BOM if present
if (rawData.charCodeAt(0) === 0xfeff) {
  rawData = rawData.slice(1);
}
const siaData = JSON.parse(rawData);

console.log(`📊 Total Authorization Zones (raw): ${siaData.features.length}`);

// Convert to GeoJSON FeatureCollection
const geojson = {
  type: "FeatureCollection",
  features: [],
};

let count = 0;
let skipped = 0;

siaData.features.forEach((feature) => {
  // 1. Extract Geometry
  // SIA format: feature.geometry is an ARRAY of volumes.
  // Usually we want the horizontal projection of the first volume (or union of all).
  // For simplicity, we take the first valid horizontalProjection (Polygon).

  if (!feature.geometry || feature.geometry.length === 0) {
    skipped++;
    return;
  }

  const volume = feature.geometry[0];
  if (!volume.horizontalProjection) {
    skipped++;
    return;
  }

  // 2. Extract Properties
  // We map SIA fields to our app's expected properties or keep them generic
  const props = {
    id: feature.identifier,
    nom: feature.name,
    type: feature.type, // COMMON, AERO, etc.
    restriction: feature.restriction, // PROHIBITED, RESTRICTED
    reason: feature.reason ? feature.reason.join(", ") : "",
    otherReasonInfo: feature.otherReasonInfo,
    // Vertical limits (AGL is priority for drones)
    min_height: volume.lowerLimit,
    min_ref: volume.lowerVerticalReference, // AGL or AMSL
    max_height: volume.upperLimit,
    max_ref: volume.upperVerticalReference, // AGL or AMSL
    message: feature.message,
    applicability: feature.applicability, // Permanent or not

    // fields for UI styling (compat with previous IGN format)
    limite: `${volume.upperLimit} ${volume.upperVerticalReference}`, // "120 AGL"
    remarque: feature.message || feature.otherReasonInfo,
  };

  let geometry = volume.horizontalProjection;

  // Handle 'Circle' type (ED-269 specific) -> Convert to Polygon
  if (geometry.type === "Circle") {
    if (!geometry.center || !geometry.radius) {
      skipped++;
      return;
    }

    const center = geometry.center; // [lon, lat]
    const radius = geometry.radius; // in meters
    const points = 64;
    const coords = [];

    // Simple approximation: 1 degree lat ~= 111km. 1 degree lon ~= 111km * cos(lat)
    // For short distances, this flat-earth approx is okay. For better precision, use turf.circle or proper geodetic calc.
    // Here we implement a basic geodetic formula for 'destination point'

    const R = 6371000; // Earth radius in meters
    const lat1 = (center[1] * Math.PI) / 180;
    const lon1 = (center[0] * Math.PI) / 180;

    for (let i = 0; i <= points; i++) {
      const brng = (((i * 360) / points) * Math.PI) / 180;
      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(radius / R) +
          Math.cos(lat1) * Math.sin(radius / R) * Math.cos(brng),
      );
      const lon2 =
        lon1 +
        Math.atan2(
          Math.sin(brng) * Math.sin(radius / R) * Math.cos(lat1),
          Math.cos(radius / R) - Math.sin(lat1) * Math.sin(lat2),
        );
      coords.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
    }

    geometry = {
      type: "Polygon",
      coordinates: [coords],
    };
  }

  // 3. Create Feature
  const newFeature = {
    type: "Feature",
    properties: props,
    geometry: geometry, // Now ensured to be Polygon or MultiPolygon (if source was valid)
  };

  geojson.features.push(newFeature);
  count++;
});

// Write Output
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));
console.log(`✅ Conversion complete!`);
console.log(`   - Processed: ${count}`);
console.log(`   - Skipped (no geom): ${skipped}`);
console.log(`   - Output: ${OUTPUT_FILE}`);
