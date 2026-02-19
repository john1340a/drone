import L from 'leaflet';
import 'leaflet.vectorgrid';
import { PMTiles } from 'pmtiles';
// @ts-ignore
import Pbf from 'pbf';
// @ts-ignore
import { VectorTile } from 'vector-tile';

/**
 * A custom VectorGrid.Protobuf layer that fetches tiles from a PMTiles archive.
 * This bypasses the need for the 'leaflet-pmtiles-layer' plugin which has issues
 * with recent PMTiles versions and Firefox compatibility (Range requests/Cache API).
 */
export default function pmtilesVectorGrid(url: string, options: any) {
    // Create PMTiles instance
    const p = new PMTiles(url);

    // Create a subclass of VectorGrid.Protobuf
    // We can't easily extend via class syntax because Leaflet uses older patterns,
    // so we instantiate and override the internal method.
    
    // We pass the URL just to satisfy the constructor, but we won't use it for fetching.
    const instance = (L as any).vectorGrid.protobuf(url, options);

    // Override the internal _getVectorTilePromise method
    // @ts-ignore
    instance._getVectorTilePromise = async function(coords: L.Coords) {
        // PMTiles expects Z, X, Y
        const z = coords.z;
        const x = coords.x;
        const y = coords.y;

        try {
            // Fetch the tile from PMTiles archive
            const result = await p.getZxy(z, x, y);
            
            if (!result) {
                // Return empty layer set if tile not found
                return { layers: [] };
            }

            // Parse the Vector Title (PBF) manually
            // This logic mimics Leaflet.VectorGrid.Protobuf's internal handling
            const pbf = new Pbf(new Uint8Array(result.data));
            const vectorTile = new VectorTile(pbf);

            // Normalize features (critical for VectorGrid to render them)
            // VectorGrid expects 'json.layers[name].features' to be populated
            for (const layerName in vectorTile.layers) {
                const layer = vectorTile.layers[layerName];
                const feats = [];
                
                for (let i = 0; i < layer.length; i++) {
                    const feat = layer.feature(i);
                    feat.geometry = feat.loadGeometry(); // Unlock geometry
                    feats.push(feat);
                }
                
                // Inject normalized features back into the layer object
                // @ts-ignore
                layer.features = feats;
            }

            return vectorTile;

        } catch (e) {
            console.error('Error fetching/parsing PMTile:', e);
            return { layers: [] };
        }
    };

    return instance;
}
