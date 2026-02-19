import L from 'leaflet';
import 'leaflet.vectorgrid';
import { PMTiles } from 'pmtiles';
// @ts-ignore
import Pbf from 'pbf';
// @ts-ignore
import { VectorTile } from 'vector-tile';
// @ts-ignore
import pako from 'pako';

/**
 * Custom Source implementation for PMTiles to read from a Blob.
 * Necessary for Firefox workaround on GitHub Pages where Range Requests are flaky.
 */
class BlobSource {
    blob: Blob;
    key: string;

    constructor(blob: Blob, key: string) {
        this.blob = blob;
        this.key = key;
    }

    getKey() {
        return this.key;
    }

    async getBytes(offset: number, length: number) {
        const slice = this.blob.slice(offset, offset + length);
        const buffer = await slice.arrayBuffer();
        return { data: buffer };
    }
}

/**
 * Custom adapter to load PMTiles in Leaflet.VectorGrid.
 * 
 * Features:
 * - Uses official `pmtiles` v4 library.
 * - Handles Gzip decompression (via `pako`).
 * - **Firefox Workaround**: Fetches the full file as a Blob on Firefox to bypass GitHub Pages Range Request issues.
 */
export default function pmtilesVectorGrid(url: string, options: any) {
    let pInstance: PMTiles | null = null;
    let pPromise: Promise<PMTiles> | null = null;

    // Lazy initialization of PMTiles instance
    const getPMTilesInstance = async () => {
        if (pInstance) return pInstance;
        if (pPromise) return pPromise;

        pPromise = (async () => {
            const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            
            if (isFirefox) {
                // GitHub Pages + Firefox + Range Requests = Flaky (Decoding failed)
                // Solution: Download the full file as a Blob and read from memory.
                console.warn(`[PMTiles] Firefox detected. Downloading full file "${url}" to bypass Range Request issues.`);
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Failed to fetch PMTiles: ${response.status}`);
                    const blob = await response.blob();
                    return new PMTiles(new BlobSource(blob, url));
                } catch (e) {
                    console.error('[PMTiles] Full download failed:', e);
                    throw e;
                }
            } else {
                // Standard HTTP Range Requests for other browsers
                return new PMTiles(url);
            }
        })();

        try {
            pInstance = await pPromise;
            return pInstance;
        } catch (e) {
            pPromise = null; // Reset on error to allow retry?
            throw e;
        }
    };

    // Create a subclass instance
    const instance = (L as any).vectorGrid.protobuf(url, options);

    // Override the tile loader
    // @ts-ignore
    instance._getVectorTilePromise = async function(coords: any) {
        try {
            const p = await getPMTilesInstance();
            const result = await p.getZxy(coords.z, coords.x, coords.y);
            if (!result) return { layers: [] };

            let data = new Uint8Array(result.data);

            // Check for Gzip magic header (1f 8b)
            if (data[0] === 0x1f && data[1] === 0x8b) {
                try {
                    data = pako.inflate(data);
                } catch (err) {
                    console.error('Error inflating PMTile:', err);
                    return { layers: [] };
                }
            }

            const pbf = new Pbf(data);
            const vectorTile = new VectorTile(pbf);

            // Normalize features into the structure VectorGrid expects
            for (const layerName in vectorTile.layers) {
                const layer = vectorTile.layers[layerName];
                const feats = [];
                for (let i = 0; i < layer.length; i++) {
                     const feat = layer.feature(i);
                     feat.geometry = feat.loadGeometry();
                     feats.push(feat);
                }
                // @ts-ignore
                layer.features = feats;
            }

            return vectorTile;

        } catch (e) {
            // Suppress errors during map pan/zoom to avoid console spam
            // console.error('Error fetching/parsing PMTile:', e);
            return { layers: [] };
        }
    };

    return instance;
}
