import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import Config from '../config/config';

// Register PMTiles protocol once
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

export default class MapService {
    private map: maplibregl.Map | null;
    private currentBasemap: string;

    constructor() {
        this.map = null;
        this.currentBasemap = 'osm';
    }

    initializeMap(containerId: string): maplibregl.Map {
        const config = Config.MAP_CONFIG;
        const baseMaps = Config.LAYERS_CONFIG.baseMaps;

        this.map = new maplibregl.Map({
            container: containerId,
            style: {
                version: 8,
                sources: {
                    'jawg-raster': {
                        type: 'raster',
                        tiles: baseMaps.jawg.tiles,
                        tileSize: baseMaps.jawg.tileSize,
                        attribution: baseMaps.jawg.attribution,
                        maxzoom: baseMaps.jawg.maxzoom
                    },
                    'satellite-raster': {
                        type: 'raster',
                        tiles: baseMaps.satellite.tiles,
                        tileSize: baseMaps.satellite.tileSize,
                        attribution: baseMaps.satellite.attribution,
                        maxzoom: baseMaps.satellite.maxzoom
                    }
                },
                layers: [
                    {
                        id: 'jawg-layer',
                        type: 'raster',
                        source: 'jawg-raster',
                        layout: { visibility: 'visible' }
                    },
                    {
                        id: 'satellite-layer',
                        type: 'raster',
                        source: 'satellite-raster',
                        layout: { visibility: 'none' }
                    }
                ]
            },
            center: config.center,
            zoom: config.zoom,
            minZoom: config.minZoom,
            maxZoom: config.maxZoom,
            attributionControl: false
        });

        this.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

        return this.map;
    }

    setBaseLayer(layerKey: string): void {
        if (!this.map) return;

        // Hide all basemap layers, show the requested one
        const layers = ['jawg-layer', 'satellite-layer'];
        const targetId = layerKey === 'satellite' ? 'satellite-layer' : 'jawg-layer';

        for (const id of layers) {
            this.map.setLayoutProperty(id, 'visibility', id === targetId ? 'visible' : 'none');
        }

        this.currentBasemap = layerKey;
    }

    getCurrentBasemap(): string {
        return this.currentBasemap;
    }

    getMap(): maplibregl.Map | null {
        return this.map;
    }

    fitBounds(bounds: maplibregl.LngLatBoundsLike, options: maplibregl.FitBoundsOptions = {}): void {
        if (this.map) {
            this.map.fitBounds(bounds, options);
        }
    }

    setView(center: [number, number], zoom: number): void {
        if (this.map) {
            this.map.flyTo({ center, zoom, duration: 1500 });
        }
    }
}
